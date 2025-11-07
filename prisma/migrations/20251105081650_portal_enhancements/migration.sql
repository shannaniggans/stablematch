-- AlterTable
ALTER TABLE "Horse" ADD COLUMN "picNumber" TEXT;
ALTER TABLE "Horse" ADD COLUMN "propertyName" TEXT;

-- CreateTable
CREATE TABLE "ClientLinkRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "ClientLinkRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientLinkRequest_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PractitionerTravelSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practitionerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locationName" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "weekday" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PractitionerTravelSlot_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaiverRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "token" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" DATETIME,
    "signatureName" TEXT,
    "signatureEmail" TEXT,
    "signatureData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaiverRequest_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WaiverRequest_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WaiverRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "shareContactInfoDefault" BOOLEAN NOT NULL DEFAULT true,
    "shareAddressDefault" BOOLEAN NOT NULL DEFAULT false,
    "shareNotesDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdByPractitionerId" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "privateUntilLinked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_createdByPractitionerId_fkey" FOREIGN KEY ("createdByPractitionerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "practiceId", "shareHorsesWithPractitioners", "shareProfileWithPractitioners", "updatedAt", "userId") SELECT "address", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "practiceId", "shareHorsesWithPractitioners", "shareProfileWithPractitioners", "updatedAt", "userId" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");
CREATE INDEX "Client_practiceId_idx" ON "Client"("practiceId");
CREATE TABLE "new_ClientPractitionerShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "shareProfile" BOOLEAN NOT NULL DEFAULT true,
    "shareHorses" BOOLEAN NOT NULL DEFAULT true,
    "shareContactInfo" BOOLEAN NOT NULL DEFAULT true,
    "shareAddress" BOOLEAN NOT NULL DEFAULT false,
    "shareNotes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientPractitionerShare_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientPractitionerShare_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClientPractitionerShare" ("clientId", "createdAt", "id", "practitionerId", "shareHorses", "shareProfile", "updatedAt") SELECT "clientId", "createdAt", "id", "practitionerId", "shareHorses", "shareProfile", "updatedAt" FROM "ClientPractitionerShare";
DROP TABLE "ClientPractitionerShare";
ALTER TABLE "new_ClientPractitionerShare" RENAME TO "ClientPractitionerShare";
CREATE INDEX "ClientPractitionerShare_practitionerId_idx" ON "ClientPractitionerShare"("practitionerId");
CREATE UNIQUE INDEX "ClientPractitionerShare_clientId_practitionerId_key" ON "ClientPractitionerShare"("clientId", "practitionerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ClientLinkRequest_clientId_idx" ON "ClientLinkRequest"("clientId");

-- CreateIndex
CREATE INDEX "ClientLinkRequest_practitionerId_idx" ON "ClientLinkRequest"("practitionerId");

-- CreateIndex
CREATE INDEX "PractitionerTravelSlot_practitionerId_start_idx" ON "PractitionerTravelSlot"("practitionerId", "start");

-- CreateIndex
CREATE UNIQUE INDEX "WaiverRequest_token_key" ON "WaiverRequest"("token");

-- CreateIndex
CREATE INDEX "WaiverRequest_practiceId_idx" ON "WaiverRequest"("practiceId");

-- CreateIndex
CREATE INDEX "WaiverRequest_clientId_idx" ON "WaiverRequest"("clientId");
