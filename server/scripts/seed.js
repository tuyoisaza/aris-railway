import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function seed() {
    console.log('[Seed] Starting database seed...\n');

    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');

    const admin = await prisma.user.upsert({
        where: { email: 'admin@aris.app' },
        update: {},
        create: {
            email: 'admin@aris.app',
            password: adminPassword,
            name: 'Admin User',
            role: 'admin',
            plan: 'pro'
        }
    });
    console.log(`[Seed] Created admin: ${admin.email}`);

    const users = [];
    for (let i = 1; i <= 5; i++) {
        const user = await prisma.user.upsert({
            where: { email: `user${i}@test.com` },
            update: {},
            create: {
                email: `user${i}@test.com`,
                password: userPassword,
                name: `Test User ${i}`,
                role: 'user',
                plan: i % 2 === 0 ? 'pro' : 'free'
            }
        });
        users.push(user);
    }
    console.log(`[Seed] Created ${users.length} test users`);

    const family = await prisma.family.create({
        data: {
            name: 'Test Family',
            members: {
                create: [
                    { userId: admin.id, role: 'Admin' },
                    { userId: users[0].id, role: 'Parent' },
                    { userId: users[1].id, role: 'Child' }
                ]
            }
        },
        include: { members: true }
    });
    console.log(`[Seed] Created family: ${family.name} with ${family.members.length} members`);

    const pendingInvite = await prisma.invitation.create({
        data: {
            familyId: family.id,
            email: 'pending@test.com',
            token: 'test-pending-token',
            status: 'Pending',
            createdBy: admin.id
        }
    });
    const acceptedInvite = await prisma.invitation.create({
        data: {
            familyId: family.id,
            email: 'accepted@test.com',
            token: 'test-accepted-token',
            status: 'Accepted',
            createdBy: admin.id
        }
    });
    console.log(`[Seed] Created 2 invitations (1 pending, 1 accepted)`);

    const folders = [];
    for (let i = 1; i <= 3; i++) {
        const folder = await prisma.folder.create({
            data: { userId: admin.id, name: `Folder ${i}` }
        });
        folders.push(folder);
    }
    console.log(`[Seed] Created ${folders.length} folders`);

    const topics = [];
    const topicData = [
        { title: 'JavaScript Fundamentals', category: 'Programming', depth: 2 },
        { title: 'React Hooks', category: 'Programming', depth: 3 },
        { title: 'Node.js Basics', category: 'Backend', depth: 1 },
        { title: 'Database Design', category: 'Data', depth: 2 },
        { title: 'API Development', category: 'Backend', depth: 3 }
    ];
    for (const t of topicData) {
        const topic = await prisma.topic.create({
            data: {
                title: t.title,
                category: t.category,
                depth: t.depth,
                maxDepth: 7,
                engagement: Math.floor(Math.random() * 100),
                connections: Math.floor(Math.random() * 20),
                createdBy: admin.id
            }
        });
        topics.push(topic);
    }
    console.log(`[Seed] Created ${topics.length} topics`);

    const resources = [];
    for (const topic of topics.slice(0, 3)) {
        const resource = await prisma.resource.create({
            data: {
                topicId: topic.id,
                title: `Resource for ${topic.title}`,
                type: 'article',
                url: 'https://example.com/resource'
            }
        });
        resources.push(resource);
    }
    console.log(`[Seed] Created ${resources.length} resources`);

    const conversations = [];
    for (let i = 1; i <= 5; i++) {
        const conv = await prisma.conversation.create({
            data: {
                userId: admin.id,
                title: `Conversation ${i}`,
                topicId: i <= 2 ? topics[i - 1].id : null,
                folderId: i <= 2 ? folders[0].id : null,
                isArchived: i === 5
            }
        });
        conversations.push(conv);
    }
    console.log(`[Seed] Created ${conversations.length} conversations (1 archived)`);

    const messages = [];
    for (const conv of conversations) {
        const userMsg = await prisma.message.create({
            data: {
                conversationId: conv.id,
                role: 'user',
                content: `User message in ${conv.title}`
            }
        });
        messages.push(userMsg);

        const aiMsg = await prisma.message.create({
            data: {
                conversationId: conv.id,
                role: 'ai',
                content: `AI response to user message`
            }
        });
        messages.push(aiMsg);
    }
    console.log(`[Seed] Created ${messages.length} messages`);

    const projects = [];
    const projectStatuses = ['active', 'active', 'completed', 'paused', 'idea'];
    for (let i = 0; i < 5; i++) {
        const project = await prisma.project.create({
            data: {
                userId: admin.id,
                title: `Project ${i + 1}`,
                status: projectStatuses[i],
                whyText: `Why text for project ${i + 1}`,
                scopeText: `Scope text for project ${i + 1}`
            }
        });
        projects.push(project);
    }
    console.log(`[Seed] Created ${projects.length} projects (2 active, 1 completed, 1 paused, 1 idea)`);

    const skills = [];
    const skillData = [
        { title: 'JavaScript', category: 'Programming' },
        { title: 'Python', category: 'Programming' },
        { title: 'Cooking', category: 'Life' },
        { title: 'Communication', category: 'Soft Skills' }
    ];
    for (const s of skillData) {
        const skill = await prisma.skill.create({
            data: { title: s.title, category: s.category }
        });
        skills.push(skill);
    }
    console.log(`[Seed] Created ${skills.length} skills`);

    const skillProgress = [];
    for (const skill of skills) {
        const progress = await prisma.userSkillProgress.create({
            data: {
                userId: admin.id,
                skillId: skill.id,
                level: Math.floor(Math.random() * 5) + 1,
                xp: Math.floor(Math.random() * 500),
                confidenceScore: Math.floor(Math.random() * 100)
            }
        });
        skillProgress.push(progress);
    }
    console.log(`[Seed] Created ${skillProgress.length} skill progress records`);

    const badges = [];
    const badgeData = [
        { name: 'First Steps', icon: '🎯', xpReward: 10, category: 'milestone' },
        { name: 'Conversation Starter', icon: '💬', xpReward: 25, category: 'engagement' },
        { name: 'Topic Explorer', icon: '🗺️', xpReward: 50, category: 'learning' },
        { name: 'Skill Builder', icon: '🏗️', xpReward: 75, category: 'progress' },
        { name: 'Community Member', icon: '👥', xpReward: 20, category: 'social' }
    ];
    for (const b of badgeData) {
        const badge = await prisma.badge.create({
            data: {
                name: b.name,
                icon: b.icon,
                xpReward: b.xpReward,
                category: b.category,
                description: `Earned for ${b.name.toLowerCase()}`
            }
        });
        badges.push(badge);
    }
    console.log(`[Seed] Created ${badges.length} badges`);

    const userBadges = [];
    for (let i = 0; i < 3; i++) {
        const ub = await prisma.userBadge.create({
            data: {
                userId: admin.id,
                badgeId: badges[i].id,
                metadata: JSON.stringify({ earnedAt: new Date() })
            }
        });
        userBadges.push(ub);
    }
    console.log(`[Seed] Created ${userBadges.length} earned badges`);

    const xpNotifications = [];
    for (let i = 1; i <= 5; i++) {
        const xp = await prisma.xpNotification.create({
            data: {
                userId: admin.id,
                type: 'xp_earned',
                title: `+${i * 10} XP`,
                message: `You earned ${i * 10} experience points!`,
                xpAmount: i * 10,
                read: i > 3
            }
        });
        xpNotifications.push(xp);
    }
    console.log(`[Seed] Created ${xpNotifications.length} XP notifications (2 unread)`);

    const session = await prisma.collaborativeSession.create({
        data: {
            familyId: family.id,
            initiatedBy: admin.id,
            sessionType: 'study_group',
            title: 'Study Session',
            description: 'Weekly study group',
            isActive: true,
            maxParticipants: 5
        }
    });
    const inactiveSession = await prisma.collaborativeSession.create({
        data: {
            familyId: family.id,
            initiatedBy: admin.id,
            sessionType: 'project_review',
            title: 'Project Review',
            description: 'Review project progress',
            isActive: false,
            startsAt: new Date(Date.now() - 86400000),
            endsAt: new Date(Date.now() - 43200000)
        }
    });
    console.log(`[Seed] Created 2 collaborative sessions (1 active)`);

    const sharedEntity = await prisma.sharedEntity.create({
        data: {
            familyId: family.id,
            entityType: 'topic',
            entityId: topics[0].id,
            sharedBy: admin.id,
            title: topics[0].title,
            description: 'Shared learning topic',
            isPublic: true,
            tags: 'javascript,programming'
        }
    });
    console.log(`[Seed] Created 1 shared entity`);

    const actions = [];
    const actionTypes = ['recommendation', 'project:propose', 'badge:award', 'collaboration:invite'];
    for (const type of actionTypes) {
        const action = await prisma.action.create({
            data: {
                userId: admin.id,
                type,
                entityType: 'test',
                metadata: JSON.stringify({ seeded: true })
            }
        });
        actions.push(action);
    }
    console.log(`[Seed] Created ${actions.length} actions (by type)`);

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            userEmail: admin.email,
            action: 'SIGNUP',
            ipAddress: '127.0.0.1'
        }
    });
    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            userEmail: admin.email,
            action: 'LOGIN_SUCCESS',
            ipAddress: '127.0.0.1'
        }
    });
    await prisma.auditLog.create({
        data: {
            userEmail: 'unknown@test.com',
            action: 'LOGIN_FAILURE',
            metadata: JSON.stringify({ reason: 'invalid_password' }),
            ipAddress: '127.0.0.1'
        }
    });
    console.log(`[Seed] Created 3 audit log entries`);

    await prisma.featureFlag.create({
        data: {
            name: 'new_dashboard',
            description: 'Enable new dashboard design',
            scope: 'GLOBAL',
            enabled: true
        }
    });
    await prisma.featureFlag.create({
        data: {
            name: 'beta_features',
            description: 'Beta feature access',
            scope: 'GLOBAL',
            enabled: false
        }
    });
    console.log(`[Seed] Created 2 feature flags (1 enabled)`);

    await prisma.userPresence.create({
        data: {
            userId: admin.id,
            familyId: family.id,
            status: 'online'
        }
    });
    await prisma.userPresence.create({
        data: {
            userId: users[0].id,
            familyId: family.id,
            status: 'away'
        }
    });
    console.log(`[Seed] Created 2 presence records`);

    await prisma.activityLog.create({
        data: {
            userId: admin.id,
            action: 'test_activity',
            entityType: 'seed',
            metadata: JSON.stringify({ seeded: true })
        }
    });
    console.log(`[Seed] Created 1 activity log entry`);

    console.log('\n[Seed] Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('  Admin: admin@aris.app / admin123');
    console.log('  Users: user1@test.com - user5@test.com / user123');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
