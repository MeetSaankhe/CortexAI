-- =============================================================================
-- Migration: 00000000000007_create_rls_policies.sql
-- Description: Complete Row Level Security (RLS) policies for data isolation
-- =============================================================================

-- ─── 1. Enable Row Level Security on All Tables ──────────────────────────────
ALTER TABLE "users"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_resets"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compressions"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compression_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jobs"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "llm_provider_configs" ENABLE ROW LEVEL SECURITY;

-- ─── 2. Revoke Sensitive Public Privileges ───────────────────────────────────
REVOKE ALL ON "users"               FROM anon, authenticated;
REVOKE ALL ON "sessions"            FROM anon, authenticated;
REVOKE ALL ON "password_resets"     FROM anon, authenticated;
REVOKE ALL ON "api_keys"            FROM anon, authenticated;
REVOKE ALL ON "documents"           FROM anon, authenticated;
REVOKE ALL ON "compressions"        FROM anon, authenticated;
REVOKE ALL ON "compression_metrics" FROM anon, authenticated;
REVOKE ALL ON "activity_logs"       FROM anon, authenticated;
REVOKE ALL ON "jobs"                FROM anon, authenticated;

-- Grant permissions for authenticated app users and anon where permitted
GRANT SELECT, UPDATE ON "users"               TO authenticated;
GRANT ALL ON "api_keys"                       TO authenticated;
GRANT ALL ON "documents"                      TO authenticated;
GRANT ALL ON "compressions"                   TO authenticated;
GRANT ALL ON "compression_metrics"            TO authenticated;
GRANT SELECT, INSERT ON "activity_logs"       TO authenticated;
GRANT ALL ON "jobs"                           TO authenticated;
GRANT SELECT ON "llm_provider_configs"        TO anon, authenticated;

-- ─── 3. Users Table Policies ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own" ON "users";
CREATE POLICY "users_select_own" ON "users"
    FOR SELECT TO authenticated
    USING (auth.uid()::text = "id"::text);

DROP POLICY IF EXISTS "users_update_own" ON "users";
CREATE POLICY "users_update_own" ON "users"
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = "id"::text)
    WITH CHECK (auth.uid()::text = "id"::text);

-- ─── 4. API Keys Table Policies ──────────────────────────────────────────────
DROP POLICY IF EXISTS "api_keys_user_isolation" ON "api_keys";
CREATE POLICY "api_keys_user_isolation" ON "api_keys"
    FOR ALL TO authenticated
    USING (auth.uid()::text = "userId"::text)
    WITH CHECK (auth.uid()::text = "userId"::text);

-- ─── 5. Documents Table Policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "documents_user_isolation" ON "documents";
CREATE POLICY "documents_user_isolation" ON "documents"
    FOR ALL TO authenticated
    USING (auth.uid()::text = "userId"::text)
    WITH CHECK (auth.uid()::text = "userId"::text);

-- ─── 6. Compressions Table Policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "compressions_user_isolation" ON "compressions";
CREATE POLICY "compressions_user_isolation" ON "compressions"
    FOR ALL TO authenticated
    USING (auth.uid()::text = "userId"::text)
    WITH CHECK (auth.uid()::text = "userId"::text);

-- ─── 7. Compression Metrics Table Policies ───────────────────────────────────
DROP POLICY IF EXISTS "metrics_owner_access" ON "compression_metrics";
CREATE POLICY "metrics_owner_access" ON "compression_metrics"
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "compressions"
            WHERE "compressions"."id" = "compression_metrics"."compressionId"
              AND "compressions"."userId"::text = auth.uid()::text
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "compressions"
            WHERE "compressions"."id" = "compression_metrics"."compressionId"
              AND "compressions"."userId"::text = auth.uid()::text
        )
    );

-- ─── 8. Activity Logs Table Policies ─────────────────────────────────────────
DROP POLICY IF EXISTS "activity_logs_select_own" ON "activity_logs";
CREATE POLICY "activity_logs_select_own" ON "activity_logs"
    FOR SELECT TO authenticated
    USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "activity_logs_insert_own" ON "activity_logs";
CREATE POLICY "activity_logs_insert_own" ON "activity_logs"
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = "userId"::text);

-- ─── 9. Jobs Table Policies ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "jobs_user_isolation" ON "jobs";
CREATE POLICY "jobs_user_isolation" ON "jobs"
    FOR ALL TO authenticated
    USING (auth.uid()::text = "userId"::text)
    WITH CHECK (auth.uid()::text = "userId"::text);

-- ─── 10. LLM Provider Configs Table Policies (Public Read Reference) ─────────
DROP POLICY IF EXISTS "llm_provider_configs_read" ON "llm_provider_configs";
CREATE POLICY "llm_provider_configs_read" ON "llm_provider_configs"
    FOR SELECT TO anon, authenticated
    USING ("is_enabled" = true);
