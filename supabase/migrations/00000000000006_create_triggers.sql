-- =============================================================================
-- Migration: 00000000000006_create_triggers.sql
-- Description: Triggers for automatic timestamps and auth user synchronization
-- =============================================================================

-- ─── 1. Automatic Timestamp Triggers ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_users_updated_at ON "users";
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_api_keys_updated_at ON "api_keys";
CREATE TRIGGER trg_api_keys_updated_at
    BEFORE UPDATE ON "api_keys"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON "documents";
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON "documents"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON "jobs";
CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON "jobs"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_llm_provider_configs_updated_at ON "llm_provider_configs";
CREATE TRIGGER trg_llm_provider_configs_updated_at
    BEFORE UPDATE ON "llm_provider_configs"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ─── 2. Supabase Auth Sync Trigger ───────────────────────────────────────────
-- Attaches to auth.users if the schema exists (standard in Supabase)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT OR UPDATE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.sync_supabase_auth_user();
    END IF;
END $$;
