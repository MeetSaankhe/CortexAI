-- =============================================================================
-- Test Suite: 00001_database_tests.sql
-- Description: Automated verification for schema integrity, RLS, and constraints
-- =============================================================================

DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    tbl TEXT;
    expected_tables TEXT[] := ARRAY[
        'users',
        'sessions',
        'password_resets',
        'api_keys',
        'documents',
        'compressions',
        'compression_metrics',
        'activity_logs',
        'jobs',
        'llm_provider_configs'
    ];
    rls_disabled TEXT[] := ARRAY[]::TEXT[];
    missing_funcs TEXT[] := ARRAY[]::TEXT[];
    func TEXT;
    expected_funcs TEXT[] := ARRAY[
        'handle_updated_at',
        'sync_supabase_auth_user',
        'get_user_analytics_summary',
        'clean_expired_sessions'
    ];
BEGIN
    RAISE NOTICE '─── Starting CortexAI Database Audit ───';

    -- 1. Verify Tables Exist
    FOREACH tbl IN ARRAY expected_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;

    IF cardinality(missing_tables) > 0 THEN
        RAISE EXCEPTION 'FAILED: Missing expected tables: %', missing_tables;
    ELSE
        RAISE NOTICE 'SUCCESS: All 10 core tables exist.';
    END IF;

    -- 2. Verify RLS is Enabled
    FOREACH tbl IN ARRAY expected_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = tbl AND c.relrowsecurity = true
        ) THEN
            rls_disabled := array_append(rls_disabled, tbl);
        END IF;
    END LOOP;

    IF cardinality(rls_disabled) > 0 THEN
        RAISE EXCEPTION 'FAILED: RLS not enabled on tables: %', rls_disabled;
    ELSE
        RAISE NOTICE 'SUCCESS: Row Level Security is active on all tables.';
    END IF;

    -- 3. Verify Stored Functions Exist
    FOREACH func IN ARRAY expected_funcs LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = func
        ) THEN
            missing_funcs := array_append(missing_funcs, func);
        END IF;
    END LOOP;

    IF cardinality(missing_funcs) > 0 THEN
        RAISE EXCEPTION 'FAILED: Missing expected database functions: %', missing_funcs;
    ELSE
        RAISE NOTICE 'SUCCESS: All database functions installed.';
    END IF;

    -- 4. Verify Foreign Key Constraints Exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compressions_userId_fkey') OR
       NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compression_metrics_compressionId_fkey') OR
       NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_userId_fkey') THEN
        RAISE EXCEPTION 'FAILED: One or more critical foreign key constraints are missing.';
    ELSE
        RAISE NOTICE 'SUCCESS: Foreign key relationships verified.';
    END IF;

    RAISE NOTICE '─── All CortexAI Database Verification Tests Passed ───';
END $$;
