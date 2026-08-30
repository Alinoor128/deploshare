import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: Record<string, unknown>;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = event.type as string;
    const adminSupabase = createAdminClient();

    // 1. Checkout Session Completed (Initial Purchase)
    if (eventType === 'checkout.session.completed') {
      const session = event.data as { object: { client_reference_id?: string; metadata?: { user_id?: string; plan_type?: string } } };
      const userId = session.object.client_reference_id || session.object.metadata?.user_id;
      const planType = (session.object.metadata?.plan_type || 'PRO').toUpperCase();

      if (userId) {
        // Upsert subscription record
        await adminSupabase.from('subscriptions').upsert(
          {
            user_id: userId,
            plan: planType,
            status: 'active',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        // Update profile status if needed
        await adminSupabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
    }

    // 2. Subscription Deleted / Cancelled
    if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data as { object: { metadata?: { user_id?: string } } };
      const userId = subscription.object.metadata?.user_id;

      if (userId) {
        await adminSupabase.from('subscriptions').upsert(
          {
            user_id: userId,
            plan: 'FREE',
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
    }

    return NextResponse.json({ received: true, status: 'processed' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
