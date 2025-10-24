-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'PROPERTY', 'VEHICLE', 'CRYPTO', 'OTHER');

-- CreateEnum
CREATE TYPE "LiabilityType" AS ENUM ('CREDIT_CARD', 'STUDENT_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'PERSONAL_LOAN', 'OTHER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "institution" TEXT,
    "accountNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LiabilityType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interestRate" DECIMAL(5,2),
    "minimumPayment" DECIMAL(10,2),
    "dueDate" INTEGER,
    "institution" TEXT,
    "accountNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "liabilityId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_isActive_idx" ON "Account"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Liability_userId_idx" ON "Liability"("userId");

-- CreateIndex
CREATE INDEX "Liability_userId_isActive_idx" ON "Liability"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Balance_date_idx" ON "Balance"("date");

-- CreateIndex
CREATE INDEX "Balance_accountId_date_idx" ON "Balance"("accountId", "date");

-- CreateIndex
CREATE INDEX "Balance_liabilityId_date_idx" ON "Balance"("liabilityId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_accountId_date_key" ON "Balance"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_liabilityId_date_key" ON "Balance"("liabilityId", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liability" ADD CONSTRAINT "Liability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "Liability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
