import express from 'express';
import { prisma } from '../db.js';
import { log } from '../utils/logger.js';

const router = express.Router();

const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
let stripe = null;

if (stripeEnabled) {
    try {
        const Stripe = (await import('stripe')).default;
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        log('Billing', 'INFO', 'Init', 'Stripe is enabled');
    } catch (err) {
        log('Billing', 'WARN', 'Init', 'Failed to initialize Stripe');
    }
} else {
    log('Billing', 'INFO', 'Init', 'Stripe is disabled - no STRIPE_SECRET_KEY');
}

router.post('/checkout', async (req, res) => {
    if (!stripeEnabled) {
        return res.status(501).json({ error: 'Stripe not configured' });
    }
    
    const { priceId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const { verifyToken } = await import('../prisma/auth.js');
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${req.headers.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/account`,
            metadata: { userId: user.id }
        });
        
        log('Billing', 'INFO', 'Checkout', `Session created: ${session.id}`);
        res.json({ url: session.url });
        
    } catch (err) {
        log('Billing', 'ERROR', 'Checkout', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/webhook', async (req, res) => {
    if (!stripeEnabled) {
        return res.status(501).json({ error: 'Stripe not configured' });
    }
    
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        log('Billing', 'INFO', 'Webhook', `Received: ${event.type}`);
    } catch (err) {
        log('Billing', 'ERROR', 'Webhook', `Signature failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata?.userId;
            
            if (userId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { plan: 'premium' }
                });
                log('Billing', 'INFO', 'Webhook', `User ${userId} upgraded to Premium`);
            }
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            await prisma.user.updateMany({
                where: { plan: 'premium' },
                data: { plan: 'free' }
            });
            log('Billing', 'INFO', 'Webhook', 'Subscription cancelled');
            break;
        }
    }
    
    res.json({ received: true });
});

export default router;
