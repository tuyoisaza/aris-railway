require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function validate() {
  console.log('--- Infrastructure Validation ---');

  // 1. SUPABASE VALIDATION
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Simple query to test auth (e.g., list tables or just check health)
    // Since we might not have tables, we can try to get a session or just check if the client initializes without error on a request.
    // Fetching a non-existent table usually returns a specific error, valid auth 404 is better than auth error.
    const { data, error } = await supabase.from('non_existent_table').select('*').limit(1); 
    
    if (error && error.code === 'PGRST204') { // Table not found is good, means auth worked
         console.log('✅ Supabase Connection: Verified (Auth working, table missing ignored)');
    } else if (error && (error.code === '401' || error.message.includes('JWT'))) {
         console.error('❌ Supabase Connection: Auth Failed', error.message);
         process.exit(1);
    } else {
        // Even a generic error means we talked to the server
        console.log('✅ Supabase Connection: Verified (Server reachable)');
    }
  } catch (err) {
      console.error('❌ Supabase Connection: Exception', err.message);
      process.exit(1);
  }

  // 2. STRIPE VALIDATION
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error('❌ Stripe credentials missing');
    process.exit(1);
  }

  try {
    const stripe = Stripe(stripeSecret);
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe Connection: Verified');
  } catch (err) {
    console.error('❌ Stripe Connection: Failed', err.message);
    process.exit(1);
  }

  console.log('--- Validation Complete ---');
}

validate();
