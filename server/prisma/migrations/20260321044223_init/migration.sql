-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "avatar" TEXT,
    "age" INTEGER,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "role" TEXT NOT NULL DEFAULT 'user',
    "description" TEXT,
    "pin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Child',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stats" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "family_members_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "family_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "invitations_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invitations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "content" TEXT,
    "instruction" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "maxDepth" INTEGER NOT NULL DEFAULT 7,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "connections" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "topics_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "topic_edges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'default',
    "weight" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "topic_edges_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "topic_edges_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "viewStatus" TEXT NOT NULL DEFAULT 'Locked',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resources_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_topic_progress" (
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "currentDepth" INTEGER NOT NULL DEFAULT 1,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "topicId"),
    CONSTRAINT "user_topic_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_topic_progress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "whyText" TEXT,
    "scopeText" TEXT,
    "nextStep" TEXT,
    "blockers" TEXT,
    "definitionOfDone" TEXT,
    "originTopicId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "whyCare" TEXT,
    "intent" TEXT,
    "supportNotes" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_artifacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_artifacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_reflections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_reflections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicId" TEXT,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "conversations_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT,
    CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shared_entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "sharedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shared_entities_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shared_entities_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_presence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentActivity" TEXT,
    "currentEntityType" TEXT,
    "currentEntityId" TEXT,
    "socketId" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_presence_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collaborative_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "sharedEntityId" TEXT,
    "initiatedBy" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledFor" DATETIME,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "collaborative_sessions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collaborative_sessions_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    "contributionScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collaboration_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL DEFAULT '{}',
    "entityType" TEXT,
    "entityId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collaboration_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "collaboration_events_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collaboration_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "depth" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "skill_edges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'sub_skill',
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "skill_edges_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "skill_edges_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_skill_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_skill_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_skill_progress_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_stable_state" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "userRole" TEXT NOT NULL DEFAULT 'adult',
    "familyBoundaries" TEXT NOT NULL DEFAULT '{}',
    "consentFlags" TEXT NOT NULL DEFAULT '{"memory_enabled":true,"trait_inference":true,"cross_session_learning":true}',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "languagePref" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agora_stable_state_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_user_memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "traitKey" TEXT NOT NULL,
    "traitValue" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "lastConfirmed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decayFactor" REAL NOT NULL DEFAULT 1.0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agora_user_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_session_context" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeTopic" TEXT,
    "currentPosture" TEXT NOT NULL DEFAULT 'guide',
    "taskIntent" TEXT,
    "constraints" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "agora_session_context_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_post_action_buffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "signalData" TEXT NOT NULL,
    "conversationId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agora_post_action_buffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agora_post_action_buffer_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agora_memory_audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "traitKey" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agora_memory_audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "xp_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "xpAmount" INTEGER NOT NULL DEFAULT 0,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "xp_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "category" TEXT,
    "criteria" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "presence_updates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "event" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "presence_updates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_familyId_userId_key" ON "family_members"("familyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "topic_edges_sourceId_targetId_key" ON "topic_edges"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "user_presence_userId_key" ON "user_presence"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_sessionId_userId_key" ON "session_participants"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_edges_sourceId_targetId_key" ON "skill_edges"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "user_skill_progress_userId_skillId_key" ON "user_skill_progress"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "agora_user_memory_userId_traitKey_key" ON "agora_user_memory"("userId", "traitKey");

-- CreateIndex
CREATE UNIQUE INDEX "agora_session_context_sessionId_key" ON "agora_session_context"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "system_prompts_name_key" ON "system_prompts"("name");
