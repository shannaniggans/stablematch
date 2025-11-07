-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "shareProfileWithPractitioners" BOOLEAN NOT NULL DEFAULT false,
    "shareHorsesWithPractitioners" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "practiceId", "updatedAt") SELECT "address", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "practiceId", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");
CREATE INDEX "Client_practiceId_idx" ON "Client"("practiceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
