-- 1. Permissions Table
-- Defines atomic actions that can be performed
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY, -- e.g., 'users:read', 'billing:manage'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Roles Table
-- Defines a role which is a collection of permissions
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY, -- e.g., 'owner', 'admin', 'member'
    name TEXT NOT NULL,
    description TEXT,
    parent_role_id TEXT REFERENCES public.roles(id), -- Inheritance: Owner inherits from Admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Role Permissions Table
-- Maps roles to their direct permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 4. User Roles Table
-- Assigns roles to users within a specific context (scope)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
    scope_type TEXT DEFAULT 'global', -- 'global', 'account', 'program'
    scope_id TEXT, -- UUID or ID of the resource (e.g., account_id, program_id), NULL for global
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id, scope_type, scope_id)
);

-- RLS Policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Public read for meta tables (or restricted to authenticated, handled by API mostly)
CREATE POLICY "Read permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Read roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Read role_permissions" ON public.role_permissions FOR SELECT USING (true);

-- User roles: Users can read their own roles
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- SEED DATA

-- Permissions
INSERT INTO public.permissions (id, description) VALUES
('users:read', 'View users'),
('users:invite', 'Invite new users'),
('users:update', 'Update user details'),
('roles:read', 'View roles'),
('roles:assign', 'Assign roles to users'),
('billing:read', 'View billing information'),
('billing:manage', 'Manage subscription and payment methods'),
('content:read', 'View content'),
('content:create', 'Create new content'),
('content:publish', 'Publish content'),
('reports:view', 'View analytics and reports')
ON CONFLICT (id) DO NOTHING;

-- Roles
INSERT INTO public.roles (id, name, description, parent_role_id) VALUES
('member', 'Member', 'Standard user with basic access', NULL),
('mentor', 'Mentor', 'Expert with specific content management rights', 'member'),
('admin', 'Admin', 'Administrator with user management rights', 'member'),
('owner', 'Owner', 'Account owner with full access including billing', 'admin'),
('superadmin', 'Superadmin', 'Platform administrator', NULL)
ON CONFLICT (id) DO NOTHING;

-- Role Permissions
-- Member
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('member', 'content:read')
ON CONFLICT DO NOTHING;

-- Mentor (inherits Member) + content creation
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('mentor', 'content:create'),
('mentor', 'users:read') -- View users to mentor them
ON CONFLICT DO NOTHING;

-- Admin (inherits Member) + user management
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('admin', 'users:read'),
('admin', 'users:invite'),
('admin', 'roles:read'),
('admin', 'roles:assign'),
('admin', 'reports:view')
ON CONFLICT DO NOTHING;

-- Owner (inherits Admin) + billing
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('owner', 'billing:read'),
('owner', 'billing:manage')
ON CONFLICT DO NOTHING;

-- Superadmin (All permissions effectively, but explicit here for RBAC)
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('superadmin', 'users:read'),
('superadmin', 'users:invite'),
('superadmin', 'users:update'),
('superadmin', 'roles:read'),
('superadmin', 'roles:assign'),
('superadmin', 'billing:read'),
('superadmin', 'billing:manage'),
('superadmin', 'content:read'),
('superadmin', 'content:create'),
('superadmin', 'content:publish'),
('superadmin', 'reports:view')
ON CONFLICT DO NOTHING;
