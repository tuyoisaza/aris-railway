const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Upgrade-Local/.env' });
const Stripe = require('stripe');

async function verifyStripe() {
    console.log('Verifying Stripe Configuration...');

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        console.error('FAILED: Missing STRIPE_SECRET_KEY in .env');
        return;
    }

    const stripe = Stripe(stripeKey);

    try {
        const priceId = process.env.STRIPE_PRICE_BUILDER; // Using Builder plan
        if (!priceId) {
            console.error('FAILED: Missing STRIPE_PRICE_BUILDER in .env');
            return;
        }

        console.log(`Attempting to create session for price: ${priceId}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment', // or subscription, depending on the price type. Assuming payment for now or will fail if price is recurring and mode is payment.
            // Actually, if it's a subscription price, mode must be 'subscription'. 
            // Let's try 'subscription' as SaaS usually is.
            mode: 'subscription',
            success_url: 'http://localhost:5173/success',
            cancel_url: 'http://localhost:5173/cancel',
        });

        console.log('------------------------------------------------');
        console.log('STRIPE VERIFICATION SUCCESSFUL');
        console.log('Session ID:', session.id);
        console.log('Payment Status:', session.payment_status);
        console.log('URL:', session.url);
        console.log('------------------------------------------------');

    } catch (e) {
        console.error('STRIPE TEST FAILED:', e.message);
        if (e.message.includes('mode')) {
            console.log('Hint: Check if the Price ID is for a one-time product (payment) or recurring (subscription).');
        }
    }
}

verifyStripe();
