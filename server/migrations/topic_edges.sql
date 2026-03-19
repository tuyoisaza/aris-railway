CREATE TABLE IF NOT EXISTS topic_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_topic_id UUID NOT NULL,
    target_topic_id UUID NOT NULL,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(source_topic_id, target_topic_id)
);
