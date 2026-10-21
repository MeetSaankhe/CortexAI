-- =============================================================================
-- Migration: 00000000000004_create_relationships_and_indexes.sql
-- Description: Create foreign keys, unique constraints, and performance indexes
-- =============================================================================

-- ─── Unique Indexes ──────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_refreshHash_key" ON "sessions"("refreshHash");
CREATE UNIQUE INDEX IF NOT EXISTS "password_resets_tokenHash_key" ON "password_resets"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_userId_provider_keyFingerprint_key" ON "api_keys"("userId", "provider", "keyFingerprint");
CREATE UNIQUE INDEX IF NOT EXISTS "compression_metrics_compressionId_key" ON "compression_metrics"("compressionId");

-- ─── Performance & Query Lookup Indexes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS "password_resets_userId_idx" ON "password_resets"("userId");
CREATE INDEX IF NOT EXISTS "api_keys_userId_provider_idx" ON "api_keys"("userId", "provider");
CREATE INDEX IF NOT EXISTS "documents_userId_idx" ON "documents"("userId");
CREATE INDEX IF NOT EXISTS "compressions_userId_idx" ON "compressions"("userId");
CREATE INDEX IF NOT EXISTS "compressions_documentId_idx" ON "compressions"("documentId");
CREATE INDEX IF NOT EXISTS "compressions_createdAt_idx" ON "compressions"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs"("action");
CREATE INDEX IF NOT EXISTS "jobs_userId_status_idx" ON "jobs"("userId", "status");
CREATE INDEX IF NOT EXISTS "jobs_status_createdAt_idx" ON "jobs"("status", "createdAt" DESC);

-- ─── Foreign Key Constraints ─────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_userId_fkey') THEN
        ALTER TABLE "sessions"
            ADD CONSTRAINT "sessions_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_resets_userId_fkey') THEN
        ALTER TABLE "password_resets"
            ADD CONSTRAINT "password_resets_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_userId_fkey') THEN
        ALTER TABLE "api_keys"
            ADD CONSTRAINT "api_keys_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_userId_fkey') THEN
        ALTER TABLE "documents"
            ADD CONSTRAINT "documents_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compressions_userId_fkey') THEN
        ALTER TABLE "compressions"
            ADD CONSTRAINT "compressions_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compressions_documentId_fkey') THEN
        ALTER TABLE "compressions"
            ADD CONSTRAINT "compressions_documentId_fkey"
            FOREIGN KEY ("documentId") REFERENCES "documents"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compression_metrics_compressionId_fkey') THEN
        ALTER TABLE "compression_metrics"
            ADD CONSTRAINT "compression_metrics_compressionId_fkey"
            FOREIGN KEY ("compressionId") REFERENCES "compressions"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_userId_fkey') THEN
        ALTER TABLE "activity_logs"
            ADD CONSTRAINT "activity_logs_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_userId_fkey') THEN
        ALTER TABLE "jobs"
            ADD CONSTRAINT "jobs_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
