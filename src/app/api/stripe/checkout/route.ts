import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe, STRIPE_PRICES } from '@/app/services/stripe';

/**
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe Checkout session for subscription
 * 
 * Body: { billingPeriod: 'monthly' | 'yearly' }
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { billingPeriod } = body;

  if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
    return NextResponse.json(
      { error: 'Invalid billing period' },
      { status: 400 }
    );
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Select the appropriate price ID
  const priceId = billingPeriod === 'yearly' 
    ? STRIPE_PRICES.DEEP_YEARLY 
    : STRIPE_PRICES.DEEP_MONTHLY;

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for ${billingPeriod} plan` },
      { status: 500 }
    );
  }

  // Get base URL for redirects
  const origin = request.headers.get('origin') ?? 'http://localhost:3000';

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: user.email,
    success_url: `${origin}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/settings?canceled=true`,
    metadata: {
      userId: user.id,
      billingPeriod,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        billingPeriod,
      },
    },
  });

  return NextResponse.json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  });
}

