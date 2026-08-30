import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Card } from '@/components/ui/Card';
import { ShieldAlert } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/config/brand';

export const metadata = {
  title: `Admin Control Center — ${BRAND_CONFIG.name}`,
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Check admin role in profiles table
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  const isDesignatedAdminEmail =
    user.email?.toLowerCase() === 'alinoordot1@gmail.com' ||
    (process.env.ADMIN_EMAIL && user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase());

  let isAdmin = profile?.role === 'admin' && profile?.status === 'active';

  // Auto-promote designated admin email if not already set
  if (isDesignatedAdminEmail && !isAdmin) {
    await adminSupabase.from('profiles').upsert(
      {
        id: user.id,
        role: 'admin',
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    isAdmin = true;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-8rem)] py-20 px-4 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center space-y-4 bg-white border-red-200 shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mx-auto border border-red-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Unauthorized Access</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account ({user.email}) does not have administrative privileges. If you are the system administrator, update your role in the Supabase <code className="text-slate-900 font-mono font-semibold">profiles</code> table.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <AdminDashboard />
    </div>
  );
}
