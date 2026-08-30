/**
 * DeploShare Stripe Payment & Subscription Infrastructure
 */

export const STRIPE_PLANS = {
  PRO: {
    id: 'price_deploshare_pro_monthly',
    name: 'DeploShare Pro',
    price: 9,
    currency: 'usd',
    interval: 'month',
    features: [
      'Upload files up to 2 GB',
      '30-day custom expiration timers',
      'Unlimited active shares',
      'Advanced share analytics & logs',
      'Priority download speeds',
    ],
  },
  BUSINESS: {
    id: 'price_deploshare_business_monthly',
    name: 'DeploShare Business',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: [
      'Upload files up to 10 GB',
      '90-day retention policies',
      'Dedicated organization team vault',
      'REST API unlimited rate limits',
      '24/7 Priority support',
    ],
  },
} as const;

export interface CheckoutSessionResult {
  sessionId?: string;
  url?: string;
}

/**
 * Creates a Stripe Checkout Session or returns checkout link.
 */
export async function createStripeCheckoutUrl(
  planType: 'PRO' | 'BUSINESS',
  userId: string,
  userEmail: string,
  originUrl: string
): Promise<string> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const plan = STRIPE_PLANS[planType];

  if (!stripeSecretKey) {
    // If Stripe test secret is not configured, generate a mock success portal for development
    return `${originUrl}/dashboard?payment_success=true&tier=${planType.toLowerCase()}`;
  }

  // Real Stripe API call via standard Fetch
  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('payment_method_types[0]', 'card');
  params.append('success_url', `${originUrl}/dashboard?payment_success=true&tier=${planType.toLowerCase()}&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${originUrl}/dashboard?payment_cancelled=true`);
  params.append('customer_email', userEmail);
  params.append('client_reference_id', userId);
  params.append('metadata[user_id]', userId);
  params.append('metadata[plan_type]', planType);

  params.append('line_items[0][price_data][currency]', plan.currency);
  params.append('line_items[0][price_data][product_data][name]', plan.name);
  params.append('line_items[0][price_data][unit_amount]', String(plan.price * 100));
  params.append('line_items[0][price_data][recurring][interval]', plan.interval);
  params.append('line_items[0][quantity]', '1');

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await res.json();
  if (!res.ok || !session.url) {
    throw new Error(session.error?.message || 'Failed to initialize Stripe checkout session.');
  }

  return session.url;
}
