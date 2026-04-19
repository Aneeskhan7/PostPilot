// backend/src/routes/billing.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { stripe, PLAN_PRICE_IDS } from '../services/stripe';
import type { Plan } from '../db/types';

const router = Router();

const KNOWN_PRICE_IDS = (): string[] =>
  [process.env.STRIPE_PRO_PRICE_ID, process.env.STRIPE_UNLIMITED_PRICE_ID].filter(Boolean) as string[];

// POST /api/billing/checkout — create a Stripe Checkout session
router.post('/checkout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { priceId } = z.object({ priceId: z.string().min(1) }).parse(req.body);

    if (!KNOWN_PRICE_IDS().includes(priceId)) {
      throw new AppError('Invalid price ID', 400, 'VALIDATION_ERROR');
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (profileErr || !profile) throw new AppError('Profile not found', 404, 'NOT_FOUND');

    let customerId = profile.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: req.user.id,
      metadata: { userId: req.user.id },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings?billing=success`,
      cancel_url: `${frontendUrl}/settings?billing=cancelled`,
    });

    res.json({ data: { url: session.url } });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/portal — create a Stripe Customer Portal session
router.post('/portal', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (profileErr || !profile) throw new AppError('Profile not found', 404, 'NOT_FOUND');

    if (!profile.stripe_customer_id) {
      throw new AppError('No subscription found', 400, 'NO_SUBSCRIPTION');
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${frontendUrl}/settings`,
    });

    res.json({ data: { url: session.url } });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/webhook — Stripe sends events here (raw body required)
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('[BILLING] Webhook error:', msg);
    res.status(400).json({ error: msg });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = (session.metadata?.userId ?? session.client_reference_id) as string | null;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

        if (!userId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id;
        const plan: Plan = PLAN_PRICE_IDS[priceId] ?? 'free';

        await supabase
          .from('profiles')
          .update({ plan, stripe_subscription_id: subscriptionId, stripe_customer_id: customerId ?? undefined })
          .eq('id', userId);

        console.log(`[BILLING] User ${userId} upgraded to ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const priceId = sub.items.data[0]?.price.id;
        const plan: Plan = PLAN_PRICE_IDS[priceId] ?? 'free';

        await supabase
          .from('profiles')
          .update({ plan, stripe_subscription_id: sub.id })
          .eq('stripe_customer_id', customerId);

        console.log(`[BILLING] Subscription updated for customer ${customerId} → ${plan}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        await supabase
          .from('profiles')
          .update({ plan: 'free', stripe_subscription_id: null })
          .eq('stripe_customer_id', customerId);

        console.log(`[BILLING] Subscription cancelled for customer ${customerId} → free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as { id: string } | null)?.id;
        console.warn(`[BILLING] Payment failed for customer ${customerId}`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[BILLING] Webhook handler error:', err);
  }

  res.json({ received: true });
});

export default router;
