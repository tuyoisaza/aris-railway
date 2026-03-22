-- Update system_prompts table with new schema
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Create new table with updated schema
CREATE TABLE "new_system_prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "active" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Copy existing data if any (map old columns to new)
INSERT INTO "new_system_prompts" ("id", "name", "promptText", "createdAt", "updatedAt")
SELECT "id", "name", "content", "createdAt", "updatedAt" FROM "system_prompts";

-- Drop old table
DROP TABLE "system_prompts";

-- Rename to new table
ALTER TABLE "new_system_prompts" RENAME TO "system_prompts";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
