import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from './prisma/auth.js';

dotenv.config({ path: '../.env' });
dotenv.config({ path: './.env' });

const databaseUrl = process.env.DATABASE_URL;

export const prisma = new PrismaClient({
    datasources: databaseUrl ? {
        db: { url: databaseUrl }
    } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

export class SupabaseLikeClient {
    constructor(options = {}) {
        this.isAdmin = options.admin || false;
    }

    from(table) {
        return new TableQuery(table, this.isAdmin);
    }

    auth = {
        signUp: async ({ email, password, options }) => {
            const hashed = await hashPassword(password);
            try {
                const user = await prisma.user.create({
                    data: {
                        email,
                        password: hashed,
                        name: options?.data?.name || email.split('@')[0]
                    }
                });
                return { data: { user }, error: null };
            } catch (err) {
                return { data: null, error: { message: err.message } };
            }
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
                try {
                    await prisma.user.delete({ where: { id } });
                    return { error: null };
                } catch (err) {
                    return { error: { message: err.message } };
                }
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
        this._offset = null;
        this._single = false;
        this._count = false;
        this._whereNot = {};
        this._whereIn = {};
    }

    select(columns = '*') {
        if (columns && typeof columns === 'object' && columns.count) {
            this._count = columns.count;
            this._countHead = columns.head || false;
            this._select = '*';
        } else {
            this._select = columns;
            this._count = false;
            this._countHead = false;
        }
        return this;
    }

    async count() {
        const where = { ...this._where };
        Object.assign(where, this._whereNot);
        Object.assign(where, this._whereIn);

        const model = tableToModel(this.table);

        if (!prisma[model] && !prisma[this.table]) {
            return { count: 0, error: null };
        }

        try {
            const target = prisma[model] || prisma[this.table];
            const count = await target.count({ where });
            return { count, error: null };
        } catch (err) {
            console.error(`[Prisma] ${this.table} count:`, err.message);
            return { count: 0, error: { message: err.message } };
        }
    }

    eq(column, value) {
        this._where[column] = value;
        return this;
    }

    neq(column, value) {
        this._whereNot[column] = { not: value };
        return this;
    }

    in(column, values) {
        this._whereIn[column] = { in: values };
        return this;
    }

    is(column, value) {
        this._where[column] = value;
        return this;
    }

    match(conditions) {
        if (conditions && typeof conditions === 'object') {
            Object.entries(conditions).forEach(([key, value]) => {
                this.eq(key, value);
            });
        }
        return this;
    }

    order(column, opts = {}) {
        this._order = { [column]: opts.ascending ? 'asc' : 'desc' };
        return this;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    offset(n) {
        this._offset = n;
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
        const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        const convertObj = (obj) => {
            if (!obj) return obj;
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                const snakeKey = camelToSnake(key);
                if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    result[snakeKey] = convertObj(value);
                } else {
                    result[snakeKey] = value;
                }
            }
            return result;
        };

        const where = convertObj({ ...this._where });
        Object.assign(where, convertObj(this._whereNot));
        Object.assign(where, convertObj(this._whereIn));

        const model = tableToModel(this.table);
        const tableName = this.table;

        if (!prisma[model] && !prisma[tableName]) {
            return { data: [], error: null };
        }

        if (this._countHead) {
            try {
                const target = prisma[model] || prisma[tableName];
                const count = await target.count({ where });
                return { data: null, count, error: null };
            } catch (err) {
                console.error(`[Prisma] ${this.table} count:`, err.message);
                return { data: null, count: 0, error: { message: err.message } };
            }
        }

        const args = { where };

        if (this._select !== '*') {
            const select = this._select.split(',').reduce((acc, col) => {
                const c = col.trim();
                if (c.startsWith('*,') || c.endsWith(',*')) return null;
                acc[c] = true;
                return acc;
            }, {});
            if (Object.keys(select).length > 0) args.select = select;
        }

        if (this._order) args.orderBy = this._order;
        if (this._limit) args.take = this._limit;
        if (this._offset) args.skip = this._offset;

        try {
            const target = prisma[model] || prisma[tableName];
            if (this._single) {
                const data = await target.findUnique(args);
                return { data, error: null };
            } else {
                const data = await target.findMany(args);
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
            const target = prisma[model] || prisma[this.table];
            const payload = Array.isArray(data) ? data[0] : data;
            
            if (target.createMany) {
                const created = await target.createMany({ data: payload });
                return { data: created, error: null };
            }
            const created = await target.create({ data: payload });
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
                    const target = prisma[model] || prisma[self.table];
                    const updated = await target.update({
                        where: { [column]: value },
                        data
                    });
                    return { data: updated, error: null, count: 1 };
                } catch (err) {
                    return { data: null, error: { message: err.message }, count: 0 };
                }
            },
            select: (cols) => {
                self._select = cols;
                return self.update(data);
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
                    const target = prisma[model] || prisma[self.table];
                    await target.delete({ where: { [column]: value } });
                    return { error: null, count: 1 };
                } catch (err) {
                    return { error: { message: err.message }, count: 0 };
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
        users: 'user', topics: 'topic', messages: 'message',
        conversations: 'conversation', projects: 'project', skills: 'skill',
        families: 'family', family_members: 'familyMember', invitations: 'invitation',
        resources: 'resource', folders: 'folder', badges: 'badge',
        user_badges: 'userBadge', xp_notifications: 'xpNotification',
        user_topic_progress: 'userTopicProgress', user_skill_progress: 'userSkillProgress',
        project_artifacts: 'projectArtifact', project_reflections: 'projectReflection',
        project_comments: 'projectComment', shared_entities: 'sharedEntity',
        user_presence: 'userPresence', collaborative_sessions: 'collaborativeSession',
        session_participants: 'sessionParticipant', collaboration_events: 'collaborationEvent',
        agora_stable_state: 'agoraStableState', agora_user_memory: 'agoraUserMemory',
        agora_session_context: 'agoraSessionContext',
        agora_post_action_buffer: 'agoraPostActionBuffer',
        agora_memory_audit: 'agoraMemoryAudit', presence_updates: 'presenceUpdate',
        actions: 'action', activity_log: 'activityLog', system_prompts: 'systemPrompt',
        topic_edges: 'topicEdge', skill_edges: 'skillEdge'
    };
    return map[table] || table;
}

export const supabaseAdmin = new SupabaseLikeClient({ admin: true });
export const supabase = new SupabaseLikeClient();

export default { supabase, supabaseAdmin, prisma };

export async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('[DB] Connected to SQLite database');
    } catch (error) {
        console.error('[DB] Failed to connect to database:', error);
        throw error;
    }
}

export async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
        console.log('[DB] Disconnected from database');
    } catch (error) {
        console.error('[DB] Error disconnecting from database:', error);
    }
}

process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
});
