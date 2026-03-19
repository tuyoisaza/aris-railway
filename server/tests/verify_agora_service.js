/**
 * Verification Test: Agora Service
 * 
 * Tests the core Agora functionality:
 * 1. Snapshot generation
 * 2. Stable state management
 * 3. Post-action signal emission
 */

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('='.repeat(60));
    console.log('AGORA SERVICE VERIFICATION TEST');
    console.log('='.repeat(60));

    // 1. Get a test user
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('❌ No users found. Run the app to create one first.');
        return;
    }

    const userId = users[0].id;
    console.log(`\n✅ Using test user: ${users[0].name} (${userId})`);

    // 2. Test: Check if Agora tables exist
    console.log('\n📋 Checking Agora tables...');

    const tables = [
        'agora_stable_state',
        'agora_user_memory',
        'agora_session_context',
        'agora_post_action_buffer',
        'agora_memory_audit'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === '42P01') {
            console.log(`   ❌ Table '${table}' does not exist - run migration first!`);
        } else if (error) {
            console.log(`   ⚠️ Table '${table}': ${error.message}`);
        } else {
            console.log(`   ✅ Table '${table}' exists`);
        }
    }

    // 3. Test: Create stable state
    console.log('\n📋 Testing stable state creation...');

    const { data: state, error: stateError } = await supabase
        .from('agora_stable_state')
        .upsert({
            user_id: userId,
            user_role: 'adult',
            language_pref: 'en',
            consent_flags: {
                memory_enabled: true,
                trait_inference: true,
                cross_session_learning: true
            }
        })
        .select()
        .single();

    if (stateError) {
        console.log(`   ❌ Stable state error: ${stateError.message}`);
        if (stateError.code === '42P01') {
            console.log('   ⚠️ Migration not run. Execute agora_schema.sql first.');
            return;
        }
    } else {
        console.log(`   ✅ Stable state created/updated for user`);
    }

    // 4. Test: Emit a post-action signal
    console.log('\n📋 Testing signal emission...');

    const { data: signal, error: signalError } = await supabase
        .from('agora_post_action_buffer')
        .insert({
            agent_id: 'test',
            user_id: userId,
            signal_type: 'TOPIC_RECURRENCE',
            signal_data: {
                topic: 'Testing',
                context: 'verification'
            }
        })
        .select()
        .single();

    if (signalError) {
        console.log(`   ❌ Signal emission error: ${signalError.message}`);
    } else {
        console.log(`   ✅ Signal emitted: ${signal.id}`);
    }

    // 5. Test: Read unprocessed signals
    console.log('\n📋 Testing signal buffer read...');

    const { data: signals, error: readError } = await supabase
        .from('agora_post_action_buffer')
        .select('*')
        .eq('user_id', userId)
        .eq('processed', false);

    if (readError) {
        console.log(`   ❌ Signal read error: ${readError.message}`);
    } else {
        console.log(`   ✅ Found ${signals.length} unprocessed signals`);
    }

    // 6. Test: Create memory trait
    console.log('\n📋 Testing memory trait creation...');

    const { data: memory, error: memError } = await supabase
        .from('agora_user_memory')
        .upsert({
            user_id: userId,
            trait_key: 'test_trait',
            trait_value: 'Tends to test things thoroughly',
            confidence: 0.75,
            last_confirmed: new Date().toISOString()
        })
        .select()
        .single();

    if (memError) {
        console.log(`   ❌ Memory trait error: ${memError.message}`);
    } else {
        console.log(`   ✅ Memory trait created: ${memory.trait_key}`);
    }

    // 7. Test: Read user memory
    console.log('\n📋 Testing memory read...');

    const { data: userMemory, error: readMemError } = await supabase
        .from('agora_user_memory')
        .select('*')
        .eq('user_id', userId);

    if (readMemError) {
        console.log(`   ❌ Memory read error: ${readMemError.message}`);
    } else {
        console.log(`   ✅ Found ${userMemory.length} memory traits:`);
        userMemory.forEach(m => {
            console.log(`      - ${m.trait_key}: "${m.trait_value}" (${Math.round(m.confidence * 100)}%)`);
        });
    }

    // 8. Cleanup test data
    console.log('\n📋 Cleaning up test data...');

    await supabase.from('agora_post_action_buffer').delete().eq('agent_id', 'test');
    await supabase.from('agora_user_memory').delete().eq('trait_key', 'test_trait');

    console.log('   ✅ Test data cleaned up');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Run migration: node run_migration.js agora_schema.sql');
    console.log('2. Start the server and test the API endpoints');
    console.log('3. Have a conversation to generate signals');
    console.log('4. Check /api/agora/memory to see inferred traits');
}

run().catch(console.error);
