import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SupabaseLikeClient {
    constructor(options = {}) {
        this.isAdmin = options.admin || false;
    }

    from(table) {
        return new TableQuery(table, this.isAdmin);
    }

    auth = {
        signUp: async ({ email, password, options }) => {
            const hashedPassword = await hashPassword(password);
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: options?.data?.name || email.split('@')[0]
                }
            });
            return { data: { user }, error: null };
        },
        signInWithPassword: async ({ email, password }) => {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.password) {
                return { data: {}, error: { message: 'Invalid credentials' } };
            }
            const valid = await verifyPassword(password, user.password);
            if (!valid) {
                return { data: {}, error: { message: 'Invalid credentials' } };
            }
            return { data: { user }, error: null };
        },
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
        admin: {
            deleteUser: async (id) => {
                await prisma.user.delete({ where: { id } });
                return { error: null };
            }
        }
    };
}

class TableQuery {
    constructor(table, isAdmin = false) {
        this.table = table;
        this.isAdmin = isAdmin;
        this._where = {};
        this._select = '*';
        this._order = null;
        this._limit = null;
        this._single = false;
    }

    select(columns = '*') {
        this._select = columns;
        return this;
    }

    eq(column, value) {
        this._where[column] = value;
        return this;
    }

    neq(column, value) {
        this._whereNot = { ...this._whereNot, [column]: { not: value } };
        return this;
    }

    in(column, values) {
        this._whereIn = { ...this._whereIn, [column]: { in: values } };
        return this;
    }

    is(column, value) {
        this._where = { ...this._where, [column]: value };
        return this;
    }

    order(column, { ascending = true } = {}) {
        this._order = { [column]: ascending ? 'asc' : 'desc' };
        return this;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    single() {
        this._single = true;
        return this;
    }

    then(resolve) {
        this._execute().then(resolve).catch(e => resolve({ data: null, error: e }));
    }

    async _execute() {
        const where = { ...this._where };
        if (this._whereNot) Object.assign(where, this._whereNot);
        if (this._whereIn) Object.assign(where, this._whereIn);

        const select = this._select === '*' ? undefined : this._select.split(',').reduce((acc, col) => ({ ...acc, [col.trim()]: true }), {});

        const args = { where };
        if (Object.keys(select || {}).length > 0) args.select = select;
        if (this._order) args.orderBy = this._order;
        if (this._limit) args.take = this._limit;

        try {
            if (this._single) {
                const data = await (prisma[this.table] || prisma[tableToModel(this.table)]).findUnique(args);
                return { data, error: null };
            } else {
                const data = await (prisma[this.table] || prisma[tableToModel(this.table)]).findMany(args);
                return { data, error: null };
            }
        } catch (err) {
            console.error(`[Prisma] ${this.table}:`, err.message);
            return { data: null, error: { message: err.message } };
        }
    }

    async insert(data) {
        const model = tableToModel(this.table);
        try {
            const created = await prisma[model].create({ data: Array.isArray(data) ? data[0] : data });
            return { data: created, error: null };
        } catch (err) {
            console.error(`[Prisma] ${this.table} insert:`, err.message);
            return { data: null, error: { message: err.message } };
        }
    }

    update(data) {
        const self = this;
        return {
            eq: async (column, value) => {
                const model = tableToModel(self.table);
                try {
                    const updated = await prisma[model].update({
                        where: { [column]: value },
                        data
                    });
                    return { data: updated, error: null };
                } catch (err) {
                    return { data: null, error: { message: err.message } };
                }
            },
            then(resolve) {
                self._execute().then(resolve).catch(e => resolve({ data: null, error: e }));
            }
        };
    }

    delete() {
        const self = this;
        return {
            eq: async (column, value) => {
                const model = tableToModel(self.table);
                try {
                    await prisma[model].delete({ where: { [column]: value } });
                    return { error: null };
                } catch (err) {
                    return { error: { message: err.message } };
                }
            },
            then(resolve) {
                self._execute().then(resolve).catch(e => resolve({ data: null, error: e }));
            }
        };
    }
}

function tableToModel(table) {
    const map = {
        users: 'user',
        topics: 'topic',
        messages: 'message',
        conversations: 'conversation',
        projects: 'project',
        skills: 'skill',
        families: 'family',
        family_members: 'familyMember',
        invitations: 'invitation',
        resources: 'resource',
        folders: 'folder',
        badges: 'badge',
        user_badges: 'userBadge',
        xp_notifications: 'xpNotification',
        user_topic_progress: 'userTopicProgress',
        user_skill_progress: 'userSkillProgress',
        project_artifacts: 'projectArtifact',
        project_reflections: 'projectReflection',
        project_comments: 'projectComment',
        shared_entities: 'sharedEntity',
        user_presence: 'userPresence',
        collaborative_sessions: 'collaborativeSession',
        session_participants: 'sessionParticipant',
        collaboration_events: 'collaborationEvent',
        agora_stable_state: 'agoraStableState',
        agora_user_memory: 'agoraUserMemory',
        agora_session_context: 'agoraSessionContext',
        agora_post_action_buffer: 'agoraPostActionBuffer',
        agora_memory_audit: 'agoraMemoryAudit',
        presence_updates: 'presenceUpdate',
        actions: 'action',
        activity_log: 'activityLog',
        system_prompts: 'systemPrompt',
        topic_edges: 'topicEdge',
        skill_edges: 'skillEdge'
    };
    return map[table] || table;
}

export const supabaseAdmin = new SupabaseLikeClient({ admin: true });
export const supabase = new SupabaseLikeClient();

export default { supabase, supabaseAdmin };

import { hashPassword, verifyPassword } from './prisma/auth.js';
