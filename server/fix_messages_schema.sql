
DO $$ 
BEGIN 
    -- Check if 'content' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content') THEN
        -- Check if 'text' column exists (legacy)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'text') THEN
            ALTER TABLE messages RENAME COLUMN "text" TO "content";
        ELSE
            ALTER TABLE messages ADD COLUMN "content" TEXT DEFAULT '';
        END IF;
    END IF;

    -- Ensure 'role' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'role') THEN
         ALTER TABLE messages ADD COLUMN "role" TEXT CHECK (role IN ('user', 'ai', 'system')) NOT NULL DEFAULT 'user';
    END IF;
END $$;
