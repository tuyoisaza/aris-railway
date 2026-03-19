import express, { Request, Response } from 'express';
import { supabase } from '../db';
import stripe from '../stripe';
import logger from '../logger';

const router = express.Router();

router.post('/stripe', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    let event: any;

    try {
        // req.body must be a Buffer here. Ensure index.js passes it correctly.
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        (logger as any).logError('Webhook signature verification failed', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    // Idempotency check
    const { data: existing } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('id', event.id)
        .maybeSingle();

    if (existing) {
        logger.info('Duplicate webhook event, already processed', { eventId: event.id });
        return res.json({ received: true, status: 'duplicate' });
    }

    try {
        // Handle Events
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            default:
            // Unhandled event type
        }

        // Mark processed
        await supabase.from('webhook_events').insert({
            id: event.id,
            type: event.type
        });

        res.json({ received: true });
    } catch (error: any) {
        (logger as any).logError('Webhook processing error', error, { eventId: event.id });
        res.status(200).json({ received: true, error: 'Processing failed, logged' });
    }
});

async function handleCheckoutSessionCompleted(session: any) {
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    if (!userId) return;

    logger.info('Processing checkout.session.completed', { userId, subscriptionId });

    // Initial UPSERT
    const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: 'active',
        created_at: new Date()
    }, { onConflict: 'user_id' });

    // Sync to profiles
    await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', userId);

    if (error) throw error;
}

async function handleInvoicePaymentSucceeded(invoice: any) {
    const subscriptionId = invoice.subscription;
    // We need to find the user associated with this subscription
    if (!subscriptionId) return;

    logger.info('Processing invoice.payment_succeeded', { subscriptionId });

    // Update status to active (in case it was past_due)
    // We might not have user_id easily here if not in metadata, but we can update by stripe_subscription_id
    const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('stripe_subscription_id', subscriptionId);

    // Sync to profiles (Need to find user_id first, or use a join? simpler to fetch sub first)
    const { data: sub } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscriptionId).single();
    if (sub) {
        await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', sub.user_id);
    }

    if (error) throw error;
}

async function handleSubscriptionUpdated(subscription: any) {
    const subscriptionId = subscription.id;
    const status = subscription.status;

    logger.info('Processing customer.subscription.updated', { subscriptionId, status });

    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: status,
            current_period_end: new Date(subscription.current_period_end * 1000)
        })
        .eq('stripe_subscription_id', subscriptionId);

    // Sync to profiles
    const { data: sub } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscriptionId).single();
    if (sub) {
        await supabase.from('profiles').update({ subscription_status: status }).eq('id', sub.user_id);
    }

    if (error) throw error;
}

async function handleSubscriptionDeleted(subscription: any) {
    const subscriptionId = subscription.id;

    logger.info('Processing customer.subscription.deleted', { subscriptionId });

    const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscriptionId);

    // Sync to profiles
    const { data: sub } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subscriptionId).single();
    if (sub) {
        await supabase.from('profiles').update({ subscription_status: 'canceled' }).eq('id', sub.user_id);
    }

    if (error) throw error;
}

export default router;

