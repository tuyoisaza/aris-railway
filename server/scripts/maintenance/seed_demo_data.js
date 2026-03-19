const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

// Config
const TARGET_EMAIL = 'thetboard@gmail.com';
const DEMO_PASSWORD = 'Password123!'; // Fallback logic

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const DEMO_TOPICS = [
    { title: 'Black Holes', description: 'Understanding the event horizon and singularities.', category: 'Physics', maxDepth: 7, engagement: 85, connections: 12 },
    { title: 'Quantum Physics', description: 'The strange world of subatomic particles.', category: 'Physics', maxDepth: 5, engagement: 40, connections: 8 },
    { title: 'Ancient Rome', description: 'From Republic to Empire.', category: 'History', maxDepth: 6, engagement: 20, connections: 15 },
    { title: 'Algebra I', description: 'Linear equations and inequalities.', category: 'Math', maxDepth: 4, engagement: 10, connections: 5 }
];

async function seed() {
    console.log(`--- SEEDING DEMO DATA FOR ${TARGET_EMAIL} ---`);

    // 1. Get or Create Main User (Tuyo)
    console.log('1. Finding Main User (Tuyo)...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = users.find(u => u.email === TARGET_EMAIL);

    if (!user) {
        console.log('   User not found. Creating Tuyo Isaza...');
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: TARGET_EMAIL,
            password: DEMO_PASSWORD,
            email_confirm: true,
            user_metadata: { name: 'Tuyo Isaza' }
        });
        if (createError) throw createError;
        user = newUser.user;
    } else {
        console.log(`   Found Tuyo: ${user.id}`);
        // Update name if needed
        await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: { name: 'Tuyo Isaza' } });
    }

    // Upsert Profile
    await supabaseAdmin.from('users').upsert({ id: user.id, email: user.email, name: 'Tuyo Isaza', plan: 'pro' });

    // 2. Family
    console.log('2. checking Family...');
    // Find existing family membership
    const { data: member } = await supabaseAdmin.from('family_members').select('family_id').eq('user_id', user.id).single();
    let familyId = member ? member.family_id : null;

    if (!familyId) {
        const { data: family, error: rpcError } = await supabaseAdmin.rpc('create_new_family', {
            name_input: 'Isaza Family',
            owner_id_input: user.id
        });
        if (rpcError) throw rpcError;
        familyId = family.id;
    } else {
        await supabaseAdmin.from('families').update({ name: 'Isaza Family' }).eq('id', familyId);
    }
    console.log(`   Family ID: ${familyId}`);

    // 3. Create Additional Members (Lorena & Alicia)
    const members = [
        { name: 'Lorena Luna', email: 'lorena@aris.demo', role: 'Parent', age: 30 },
        {
            name: 'Alicia Isaza', email: 'alicia@aris.demo', role: 'Child', age: 2,
            stats: { /* Alex Stats */
                weeklyUsage: '5h 33m',
                avgSession: '18 min',
                activeTopics: 8,
                consistencyScore: 85,
                deepening: 3,
                weeklyData: [
                    { day: 'Mon', hours: 0.75 }, { day: 'Tue', hours: 0.53 },
                    { day: 'Wed', hours: 0.96 }, { day: 'Thu', hours: 0.68 },
                    { day: 'Fri', hours: 0.86 }, { day: 'Sat', hours: 1.11 },
                    { day: 'Sun', hours: 0.63 }
                ]
            }
        }
    ];

    for (const m of members) {
        let mUser = users.find(u => u.email === m.email);
        if (!mUser) {
            const { data: newM, error: mErr } = await supabaseAdmin.auth.admin.createUser({
                email: m.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { name: m.name }
            });
            if (mErr) { console.error(`Failed to create ${m.name}:`, mErr.message); continue; }
            mUser = newM.user;
        }
        await supabaseAdmin.from('users').upsert({ id: mUser.id, email: m.email, name: m.name, age: m.age });

        // Add to family
        const { error: memErr } = await supabaseAdmin.from('family_members').upsert({
            family_id: familyId,
            user_id: mUser.id,
            role: m.role,
            active: true,
            stats: m.stats || { weeklyUsage: 0, avgSession: '0m', activeTopics: 0 }
        }, { onConflict: 'family_id, user_id' });

        if (memErr) console.error(`Failed to link ${m.name}:`, memErr.message);
        else console.log(`   Linked ${m.name} (${m.role})`);
    }

    // 4. Topics (Preserve existing logic, simplified)
    console.log('3. Seeding Topics (Ensuring defaults)...');
    const { count } = await supabaseAdmin.from('topics').select('*', { count: 'exact', head: true });
    if (count === 0) {
        await supabaseAdmin.from('topics').insert(DEMO_TOPICS.map(t => ({
            id: crypto.randomUUID(), title: t.title, description: t.description, category: t.category, "maxDepth": t.maxDepth, engagement: t.engagement, connections: t.connections
        })));
    }

    // 5. Progress & Conversations (For Tuyo/Alicia?)
    // If we want Alicia's dashboard (if she logs in) to show graphs, we need progress.
    // Parent Dashboard uses `family_members.stats` (JSON) which we just set.
    // So Map is separate. Parent Map view (`/parent/topic/:id`) relies on `topic` query?
    // Actually ParentDashboard "Topics" tab uses `currentTopics`.
    // `currentTopics` comes from `useGlobal` `topics`.
    // The "Map of Becoming" graph likely uses `topics` + `connections`.

    console.log('--- SEED COMPLETE ---');
}

seed().catch(e => console.error('SEED FAILED:', e));
