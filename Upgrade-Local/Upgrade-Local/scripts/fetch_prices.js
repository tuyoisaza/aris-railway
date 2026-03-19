require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const productMap = {
    'prod_TgSEaz3zmV8uTS': 'STRIPE_PRICE_BUILDER',
    'prod_TgSFJ1lCBRC1Ec': 'STRIPE_PRICE_PRACTITIONER',
    'prod_TgSGzPVA9of6h2': 'STRIPE_PRICE_TEAMS'
};

async function validPrices() {
    console.log("Fetching prices for products...");
    for (const [prodId, envKey] of Object.entries(productMap)) {
        try {
            const prices = await stripe.prices.list({
                product: prodId,
                active: true,
                limit: 1
            });

            if (prices.data.length > 0) {
                const priceId = prices.data[0].id;
                console.log(`FOUND: ${envKey}=${priceId}`);
            } else {
                console.error(`ERROR: No active price found for product ${prodId}`);
            }
        } catch (e) {
            console.error(`API ERROR for ${prodId}:`, e.message);
        }
    }
}

validPrices();
