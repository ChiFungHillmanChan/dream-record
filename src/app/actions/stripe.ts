'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { STRIPE_PAYMENT_LINKS, getStripe } from '@/app/services/stripe';

export type CheckoutResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Get Stripe Payment Link URL with user tracking
 * Uses pre-configured Payment Links from Stripe Dashboard
 */
export async function createCheckoutSession(
  billingPeriod: 'monthly' | 'yearly'
): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session?.userId) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { id: true, email: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Get the appropriate Payment Link
  const paymentLink = billingPeriod === 'yearly'
    ? STRIPE_PAYMENT_LINKS.DEEP_YEARLY
    : STRIPE_PAYMENT_LINKS.DEEP_MONTHLY;

  // Append client_reference_id to track the user
  // This will be included in the webhook event
  const url = new URL(paymentLink);
  url.searchParams.set('client_reference_id', user.id);
  url.searchParams.set('prefilled_email', user.email);

  return { success: true, url: url.toString() };
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

