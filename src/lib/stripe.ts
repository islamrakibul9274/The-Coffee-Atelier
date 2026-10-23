import Stripe from 'stripe';

let stripe: Stripe | undefined;
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === '[SENSITIVE]') throw new Error('Payment service is not configured.');
  return stripe ??= new Stripe(key);
}
