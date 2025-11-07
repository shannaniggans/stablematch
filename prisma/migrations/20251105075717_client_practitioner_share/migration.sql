-- CreateTable
CREATE TABLE "ClientPractitionerShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "shareProfile" BOOLEAN NOT NULL DEFAULT true,
    "shareHorses" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientPractitionerShare_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientPractitionerShare_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClientPractitionerShare_practitionerId_idx" ON "ClientPractitionerShare"("practitionerId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPractitionerShare_clientId_practitionerId_key" ON "ClientPractitionerShare"("clientId", "practitionerId");
