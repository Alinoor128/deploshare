import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createStripeCheckoutUrl } from '@/lib/payments/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to subscribe.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const planType = (body.plan || 'PRO').toUpperCase() as 'PRO' | 'BUSINESS';

    if (planType !== 'PRO' && planType !== 'BUSINESS') {
      return NextResponse.json(
        { success: false, error: 'Invalid plan selected.' },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;
    const checkoutUrl = await createStripeCheckoutUrl(
      planType,
      user.id,
      user.email || '',
      origin
    );

    return NextResponse.json({
      success: true,
      url: checkoutUrl,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Checkout failed.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
