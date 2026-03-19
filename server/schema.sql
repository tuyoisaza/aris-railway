-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    age INTEGER,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan TEXT DEFAULT 'free',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAMILY TABLE
-- We treat a "family" as a group. A user can belong to a family.
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. "The Smith Family"
    pin TEXT, -- 4-digit PIN for Focus/Parent mode
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAMILY MEMBERS LINK
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('Parent', 'Child', 'Admin')) DEFAULT 'Child',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    stats JSONB DEFAULT '{}',
    UNIQUE(family_id, user_id)
);

-- INVITATIONS (New Feature)
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL, -- The unique code in the link
    status TEXT CHECK (status IN ('Pending', 'Accepted', 'Expired')) DEFAULT 'Pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- TOPICS
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    depth INTEGER DEFAULT 1,
    max_depth INTEGER DEFAULT 7,
    engagement INTEGER DEFAULT 0,
    connections INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RESOURCES (New Feature: replacing "Concept Books", "Papers" buttons)
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('Book', 'Paper', 'Video', 'Interactable', 'Web')),
    url TEXT, -- Link to external content or internal simple viewer
    view_status TEXT CHECK (view_status IN ('Locked', 'Available', 'Completed')) DEFAULT 'Locked',
    metadata JSONB, -- Store extra info like author, page_count, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_TOPIC_PROGRESS
CREATE TABLE user_topic_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    current_depth INTEGER DEFAULT 1,
    engagement_score INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

-- PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('idea', 'active', 'paused', 'completed', 'archived')) DEFAULT 'active',
    why_text TEXT, -- "Because..."
    scope_text TEXT, -- "Scope..."
    next_step TEXT,
    blockers TEXT,
    definition_of_done TEXT,
    -- Pet Projects additions
    origin_topic_id TEXT REFERENCES topics(id),
    visibility TEXT CHECK (visibility IN ('private', 'summary_shared', 'full_shared')) DEFAULT 'private',
    why_care TEXT,
    intent TEXT,
    support_notes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROJECT ARTIFACTS
CREATE TABLE project_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('file', 'link', 'text', 'image')) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROJECT REFLECTIONS
CREATE TABLE project_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROJECT COMMENTS
CREATE TABLE project_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONVERSATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id), -- Optional, conversation might get linked to a topic
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'ai', 'system')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
