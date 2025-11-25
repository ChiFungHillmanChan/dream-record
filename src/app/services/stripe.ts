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
 * Get Stripe Price IDs from environment
 * These should be configured in Stripe Dashboard first
 */
export function getStripePrices() {
  return {
    // Monthly plan: HK$39.99/month
    DEEP_MONTHLY: process.env.STRIPE_PRICE_DEEP_MONTHLY ?? '',
    // Yearly plan: HK$143.96/year (70% off)  
    DEEP_YEARLY: process.env.STRIPE_PRICE_DEEP_YEARLY ?? '',
  };
}

// Re-export for convenience
export const STRIPE_PRICES = {
  get DEEP_MONTHLY() { return process.env.STRIPE_PRICE_DEEP_MONTHLY ?? ''; },
  get DEEP_YEARLY() { return process.env.STRIPE_PRICE_DEEP_YEARLY ?? ''; },
};

