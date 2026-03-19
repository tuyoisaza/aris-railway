import express from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../db.js';
import { log } from '../utils/logger.js';
import { requireAuth, validate } from '../middleware.js';
import { schemas } from '../schemas.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// POST /api/checkout
router.post('/checkout', requireAuth, validate(schemas.checkout), async (req, res) => {
    const { userId, priceId } = req.body;

    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: ID mismatch' });
    }

    log('Billing', 'INFO', 'Checkout', `Creating session for user: ${userId}`);

    try {
        const { data: user } = await req.userClient
            .from('users')
            .select('email, stripe_customer_id')
            .eq('id', userId)
            .single();

        let customerId = user?.stripe_customer_id;

        if (!customerId && user?.email) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: userId }
            });
            customerId = customer.id;

            await req.userClient
                .from('users')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${req.headers.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/account`,
            metadata: { userId }
        });

        log('Billing', 'INFO', 'Checkout', `Session created: ${session.id}`);
        res.json({ url: session.url });

    } catch (err) {
        log('Billing', 'ERROR', 'Checkout', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/webhook (Stripe Webhook)
// Note: This route requires raw body. We assume main app handles express.raw() or passes raw body.
// In index.js, we must use `express.raw()` for this path specifically or ensure middleware compatibility.
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // req.body must be Buffer/String, not JSON object
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        log('Billing', 'INFO', 'Webhook', `Received event: ${event.type}`);
    } catch (err) {
        log('Billing', 'ERROR', 'Webhook', `Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata.userId;

            log('Billing', 'INFO', 'Webhook', `Checkout complete for user: ${userId}`);

            const { error } = await supabaseAdmin
                .from('users')
                .update({
                    plan: 'pro',
                    stripe_subscription_id: session.subscription
                })
                .eq('id', userId);

            if (error) {
                log('Billing', 'ERROR', 'Webhook', `Failed to upgrade user: ${error.message}`);
            } else {
                log('Billing', 'INFO', 'Webhook', `User ${userId} upgraded to Pro`);
            }
            break;
        }
        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            log('Billing', 'INFO', 'Webhook', `Subscription updated: ${subscription.id}`);
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            log('Billing', 'INFO', 'Webhook', `Subscription cancelled: ${subscription.id}`);

            const { data: users } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('stripe_subscription_id', subscription.id);

            if (users && users.length > 0) {
                await supabaseAdmin
                    .from('users')
                    .update({ plan: 'free', stripe_subscription_id: null })
                    .eq('id', users[0].id);
                log('Billing', 'INFO', 'Webhook', `User ${users[0].id} downgraded to Free`);
            }
            break;
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            log('Billing', 'WARN', 'Webhook', `Payment failed for invoice: ${invoice.id}`);
            break;
        }
    }

    res.json({ received: true });
});

export default router;
