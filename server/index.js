import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { verifyToken } from "./prisma/auth.js";
import { socketServer } from "./websocket/socketServer.js";
import { debugMiddleware } from "./middleware/debugMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = isProduction
    ? ['https://aris.app', 'https://www.aris.app', '.railway.app', 'aris.tuyoisaza.com']
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Correlation-ID, X-Debug-Session');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(debugMiddleware);

app.get("/health", async (_req, res) => {
    const { prisma } = await import('./db.js');
    const db = prisma;
    const startTime = Date.now();

    try {
        const [
            totalUsers,
            adminUsers,
            usersWithFamily,
            totalFamilies,
            totalMembers,
            totalConversations,
            archivedConversations,
            totalMessages,
            totalFolders,
            totalTopics,
            topicsWithResources,
            totalResources,
            projectsByStatus,
            totalSkills,
            userSkillProgress,
            totalBadges,
            earnedBadges,
            uniqueBadgeUsers,
            totalXpNotifications,
            unreadXpNotifications,
            totalCollaborativeSessions,
            activeSessions,
            totalSharedEntities,
            totalInvitations,
            pendingInvitations,
            totalActions,
            actionsByType,
            totalAuditLogs,
            auditByType,
            totalFeatureFlags,
            enabledFeatureFlags,
            presenceByStatus
        ] = await Promise.all([
            db.user.count(),
            db.user.count({ where: { role: 'admin' } }),
            db.familyMember.groupBy({ by: ['userId'] }),
            db.family.count(),
            db.familyMember.count(),
            db.conversation.count(),
            db.conversation.count({ where: { isArchived: true } }),
            db.message.count(),
            db.folder.count(),
            db.topic.count(),
            db.topic.count({ where: { resources: { some: {} } } }),
            db.resource.count(),
            db.project.groupBy({ by: ['status'], _count: true }),
            db.skill.count(),
            db.userSkillProgress.count(),
            db.badge.count(),
            db.userBadge.count(),
            db.userBadge.groupBy({ by: ['userId'] }),
            db.xpNotification.count(),
            db.xpNotification.count({ where: { read: false } }),
            db.collaborativeSession.count(),
            db.collaborativeSession.count({ where: { isActive: true } }),
            db.sharedEntity.count(),
            db.invitation.count(),
            db.invitation.count({ where: { status: 'Pending' } }),
            db.action.count(),
            db.action.groupBy({ by: ['type'], _count: true }),
            db.auditLog.count(),
            db.auditLog.groupBy({ by: ['action'], _count: true }),
            db.featureFlag.count(),
            db.featureFlag.count({ where: { enabled: true } }),
            db.userPresence.groupBy({ by: ['status'], _count: true })
        ]);

        const projectsStats = projectsByStatus.reduce((acc, p) => {
            acc[p.status] = p._count;
            acc.total = (acc.total || 0) + p._count;
            return acc;
        }, { total: 0 });

        const actionsStats = actionsByType.reduce((acc, a) => {
            acc[a.type] = a._count;
            return acc;
        }, {});

        const auditStats = auditByType.reduce((acc, a) => {
            acc[a.action] = a._count;
            return acc;
        }, {});

        const presenceStats = presenceByStatus.reduce((acc, p) => {
            acc[p.status] = p._count;
            return acc;
        }, {});

        const avgMessagesPerConversation = totalConversations > 0 
            ? Math.round((totalMessages / totalConversations) * 10) / 10 
            : 0;

        console.log(`[Health] OK - ${totalUsers} users, ${totalConversations} convs, ${totalMessages} msgs, ${totalActions} actions (${Date.now() - startTime}ms)`);

        res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            responseTime: Date.now() - startTime,
            database: "connected",
            stats: {
                users: {
                    total: totalUsers,
                    admins: adminUsers,
                    regular: totalUsers - adminUsers,
                    withFamily: usersWithFamily.length
                },
                families: {
                    total: totalFamilies,
                    totalMembers: totalMembers
                },
                conversations: {
                    total: totalConversations,
                    archived: archivedConversations,
                    active: totalConversations - archivedConversations,
                    messages: totalMessages,
                    avgMessagesPerConversation
                },
                folders: {
                    total: totalFolders
                },
                topics: {
                    total: totalTopics,
                    withResources: topicsWithResources
                },
                resources: {
                    total: totalResources
                },
                projects: projectsStats,
                skills: {
                    total: totalSkills,
                    trackedByUsers: userSkillProgress
                },
                badges: {
                    total: totalBadges,
                    earned: earnedBadges,
                    uniqueUsersWithBadges: uniqueBadgeUsers.length
                },
                xpNotifications: {
                    total: totalXpNotifications,
                    unread: unreadXpNotifications
                },
                collaborativeSessions: {
                    total: totalCollaborativeSessions,
                    active: activeSessions
                },
                sharedEntities: {
                    total: totalSharedEntities
                },
                invitations: {
                    total: totalInvitations,
                    pending: pendingInvitations,
                    accepted: totalInvitations - pendingInvitations
                },
                actions: {
                    total: totalActions,
                    byType: actionsStats
                },
                auditLogs: {
                    total: totalAuditLogs,
                    byAction: auditStats
                },
                featureFlags: {
                    total: totalFeatureFlags,
                    enabled: enabledFeatureFlags,
                    disabled: totalFeatureFlags - enabledFeatureFlags
                },
                presence: presenceStats
            }
        });
    } catch (error) {
        console.error('[Health] Error:', error.message, { stack: error.stack });
        res.status(500).json({
            status: "error",
            timestamp: new Date().toISOString(),
            database: "disconnected",
            error: error.message
        });
    }
});

console.log("[Bootstrap] Environment Diagnostics:");
const envKeys = ["DATABASE_URL", "JWT_SECRET", "OPENAI_API_KEY", "STRIPE_SECRET_KEY", "VITE_STRIPE_PRICE_PLUS"];
envKeys.forEach(key => {
    const val = process.env[key];
    if (val) {
        if (key === "DATABASE_URL") {
            console.log(`  - ${key}: [SET] file:***/aris.db`);
        } else if (key.includes("KEY") || key.includes("SECRET")) {
            const masked = val.length > 8 ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : "****";
            console.log(`  - ${key}: [SET] ${masked}`);
        } else {
            console.log(`  - ${key}: [SET]`);
        }
    } else {
        console.log(`  - ${key}: [MISSING]`);
    }
});
console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  - PORT: ${process.env.PORT}`);

async function loadRoutes() {
    const { default: authRoutes } = await import('./routes/auth.js');
    const { default: chatRoutes } = await import('./routes/chat.js');
    const { default: topicsRoutes } = await import('./routes/topics.js');
    const { default: skillsRoutes } = await import('./routes/skills.js');
    const { default: projectsRoutes } = await import('./routes/projects.js');
    const { default: familiesRoutes } = await import('./routes/families.js');
    const { default: invitesRoutes } = await import('./routes/invites.js');
    const { default: adminRoutes } = await import('./routes/admin.js');
    const { default: settingsRoutes } = await import('./routes/settings.js');
    const { default: resourcesRoutes } = await import('./routes/resources.js');
    const { default: foldersRoutes } = await import('./routes/folders.js');
    const { default: collaborationRoutes } = await import('./routes/collaboration.js');
    const { default: agoraRoutes } = await import('./routes/agora.js');
    const { default: usersRoutes } = await import('./routes/users.js');
    const { default: billingRoutes } = await import('./routes/billing.js');

    app.use('/api/auth', authRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/topics', topicsRoutes);
    app.use('/api/skills', skillsRoutes);
    app.use('/api/projects', projectsRoutes);
    app.use('/api/families', familiesRoutes);
    app.use('/api/invites', invitesRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/resources', resourcesRoutes);
    app.use('/api/folders', foldersRoutes);
    app.use('/api/collaboration', collaborationRoutes);
    app.use('/api/agora', agoraRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/billing', billingRoutes);

    console.log('[Bootstrap] All routes loaded');
}

async function seedPrompts() {
    const { prisma } = await import('./db.js');
    
    const agents = [
        {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
            agentId: 'teacher',
            name: 'The Teacher (Conversation Agent)',
            promptText: `You are "The Teacher", the voice of ARIS. Your role is to hold a live conversation with the user. You are curious, calm, and Socratic, like Aristotle grounded in observation and clarity. You are a scientist of the natural and human world.

Responsibilities:
- Listen and respond in real time.
- Ask clarifying questions.
- Introduce concepts gradually.
- Use thinker lenses when appropriate.
- Maintain posture (Commentator -> Guide -> Challenger -> Witness).
- Respect consent and agency.

Constraints:
- DO NOT build the learning map.
- DO NOT decide topic structure.
- DO NOT research deeply during live conversation.
- DO NOT store long-term representations.

OUTPUT FORMAT: You must respond with a VALID JSON object containing exactly three keys: "response", "options", and "action".
Do NOT output any markdown code blocks (like \`\`\`json). Just the raw JSON object.

Structure:
{
  "response": "Your conversational response here (3-6 sentences, clear, engaging, maybe a micro-hook)",
  "options": ["Option 1", "Option 2", "Option 3"],
  "action": null
}

GUIDELINES:
1. "response":
   - Be the memorable professor: curious, clear, invitational.
   - Avoid lists. Be human.
   - Use micro-hooks (fun fact, rare connection).

2. "options":
   - EXACTLY 3 strings.
   - STRICT CONTRAINT: These must be phrased as the USER speaking to ARIS.
   - BAD (Do not do): "Do you want to know more?", "Shall I explain?", "What interests you?"
   - GOOD (Do this): "Tell me more about X.", "Explain the history.", "Give me an example."
   - Op 1: User asks to dive deeper.
   - Op 2: User asks for context/history.
   - Op 3: User suggests a pivot or metaphor.

3. "action":
   - Default to null.
   - Only set if you detect a milestone moment (BRANCH/DEPTH) or want to propose a project.`,
            model: 'gpt-4o',
            temperature: 0.7,
            active: true
        },
        {
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678012',
            agentId: 'cartographer',
            name: 'The Cartographer (Structuring Agent)',
            promptText: `You are "The Cartographer". Your role is to analyze completed conversations and extract structure. You turn dialogue into meaningful learning artifacts. Output strictly in JSON format.

Responsibilities:
- Segment conversation into themes.
- Identify candidate topics.
- Detect recurring ideas.
- Infer topic categories and subdomains.
- Detect emotional or cognitive weight.
- Identify connections between topics.

Constraints:
- DO NOT speak to the user.
- DO NOT explain concepts.
- DO NOT judge correctness.`,
            model: 'gpt-4o',
            temperature: 0.0,
            active: true
        },
        {
            id: 'c3d4e5f6-a7b8-9012-cdef-123456780123',
            agentId: 'cartographer_rel',
            name: 'Cartographer Relationships',
            promptText: 'You are a Knowledge Graph Architect. Identify semantic relationships between topics. Labels must be single, evocative verbs or nouns (e.g., "Influences", "Basis", "Context", "Evolves", "Harmony", "Tension").',
            model: 'gpt-4o',
            temperature: 0.5,
            active: true
        },
        {
            id: 'd4e5f6a7-b8c9-0123-defa-234567801234',
            agentId: 'librarian',
            name: 'The Librarian (Enrichment Agent)',
            promptText: `You are "The Librarian". Your role is to populate topics with depth and content. You give substance to the learning map.

Responsibilities:
- Assign depth layers to topics (1-7).
- Identify concepts per layer.
- Generate coming concepts.
- Build references (books, authors, films).
- Generate Insight Paths.
- Maintain consistency.

Constraints:
- DO NOT talk to the user.
- DO NOT push content proactively.`,
            model: 'gpt-4o',
            temperature: 0.4,
            active: true
        },
        {
            id: 'e5f6a7b8-c9d0-1234-efab-345678012345',
            agentId: 'scout',
            name: 'The Scout (Research Agent)',
            promptText: `You are "The Scout". Your role is to gather and validate knowledge needed by the Librarian. You face outward to the world of knowledge.

Responsibilities:
- Research authors, thinkers, texts, films, events.
- Identify canonical vs disputed ideas.
- Surface multiple schools of thought.
- Flag uncertainty and controversy.

Constraints:
- Prefer primary or canonical sources.
- Annotate confidence and disagreement.
- Avoid speculative certainty.
- DO NOT interact with users.
- DO NOT shape pedagogy.`,
            model: 'gpt-4o',
            temperature: 0.2,
            active: true
        },
        {
            id: 'f6a7b8c9-d0e1-2345-fabc-456789012346',
            agentId: 'thoth',
            name: 'Thoth: The Organizer',
            promptText: `You are an AI agent whose task is to classify any input text, topic, or conversation fragment into a single high-level Domain of Knowledge, using a Knowledge Organization System (KOS) grounded in ISO 25964 (Thesauri and interoperability with other vocabularies).

Your goal is orientation and consistency, not explanation.

Think using ISO 25964 KOS hierarchy rules.
Return only the final Domain name.
Stop immediately after outputting it.`,
            model: 'gpt-4o-mini',
            temperature: 0.3,
            active: true
        },
        {
            id: 'a7b8c9d0-e1f2-3456-abcd-567890123478',
            agentId: 'daedalus',
            name: 'Daedalus: Project Architect',
            promptText: `You are "Daedalus", the Project Architect. Your role is to help users create and develop projects based on their learning journey. You transform insights into actionable project ideas.

Responsibilities:
- Analyze user interests and learning history.
- Generate project concepts aligned with user goals.
- Help structure project workflows.
- Provide guidance on project completion.

Constraints:
- DO NOT create projects without user consent.
- DO NOT modify existing project content.`,
            model: 'gpt-4o',
            temperature: 0.6,
            active: true
        },
        {
            id: 'b8c9d0e1-f2a3-4567-bcde-678901234589',
            agentId: 'ogma',
            name: 'Ogma: Memory Keeper',
            promptText: `You are "Ogma", the Memory Keeper. Your role is to manage and process signals from the Agora memory system. You handle the flow of memory consolidation and recall.

Responsibilities:
- Process signals from the post-action buffer.
- Consolidate important memories into stable state.
- Help maintain memory coherence.

Constraints:
- DO NOT speak directly to users.
- DO NOT modify existing memories without validation.`,
            model: 'gpt-4o-mini',
            temperature: 0.3,
            active: true
        },
        {
            id: 'c9d0e1f2-a3b4-5678-cdef-789012345690',
            agentId: 'lugh',
            name: 'Lugh: Skill Curriculum',
            promptText: `You are "Lugh", the Skill Curriculum designer. Your role is to help organize and structure skill learning paths.

Responsibilities:
- Analyze skill requirements and prerequisites.
- Structure learning sequences.
- Identify skill connections and dependencies.

Constraints:
- DO NOT make assumptions about user skill level.
- DO NOT skip foundational concepts.`,
            model: 'gpt-4o',
            temperature: 0.4,
            active: true
        },
        {
            id: 'd0e1f2a3-b4c5-6789-defa-890123456701',
            agentId: 'skill',
            name: 'Skill Classifier',
            promptText: `You are a Skill Classifier. Your task is to classify input text, conversation, or concepts into appropriate skill categories.

Return a valid JSON object with the following structure:
{
  "primarySkill": "Skill name",
  "secondarySkills": ["Skill 1", "Skill 2"],
  "confidence": 0.0-1.0
}`,
            model: 'gpt-4o-mini',
            temperature: 0.2,
            active: true
        }
    ];

    try {
        for (const agent of agents) {
            const existing = await prisma.systemPrompt.findUnique({
                where: { agentId: agent.agentId }
            });
            
            if (!existing) {
                await prisma.systemPrompt.create({
                    data: agent
                });
                console.log(`[Bootstrap] Seeded prompt for agent: ${agent.agentId}`);
            } else {
                console.log(`[Bootstrap] Prompt already exists for agent: ${agent.agentId}`);
            }
        }
        console.log('[Bootstrap] Agent prompts seeding complete');
    } catch (err) {
        console.error('[Bootstrap] Error seeding prompts:', err);
    }
}

async function seedAdminUser() {
    const { prisma } = await import('./db.js');
    
    const adminEmail = 'thetboard@gmail.com';
    
    try {
        const existing = await prisma.user.findUnique({
            where: { email: adminEmail }
        });
        
        if (!existing) {
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    name: 'Thet Board',
                    role: 'admin',
                    plan: 'pro',
                    password: null
                }
            });
            console.log(`[Bootstrap] Seeded admin user: ${adminEmail}`);
        } else if (existing.role !== 'admin') {
            await prisma.user.update({
                where: { email: adminEmail },
                data: { role: 'admin', plan: 'pro' }
            });
            console.log(`[Bootstrap] Updated user ${adminEmail} to admin`);
        } else {
            console.log(`[Bootstrap] Admin user ${adminEmail} already exists`);
        }
    } catch (err) {
        console.error('[Bootstrap] Error seeding admin user:', err);
    }
}

async function seedSkillsAndTopics() {
    const { prisma } = await import('./db.js');
    
    const skills = [
        { id: 'skill-math-001', title: 'Mathematics', description: 'The abstract science of number, quantity, and space', category: 'STEM' },
        { id: 'skill-science-001', title: 'Science', description: 'Systematic study of the natural world', category: 'STEM' },
        { id: 'skill-history-001', title: 'History', description: 'The study of past events', category: 'Humanities' },
        { id: 'skill-language-001', title: 'Language Arts', description: 'Communication through writing and reading', category: 'Humanities' },
        { id: 'skill-art-001', title: 'Art & Design', description: 'Creative expression and visual communication', category: 'Arts' },
    ];
    
    const topics = [
        { id: 'topic-001', title: 'The Scientific Method', category: 'Science', description: 'A systematic approach to investigating phenomena' },
        { id: 'topic-002', title: 'World War II', category: 'History', description: 'Global conflict from 1939 to 1945' },
        { id: 'topic-003', title: 'Algebra Fundamentals', category: 'Mathematics', description: 'Basic algebraic concepts and operations' },
        { id: 'topic-004', title: 'Creative Writing', category: 'Language Arts', description: 'Writing with artistic intent' },
        { id: 'topic-005', title: 'Art History', category: 'Art & Design', description: 'The study of art across cultures and time periods' },
    ];
    
    const badges = [
        { id: 'badge-curious-001', name: 'Curious Mind', description: 'Started your first conversation', icon: '🌟', xpReward: 10 },
        { id: 'badge-explorer-001', name: 'Explorer', description: 'Learned about 5 different topics', icon: '🧭', xpReward: 50 },
        { id: 'badge-deep-dive-001', name: 'Deep Diver', description: 'Completed a topic with 10+ messages', icon: '🐋', xpReward: 100 },
        { id: 'badge-master-001', name: 'Knowledge Master', description: 'Reached level 5 in any skill', icon: '🎓', xpReward: 200 },
    ];
    
    try {
        for (const skill of skills) {
            const existing = await prisma.skill.findUnique({ where: { id: skill.id } });
            if (!existing) {
                await prisma.skill.create({ data: skill });
                console.log(`[Bootstrap] Seeded skill: ${skill.title}`);
            }
        }
        
        for (const topic of topics) {
            const existing = await prisma.topic.findUnique({ where: { id: topic.id } });
            if (!existing) {
                await prisma.topic.create({ data: topic });
                console.log(`[Bootstrap] Seeded topic: ${topic.title}`);
            }
        }
        
        for (const badge of badges) {
            const existing = await prisma.badge.findUnique({ where: { id: badge.id } });
            if (!existing) {
                await prisma.badge.create({ data: badge });
                console.log(`[Bootstrap] Seeded badge: ${badge.name}`);
            }
        }
        
        console.log('[Bootstrap] Skills, Topics, and Badges seeding complete');
    } catch (err) {
        console.error('[Bootstrap] Error seeding skills/topics/badges:', err);
    }
}

async function startServer() {
    try {
        await connectDatabase();
        console.log("[Bootstrap] Database connected");
        
        await seedPrompts();
        await seedAdminUser();
        await seedSkillsAndTopics();
        await loadRoutes();
        app.use(express.static(path.join(__dirname, "public")));
        
        app.get("/VERSION.txt", (_req, res) => {
            const versionPath = path.join(__dirname, "VERSION");
            res.sendFile(versionPath);
        });
        
        app.get("/version", (_req, res) => {
            const versionPath = path.join(__dirname, "VERSION");
            res.sendFile(versionPath);
        });
        
        app.get("*", (_req, res) => {
            const indexPath = path.join(__dirname, "public/index.html");
            res.sendFile(indexPath);
        });
        
        console.log("[Bootstrap] Full application loaded successfully");
        
        server.listen(PORT, "0.0.0.0", () => {
            console.log(`[Bootstrap] ARIS server listening on port ${PORT}`);
            
            socketServer.initialize(server);
            console.log('[Bootstrap] WebSocket server initialized');
        });
    } catch (err) {
        console.error("[Bootstrap] Failed to load application:", err);
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', async () => {
    console.log('[Bootstrap] Shutting down...');
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[Bootstrap] Shutting down...');
    await disconnectDatabase();
    process.exit(0);
});
