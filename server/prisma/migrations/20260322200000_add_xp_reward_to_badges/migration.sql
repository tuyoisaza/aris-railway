-- Add xpReward field to Badge model
ALTER TABLE "badges" ADD COLUMN "xpReward" INTEGER DEFAULT 0;
