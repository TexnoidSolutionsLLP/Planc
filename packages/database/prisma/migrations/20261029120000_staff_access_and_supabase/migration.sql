-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('STORE', 'ORDERS', 'CUSTOMERS', 'PRODUCTS', 'BILLING', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'CANCELLED');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedReason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authId" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "suspendedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "access_requests" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "scope" "AccessScope" NOT NULL,
    "requestedView" BOOLEAN NOT NULL DEFAULT false,
    "requestedModify" BOOLEAN NOT NULL DEFAULT false,
    "grantedView" BOOLEAN NOT NULL DEFAULT false,
    "grantedModify" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_requests_storeId_status_idx" ON "access_requests"("storeId", "status");

-- CreateIndex
CREATE INDEX "access_requests_requestedById_status_idx" ON "access_requests"("requestedById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_authId_key" ON "users"("authId");

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ----------------------------------------------------------------------------
-- Database-level rules for staff access requests (Prisma can't express these;
-- they are the last line of defence if application code ever gets it wrong).
-- ----------------------------------------------------------------------------

ALTER TABLE "access_requests"
  ADD CONSTRAINT "access_requests_duration_check" CHECK ("durationHours" BETWEEN 1 AND 720),
  ADD CONSTRAINT "access_requests_reason_check" CHECK (char_length(btrim("reason")) BETWEEN 10 AND 1000),
  ADD CONSTRAINT "access_requests_requested_level_check" CHECK ("requestedView" OR "requestedModify"),
  ADD CONSTRAINT "access_requests_granted_subset_check" CHECK (
    (NOT "grantedView" OR "requestedView") AND (NOT "grantedModify" OR "requestedModify")
  ),
  ADD CONSTRAINT "access_requests_no_self_decision_check" CHECK (
    "decidedById" IS NULL OR "decidedById" <> "requestedById"
  ),
  ADD CONSTRAINT "access_requests_approved_shape_check" CHECK (
    "status" <> 'APPROVED'
    OR ("decidedById" IS NOT NULL AND "decidedAt" IS NOT NULL AND "expiresAt" IS NOT NULL AND ("grantedView" OR "grantedModify"))
  );

CREATE OR REPLACE FUNCTION access_requests_enforce() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  is_owner boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" <> 'PENDING' OR NEW."grantedView" OR NEW."grantedModify"
       OR NEW."decidedById" IS NOT NULL OR NEW."decidedAt" IS NOT NULL OR NEW."expiresAt" IS NOT NULL
       OR NEW."revokedById" IS NOT NULL OR NEW."revokedAt" IS NOT NULL THEN
      RAISE EXCEPTION 'access request must be created as PENDING with nothing granted';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM "users" u WHERE u."id" = NEW."requestedById" AND u."platformRole" = 'PLATFORM_ADMIN' AND u."status" = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'only active Sellly staff can request access';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: the request itself is immutable once filed.
  IF NEW."storeId" IS DISTINCT FROM OLD."storeId"
     OR NEW."requestedById" IS DISTINCT FROM OLD."requestedById"
     OR NEW."scope" IS DISTINCT FROM OLD."scope"
     OR NEW."requestedView" IS DISTINCT FROM OLD."requestedView"
     OR NEW."requestedModify" IS DISTINCT FROM OLD."requestedModify"
     OR NEW."reason" IS DISTINCT FROM OLD."reason"
     OR NEW."durationHours" IS DISTINCT FROM OLD."durationHours"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'the contents of an access request cannot be changed';
  END IF;

  IF OLD."status" = 'PENDING' AND NEW."status" IN ('APPROVED', 'REJECTED') THEN
    SELECT EXISTS (
      SELECT 1
      FROM "store_members" m
      JOIN "users" u ON u."id" = m."userId"
      WHERE m."storeId" = NEW."storeId"
        AND m."userId" = NEW."decidedById"
        AND m."role" = 'OWNER'
        AND u."platformRole" = 'MERCHANT'
        AND u."status" = 'ACTIVE'
    ) INTO is_owner;
    IF NOT is_owner OR NEW."decidedById" = NEW."requestedById" THEN
      RAISE EXCEPTION 'only the store owner (a merchant, not the requester) can decide an access request';
    END IF;
    IF NEW."revokedById" IS NOT NULL OR NEW."revokedAt" IS NOT NULL THEN
      RAISE EXCEPTION 'a decision cannot also revoke';
    END IF;
    -- Times come from the database clock, not the caller. Columns are
    -- "timestamp without time zone" holding UTC (Prisma's convention), so convert
    -- explicitly rather than depend on the session TimeZone setting.
    NEW."decidedAt" := (now() AT TIME ZONE 'UTC');
    IF NEW."status" = 'APPROVED' THEN
      NEW."expiresAt" := (now() AT TIME ZONE 'UTC') + make_interval(hours => NEW."durationHours");
    ELSE
      NEW."grantedView" := false;
      NEW."grantedModify" := false;
      NEW."expiresAt" := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD."status" = 'PENDING' AND NEW."status" = 'CANCELLED' THEN
    IF NEW."revokedById" IS DISTINCT FROM OLD."requestedById" THEN
      RAISE EXCEPTION 'only the requester can cancel a pending request';
    END IF;
    NEW."revokedAt" := (now() AT TIME ZONE 'UTC');
    RETURN NEW;
  END IF;

  IF OLD."status" = 'APPROVED' AND NEW."status" = 'REVOKED' THEN
    IF NEW."grantedView" IS DISTINCT FROM OLD."grantedView"
       OR NEW."grantedModify" IS DISTINCT FROM OLD."grantedModify"
       OR NEW."decidedById" IS DISTINCT FROM OLD."decidedById"
       OR NEW."decidedAt" IS DISTINCT FROM OLD."decidedAt"
       OR NEW."expiresAt" IS DISTINCT FROM OLD."expiresAt" THEN
      RAISE EXCEPTION 'revoking cannot change the original decision';
    END IF;
    IF NEW."revokedById" IS NULL OR NOT (
      NEW."revokedById" = OLD."requestedById"
      OR EXISTS (
        SELECT 1 FROM "store_members" m JOIN "users" u ON u."id" = m."userId"
        WHERE m."storeId" = NEW."storeId" AND m."userId" = NEW."revokedById" AND m."role" = 'OWNER' AND u."platformRole" = 'MERCHANT'
      )
    ) THEN
      RAISE EXCEPTION 'only the store owner or the requester can revoke access';
    END IF;
    NEW."revokedAt" := (now() AT TIME ZONE 'UTC');
    RETURN NEW;
  END IF;

  IF OLD."status" = NEW."status"
     AND NEW."grantedView" IS NOT DISTINCT FROM OLD."grantedView"
     AND NEW."grantedModify" IS NOT DISTINCT FROM OLD."grantedModify"
     AND NEW."decidedById" IS NOT DISTINCT FROM OLD."decidedById"
     AND NEW."decidedAt" IS NOT DISTINCT FROM OLD."decidedAt"
     AND NEW."expiresAt" IS NOT DISTINCT FROM OLD."expiresAt"
     AND NEW."revokedById" IS NOT DISTINCT FROM OLD."revokedById"
     AND NEW."revokedAt" IS NOT DISTINCT FROM OLD."revokedAt" THEN
    RETURN NEW; -- e.g. only decisionNote / updatedAt touched
  END IF;

  RAISE EXCEPTION 'invalid access request transition % -> %', OLD."status", NEW."status";
END;
$$;

CREATE TRIGGER "access_requests_enforce"
  BEFORE INSERT OR UPDATE ON "access_requests"
  FOR EACH ROW EXECUTE FUNCTION access_requests_enforce();

-- ----------------------------------------------------------------------------
-- Supabase Data API lockdown.
--
-- Supabase exposes the public schema over its REST/GraphQL API to the `anon`
-- and `authenticated` roles, and the anon key is public. The apps never use
-- that API - all data access goes through Prisma on the server as the table
-- owner - so enable RLS with no policies (deny all) and drop those roles'
-- privileges. Guarded so the migration also runs on plain Postgres (local dev),
-- where these roles don't exist.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  t record;
  r text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;
