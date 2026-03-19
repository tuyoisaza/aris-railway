import { supabase } from '../db';

export class RbacService {
    /**
     * Get effective permissions for a user
     * Resolves roles, inheritance, and direct permissions
     */
    static async getUserPermissions(userId: string): Promise<string[]> {
        // 1. Get user roles
        const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', userId);

        if (rolesError || !userRoles) {
            console.error('Error fetching user roles:', rolesError);
            return [];
        }

        const roleIds = userRoles.map(ur => ur.role_id);
        if (roleIds.length === 0) return [];

        // 2. Resolve role hierarchy (parents)
        // For simplicity in Phase 1, we'll do restricted depth or just direct mapping if inheritance is tricky in code vs SQL.
        // Better: Fetch all permissions for these roles directly via SQL join if possible, 
        // OR fetch definitions and compute. 

        // Let's try a recursive SQL approach or just fetch all roles and build graph in memory (efficient for small N roles).
        // Since we have a 'roles' table with 'parent_role_id', let's fetch all roles to build the tree.
        const { data: allRoles } = await supabase.from('roles').select('id, parent_role_id');

        const effectiveRoleIds = new Set<string>(roleIds);
        let changed = true;
        while (changed) {
            changed = false;
            // If I have role A, and A inherits from B, I also have B.
            // parent_role_id points to the parent. 
            // example: Owner (parent: Admin). If I am Owner, I am also Admin.
            // So if I have 'owner', I find 'owner' in allRoles, get its parent 'admin', add 'admin' to set.
            for (const rId of Array.from(effectiveRoleIds)) {
                const roleDef = allRoles?.find(r => r.id === rId);
                if (roleDef?.parent_role_id && !effectiveRoleIds.has(roleDef.parent_role_id)) {
                    effectiveRoleIds.add(roleDef.parent_role_id);
                    changed = true;
                }
            }
        }

        // 3. Get permissions for all effective roles
        const { data: rolePermissions, error: permError } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .in('role_id', Array.from(effectiveRoleIds));

        if (permError) {
            console.error('Error fetching role permissions:', permError);
            return [];
        }

        // 4. Return unique permission IDs
        const permissions = new Set<string>(rolePermissions.map(rp => rp.permission_id));
        return Array.from(permissions);
    }

    /**
     * Check if user has specific permission
     */
    static async hasPermission(userId: string, permission: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }
}
