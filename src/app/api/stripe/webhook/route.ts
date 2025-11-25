import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/app/services/stripe';
import { PLANS } from '@/lib/constants';
import Stripe from 'stripe';

/**
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhook events for subscription management
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get the raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle successful checkout session
 * Works with both Checkout API (metadata.userId) and Payment Links (client_reference_id)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Payment Links use client_reference_id, Checkout API uses metadata
  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session (checked client_reference_id and metadata)');
    return;
  }

  // Determine billing period from the subscription or default to monthly
  // Payment Links: Check the price amount to determine if yearly
  // Checkout API: Use metadata.billingPeriod
  let billingPeriod = session.metadata?.billingPeriod ?? 'monthly';
  
  // For Payment Links, check the amount to determine yearly vs monthly
  // HK$200 yearly = 20000 cents, HK$29.99 monthly = 2999 cents
  if (session.amount_total && session.amount_total >= 10000) {
    billingPeriod = 'yearly';
  }
  
  const durationMonths = billingPeriod === 'yearly' ? 12 : 1;
  
  const planExpiresAt = new Date();
  planExpiresAt.setMonth(planExpiresAt.getMonth() + durationMonths);

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: PLANS.DEEP,
      planExpiresAt,
    },
  });

  console.log(`User ${userId} upgraded to DEEP plan (${billingPeriod})`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Try to get userId from metadata first
  let userId: string | undefined = subscription.metadata?.userId;
  
  // If no userId in metadata, try to find user by customer email
  if (!userId) {
    const stripe = getStripe();
    if (stripe && subscription.customer) {
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && 'email' in customer && customer.email) {
        const user = await prisma.user.findUnique({
          where: { email: customer.email },
          select: { id: true },
        });
        userId = user?.id;
      }
    }
  }
  
  if (!userId) {
    console.log('Could not find userId for subscription');
    return;
  }

  // Update plan expiry based on subscription currentPeriodEnd
  // The Stripe API returns this as snake_case but types may vary
  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
  const planExpiresAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Check subscription status
  const isActive = ['active', 'trialing'].includes(subscription.status);

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: isActive ? PLANS.DEEP : PLANS.FREE,
      planExpiresAt: isActive ? planExpiresAt : null,
    },
  });

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Try to get userId from metadata first
  let userId: string | undefined = subscription.metadata?.userId;
  
  // If no userId in metadata, try to find user by customer email
  if (!userId) {
    const stripe = getStripe();
    if (stripe && subscription.customer) {
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && 'email' in customer && customer.email) {
        const user = await prisma.user.findUnique({
          where: { email: customer.email },
          select: { id: true },
        });
        userId = user?.id;
      }
    }
  }
  
  if (!userId) {
    console.log('Could not find userId for subscription deletion');
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: PLANS.FREE,
      planExpiresAt: null,
    },
  });

  console.log(`Subscription cancelled for user ${userId}`);
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // The subscription updated event will handle the plan update
  console.log(`Invoice payment succeeded: ${invoice.id}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`);
  // Could send email notification or downgrade plan after grace period
}

