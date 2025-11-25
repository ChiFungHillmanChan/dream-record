'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe, STRIPE_PRICES } from '@/app/services/stripe';

export type CheckoutResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Create a Stripe Checkout session
 */
export async function createCheckoutSession(
  billingPeriod: 'monthly' | 'yearly'
): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe not configured. Please contact support.' };
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { id: true, email: true, name: true, plan: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Select the appropriate price ID
  const priceId = billingPeriod === 'yearly'
    ? STRIPE_PRICES.DEEP_YEARLY
    : STRIPE_PRICES.DEEP_MONTHLY;

  if (!priceId) {
    return {
      success: false,
      error: `Stripe price not configured for ${billingPeriod} plan. Please contact support.`,
    };
  }

  // Get base URL - use NEXT_PUBLIC_BASE_URL or fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

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
    success_url: `${baseUrl}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/settings?canceled=true`,
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
    // Allow customers to apply promotion codes
    allow_promotion_codes: true,
  });

  if (!checkoutSession.url) {
    return { success: false, error: 'Failed to create checkout session' };
  }

  return { success: true, url: checkoutSession.url };
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createCustomerPortalSession(): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { email: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Find the customer in Stripe
  const customers = await stripe.customers.list({
    email: user.email,
    limit: 1,
  });

  if (customers.data.length === 0) {
    return { success: false, error: 'No subscription found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  // Create customer portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: `${baseUrl}/settings`,
  });

  return { success: true, url: portalSession.url };
}

