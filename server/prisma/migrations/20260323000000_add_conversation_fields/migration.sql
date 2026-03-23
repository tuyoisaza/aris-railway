-- Add isArchived and folderId fields to Conversation
ALTER TABLE "conversations" ADD COLUMN "isArchived" INTEGER DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN "folderId" TEXT;
