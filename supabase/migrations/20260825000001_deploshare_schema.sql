-- ==============================================================================
-- DeploShare — Complete Database Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ------------------------------------------------------------------------------
-- 2. SHARES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    share_code VARCHAR(6) NOT NULL UNIQUE CHECK (share_code ~ '^[0-9]{6}$'),
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('file', 'text')),
    storage_path TEXT,
    text_content TEXT,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    password_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    max_downloads INTEGER,
    download_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    burn_after_download BOOLEAN NOT NULL DEFAULT false,
    consumed BOOLEAN NOT NULL DEFAULT false,
    allow_download BOOLEAN NOT NULL DEFAULT true,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for shares
CREATE UNIQUE INDEX IF NOT EXISTS idx_shares_code ON public.shares(share_code);
CREATE INDEX IF NOT EXISTS idx_shares_owner ON public.shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON public.shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_shares_type ON public.shares(type);
CREATE INDEX IF NOT EXISTS idx_shares_revoked ON public.shares(revoked);
CREATE INDEX IF NOT EXISTS idx_shares_consumed ON public.shares(consumed);

-- ------------------------------------------------------------------------------
-- 3. SHARE EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'password_success', 'password_failure', 'revoke', 'access_failure')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_share_events_share_id ON public.share_events(share_id);
CREATE INDEX IF NOT EXISTS idx_share_events_type ON public.share_events(event_type);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON public.share_events(created_at);

-- ------------------------------------------------------------------------------
-- 4. REPORTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'malware', 'copyright', 'abuse', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_share_id ON public.reports(share_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ------------------------------------------------------------------------------
-- 5. SUBSCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'BUSINESS')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- ------------------------------------------------------------------------------
-- 6. RATE LIMITS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL UNIQUE,
    attempts INTEGER NOT NULL DEFAULT 1,
    locked_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);

-- ------------------------------------------------------------------------------
-- 7. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role, status)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'user',
        'active'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create initial free subscription
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (new.id, 'FREE', 'active')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Atomic Increment View Function
CREATE OR REPLACE FUNCTION public.increment_share_view(p_share_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.shares
    SET view_count = view_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_share_id;

    INSERT INTO public.share_events (share_id, event_type)
    VALUES (p_share_id, 'view');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Download Verification and Burn Logic
CREATE OR REPLACE FUNCTION public.atomic_consume_download(p_share_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_share public.shares%ROWTYPE;
    v_can_download BOOLEAN := false;
    v_message TEXT := '';
BEGIN
    -- Lock row for update to prevent concurrent race condition
    SELECT * INTO v_share
    FROM public.shares
    WHERE id = p_share_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Share not found');
    END IF;

    IF v_share.revoked THEN
        RETURN jsonb_build_object('success', false, 'error', 'Share is revoked');
    END IF;

    IF v_share.consumed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Share has been consumed');
    END IF;

    IF v_share.expires_at < timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Share has expired');
    END IF;

    IF v_share.max_downloads IS NOT NULL AND v_share.download_count >= v_share.max_downloads THEN
        RETURN jsonb_build_object('success', false, 'error', 'Download limit reached');
    END IF;

    -- Increment download count
    v_share.download_count := v_share.download_count + 1;

    -- Check if burned after download or max download reached
    IF v_share.burn_after_download = true OR (v_share.max_downloads IS NOT NULL AND v_share.download_count >= v_share.max_downloads) THEN
        v_share.consumed := true;
    END IF;

    UPDATE public.shares
    SET download_count = v_share.download_count,
        consumed = v_share.consumed,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_share_id;

    -- Record download event
    INSERT INTO public.share_events (share_id, event_type)
    VALUES (p_share_id, 'download');

    RETURN jsonb_build_object(
        'success', true,
        'download_count', v_share.download_count,
        'consumed', v_share.consumed,
        'storage_path', v_share.storage_path,
        'file_name', v_share.file_name,
        'mime_type', v_share.mime_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- Shares Policies
CREATE POLICY "Users can view own shares"
    ON public.shares FOR SELECT
    USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and anon can create shares"
    ON public.shares FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR (owner_id IS NULL AND auth.uid() IS NULL));

CREATE POLICY "Users can update own shares"
    ON public.shares FOR UPDATE
    USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own shares"
    ON public.shares FOR DELETE
    USING (owner_id = auth.uid() OR public.is_admin());

-- Share Events Policies
CREATE POLICY "Users can view events for own shares"
    ON public.share_events FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.shares WHERE shares.id = share_events.share_id AND shares.owner_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "System can insert share events"
    ON public.share_events FOR INSERT
    WITH CHECK (true);

-- Reports Policies
CREATE POLICY "Admins can view all reports"
    ON public.reports FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Anyone can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update reports"
    ON public.reports FOR UPDATE
    USING (public.is_admin());

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.is_admin());

-- Rate Limits Policies
CREATE POLICY "Admins can view rate limits"
    ON public.rate_limits FOR SELECT
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. STORAGE BUCKET CONFIGURATION
-- ------------------------------------------------------------------------------
-- Insert storage bucket 'shares' as private if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'shares',
    'shares',
    false,
    2147483648, -- 2 GB
    NULL
)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Storage Policies
CREATE POLICY "Allow authenticated and anon uploads to shares"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'shares');

CREATE POLICY "Allow owners and admins to read objects"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'shares' AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_admin()
        )
    );

CREATE POLICY "Allow owners and admins to delete objects"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'shares' AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR public.is_admin()
        )
    );
