/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'COBRADOR', 'TENANT');

-- CreateEnum
CREATE TYPE "PropStatus" AS ENUM ('OCCUPIED', 'EMPTY', 'RESERVED', 'RTO', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('REGULAR', 'RTO');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'RENEWED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID_ON_TIME', 'PAID_LATE', 'PARTIAL', 'PENDING', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('HEMLANE', 'MONEY_ORDER', 'CASH', 'CHECK', 'ZELLE_MIKE', 'ZELLE_NADER');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('RED', 'YELLOW', 'GREEN');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CONTRACT_EXPIRING', 'CONTRACT_EXPIRED', 'PAYMENT_OVERDUE', 'PROPERTY_VACANT');

-- DropTable
DROP TABLE "Admin";

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "supabaseUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "tenantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "houseModel" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "baseRent" DECIMAL(10,2) NOT NULL,
    "status" "PropStatus" NOT NULL DEFAULT 'EMPTY',
    "contractType" "ContractType" NOT NULL DEFAULT 'REGULAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "supabaseUid" TEXT,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "propertyId" TEXT NOT NULL,
    "moveInDate" DATE NOT NULL,
    "rentAmount" DECIMAL(10,2) NOT NULL,
    "preferredPayment" "PaymentMethod",
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "startDate" DATE NOT NULL,
    "durationYears" INTEGER NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "renewalNumber" INTEGER NOT NULL DEFAULT 0,
    "parentContractId" TEXT,
    "alertSentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RTODetail" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "egsFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalSalePrice" DECIMAL(12,2) NOT NULL,
    "optionAgreementMonthly" DECIMAL(8,2) NOT NULL DEFAULT 300,
    "initialDeposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ceaseRentalDate" DATE,
    "closingDate" DATE,

    CONSTRAINT "RTODetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contractId" TEXT,
    "billingMonth" INTEGER NOT NULL,
    "billingYear" INTEGER NOT NULL,
    "rentAmount" DECIMAL(10,2) NOT NULL,
    "securityDeposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastMonthDeposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lateFeesAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" DATE,
    "receivedBy" TEXT,
    "paymentMethod" "PaymentMethod",
    "depositConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "paymentRecordId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "transactionDate" DATE NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "receivedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateFeeConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 3,
    "flatFeeDay4" DECIMAL(8,2) NOT NULL DEFAULT 42.00,
    "dailyFeeAfter" DECIMAL(8,2) NOT NULL DEFAULT 11.35,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LateFeeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertNotification" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_supabaseUid_key" ON "UserProfile"("supabaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_tenantId_key" ON "UserProfile"("tenantId");

-- CreateIndex
CREATE INDEX "UserProfile_supabaseUid_idx" ON "UserProfile"("supabaseUid");

-- CreateIndex
CREATE INDEX "UserProfile_role_idx" ON "UserProfile"("role");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_isActive_idx" ON "Property"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_supabaseUid_key" ON "Tenant"("supabaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

-- CreateIndex
CREATE INDEX "Tenant_propertyId_idx" ON "Tenant"("propertyId");

-- CreateIndex
CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");

-- CreateIndex
CREATE INDEX "Tenant_email_idx" ON "Tenant"("email");

-- CreateIndex
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId");

-- CreateIndex
CREATE INDEX "Contract_propertyId_idx" ON "Contract"("propertyId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "RTODetail_contractId_key" ON "RTODetail"("contractId");

-- CreateIndex
CREATE INDEX "PaymentRecord_propertyId_idx" ON "PaymentRecord"("propertyId");

-- CreateIndex
CREATE INDEX "PaymentRecord_billingMonth_billingYear_idx" ON "PaymentRecord"("billingMonth", "billingYear");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentStatus_idx" ON "PaymentRecord"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_tenantId_billingMonth_billingYear_key" ON "PaymentRecord"("tenantId", "billingMonth", "billingYear");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentRecordId_idx" ON "PaymentTransaction"("paymentRecordId");

-- CreateIndex
CREATE INDEX "TenantNote_tenantId_idx" ON "TenantNote"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "AlertNotification_isRead_idx" ON "AlertNotification"("isRead");

-- CreateIndex
CREATE INDEX "AlertNotification_severity_idx" ON "AlertNotification"("severity");

-- CreateIndex
CREATE INDEX "AlertNotification_type_idx" ON "AlertNotification"("type");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RTODetail" ADD CONSTRAINT "RTODetail_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentRecordId_fkey" FOREIGN KEY ("paymentRecordId") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantNote" ADD CONSTRAINT "TenantNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantNote" ADD CONSTRAINT "TenantNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
