
import { RbacService } from './src/services/rbac.service';
import { supabase } from './src/db';

async function main() {
    console.log('Starting RBAC Verification...');

    try {
        // 1. Check if roles table exists and has data
        const { data: roles, error: rolesError } = await supabase.from('roles').select('count');
        if (rolesError) {
            console.error('❌ Error assessing roles table. Did you run the migration?');
            console.error(rolesError);
            return;
        }
        console.log('✅ Roles table accessible.');

        // 2. Check specific roles
        const { data: roleData } = await supabase.from('roles').select('id').eq('id', 'superadmin').single();
        if (!roleData) {
            console.warn('⚠️ Superadmin role not found. Seed data might be missing.');
        } else {
            console.log('✅ Superadmin role found.');
        }

        // 3. Test Permission Resolution (Mocking a flow)
        // We find a user to test with, or skip if none.
        const { data: profiles } = await supabase.from('profiles').select('id, email').limit(1);

        if (!profiles || profiles.length === 0) {
            console.log('ℹ️ No users found in database, skipping assignment verification.');
            return;
        }

        const testUser = profiles[0];
        console.log(`ℹ️ Testing with user: ${testUser.email} (${testUser.id})`);

        // Get permissions before
        const permsBefore = await RbacService.getUserPermissions(testUser.id);
        console.log(`   Permissions before test: ${permsBefore.length}`);

        // Assign 'member' role if not present
        await supabase.from('user_roles').insert({
            user_id: testUser.id,
            role_id: 'member',
            scope_type: 'global'
        }).select().then(({ error }) => {
            if (error && !error.message.includes('unique constraint')) {
                console.error('   Error assigning role:', error);
            } else {
                console.log('   Assigned (or already has) Member role.');
            }
        });

        // Get permissions after
        const permsAfter = await RbacService.getUserPermissions(testUser.id);
        console.log(`   Permissions after test: ${permsAfter.length}`);

        if (permsAfter.includes('content:read')) {
            console.log('✅ "content:read" permission successfully resolved for Member role.');
        } else {
            console.error('❌ Failed to resolve "content:read" permission for Member.');
        }

        console.log('✅ RBAC Verification Complete.');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

main();
