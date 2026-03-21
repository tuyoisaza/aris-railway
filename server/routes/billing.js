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
    log('Billing', 'INFO', 'Init', 'Stripe is disabled');
}

router.post('/checkout', async (req, res) => {
    if (!stripeEnabled) {
        return res.status(501).json({ error: 'Stripe not configured' });
    }
    res.status(501).json({ error: 'Stripe checkout not implemented' });
});

router.post('/webhook', async (req, res) => {
    res.status(200).json({ received: true });
});

export default router;
