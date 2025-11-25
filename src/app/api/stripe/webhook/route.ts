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
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const billingPeriod = session.metadata?.billingPeriod ?? 'monthly';
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
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.log('No userId in subscription metadata');
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
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.log('No userId in subscription metadata');
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

