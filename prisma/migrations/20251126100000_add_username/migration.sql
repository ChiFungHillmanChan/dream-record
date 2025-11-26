-- Add username column to User table (nullable, unique)
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Create unique index for username (SQLite supports this)
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
