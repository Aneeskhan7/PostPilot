// backend/src/services/stripe.ts
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error('Missing STRIPE_SECRET_KEY');

export const stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' });

export const PLAN_PRICE_IDS: Record<string, 'pro' | 'unlimited'> = {};

export function buildPlanPriceMap(): void {
  const proId = process.env.STRIPE_PRO_PRICE_ID;
  const unlimitedId = process.env.STRIPE_UNLIMITED_PRICE_ID;
  if (proId) PLAN_PRICE_IDS[proId] = 'pro';
  if (unlimitedId) PLAN_PRICE_IDS[unlimitedId] = 'unlimited';
}
