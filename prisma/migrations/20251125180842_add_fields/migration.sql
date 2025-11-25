/*
  Warnings:

  - Added the required column `date` to the `Dream` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'dream',
    "date" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "analysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dream" ("analysis", "content", "createdAt", "id", "updatedAt") SELECT "analysis", "content", "createdAt", "id", "updatedAt" FROM "Dream";
DROP TABLE "Dream";
ALTER TABLE "new_Dream" RENAME TO "Dream";
CREATE INDEX "Dream_date_idx" ON "Dream"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
