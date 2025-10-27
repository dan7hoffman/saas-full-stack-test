/*
  Warnings:

  - You are about to drop the column `userId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Liability` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Liability` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Liability" DROP CONSTRAINT "Liability_userId_fkey";

-- DropIndex
DROP INDEX "Account_userId_idx";

-- DropIndex
DROP INDEX "Account_userId_isActive_idx";

-- DropIndex
DROP INDEX "Liability_userId_idx";

-- DropIndex
DROP INDEX "Liability_userId_isActive_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Liability" DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Account_organizationId_idx" ON "Account"("organizationId");

-- CreateIndex
CREATE INDEX "Account_organizationId_isActive_idx" ON "Account"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Account_deletedAt_idx" ON "Account"("deletedAt");

-- CreateIndex
CREATE INDEX "Liability_organizationId_idx" ON "Liability"("organizationId");

-- CreateIndex
CREATE INDEX "Liability_organizationId_isActive_idx" ON "Liability"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Liability_deletedAt_idx" ON "Liability"("deletedAt");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liability" ADD CONSTRAINT "Liability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liability" ADD CONSTRAINT "Liability_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
