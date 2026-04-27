// backend/src/routes/billing.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { stripe, PLAN_PRICE_IDS } from '../services/stripe';
import type { Plan } from '../db/types';

interface CardInfo { brand: string; last4: string; exp_month: number; exp_year: number }
interface PaymentMethodLike { card?: CardInfo }
interface CustomerLike { invoice_settings?: { default_payment_method?: PaymentMethodLike | string | null } }

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

    // Step 1: verify the profile row exists using only base columns
    const { data: basicProfile, error: basicErr } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', req.user.id)
      .single();

    if (basicErr && basicErr.code !== 'PGRST116') {
      console.error('[BILLING] Profile fetch error:', basicErr);
    }

    // Fall back to JWT email if the profile row is missing (trigger may not have fired)
    const email = basicProfile?.email ?? req.user.email;
    if (!email) throw new AppError('User account not found', 404, 'NOT_FOUND');

    // Step 2: get stripe_customer_id separately — column may not exist on older DBs
    let customerId: string | undefined;
    const { data: billingData, error: billingColErr } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!billingColErr && billingData) {
      customerId = (billingData as { stripe_customer_id?: string | null }).stripe_customer_id ?? undefined;
    } else if (billingColErr) {
      console.warn('[BILLING] stripe_customer_id unavailable (run migration):', billingColErr.message);
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
      if (updErr) console.warn('[BILLING] Could not persist stripe_customer_id:', updErr.message);
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: req.user.id,
      metadata: { userId: req.user.id },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing?billing=success`,
      cancel_url: `${frontendUrl}/billing?billing=cancelled`,
    });

    res.json({ data: { url: session.url } });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/sync — pull latest subscription from Stripe and update plan (used after checkout redirect)
router.get('/sync', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.json({ data: { plan: 'free' } });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      await supabase.from('profiles').update({ plan: 'free', stripe_subscription_id: null }).eq('id', req.user.id);
      return res.json({ data: { plan: 'free' } });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id;
    const plan: Plan = PLAN_PRICE_IDS[priceId] ?? 'free';

    await supabase
      .from('profiles')
      .update({ plan, stripe_subscription_id: sub.id })
      .eq('id', req.user.id);

    return res.json({ data: { plan } });
  } catch (err) {
    return next(err);
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

// GET /api/billing/subscription — fetch current subscription details with payment method
router.get('/subscription', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.json({ data: { plan: profile?.plan ?? 'free', subscription: null } });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
      expand: ['data.default_payment_method', 'data.customer'],
    });

    if (subscriptions.data.length === 0) {
      return res.json({ data: { plan: profile.plan, subscription: null } });
    }

    const sub = subscriptions.data[0];
    const periodEnd: number = sub.items.data[0]?.current_period_end ?? 0;

    let pm: PaymentMethodLike | null = null;
    const rawPm = sub.default_payment_method;
    if (rawPm && typeof rawPm === 'object') {
      pm = rawPm as PaymentMethodLike;
    } else {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id, {
        expand: ['invoice_settings.default_payment_method'],
      }) as CustomerLike;
      const invoicePm = customer.invoice_settings?.default_payment_method;
      if (invoicePm && typeof invoicePm === 'object') pm = invoicePm as PaymentMethodLike;
    }

    return res.json({
      data: {
        plan: profile.plan,
        subscription: {
          id: sub.id,
          status: sub.status,
          current_period_end: periodEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
          payment_method: pm?.card
            ? { brand: pm.card.brand, last4: pm.card.last4, exp_month: pm.card.exp_month, exp_year: pm.card.exp_year }
            : null,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/billing/cancel — cancel subscription at period end
router.post('/cancel', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new AppError('No subscription found', 400, 'NO_SUBSCRIPTION');
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new AppError('No active subscription', 400, 'NO_SUBSCRIPTION');
    }

    await stripe.subscriptions.update(subscriptions.data[0].id, { cancel_at_period_end: true });

    return res.json({ data: { cancelled: true } });
  } catch (err) {
    return next(err);
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
