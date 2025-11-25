import Stripe from 'stripe';

// Stripe instance cache
let stripeInstance: Stripe | null = null;

/**
 * Get Stripe instance (lazy initialization)
 * This is a utility function, not a server action
 */
export function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY not configured');
    return null;
  }
  
  stripeInstance = new Stripe(secretKey);
  return stripeInstance;
}

/**
 * Stripe Payment Links - Pre-configured checkout pages
 * These links are created in Stripe Dashboard > Payment Links
 */
export const STRIPE_PAYMENT_LINKS = {
  // Monthly plan: HK$29.99/month
  DEEP_MONTHLY: 'https://buy.stripe.com/14A5kF0Jx8jO6VRfdC2ZO01',
  // Yearly plan: HK$200/year
  DEEP_YEARLY: 'https://buy.stripe.com/7sY4gBgIvcA43JFghG2ZO02',
} as const;

/**
 * Get Stripe Price IDs from environment (for Checkout Sessions API)
 * Only needed if using programmatic checkout instead of Payment Links
 */
export function getStripePrices() {
  return {
    DEEP_MONTHLY: process.env.STRIPE_PRICE_DEEP_MONTHLY ?? '',
    DEEP_YEARLY: process.env.STRIPE_PRICE_DEEP_YEARLY ?? '',
  };
}

// Re-export for convenience
export const STRIPE_PRICES = {
  get DEEP_MONTHLY() { return process.env.STRIPE_PRICE_DEEP_MONTHLY ?? ''; },
  get DEEP_YEARLY() { return process.env.STRIPE_PRICE_DEEP_YEARLY ?? ''; },
};

