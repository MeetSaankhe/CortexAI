-- =============================================================================
-- Migration: 00000000000005_create_functions.sql
-- Description: Database functions for timestamp automation, auth synchronization,
--              analytics aggregation, and session maintenance.
-- =============================================================================

-- ─── 1. Automatic Timestamp Updater ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ─── 2. Supabase Auth Sync Trigger Function ──────────────────────────────────
-- Automatically synchronizes users created via Supabase Auth (auth.users) into public.users.
CREATE OR REPLACE FUNCTION public.sync_supabase_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    INSERT INTO public.users (
        "id",
        "email",
        "password",
        "name",
        "avatar",
        "role",
        "emailVerified",
        "createdAt",
        "updatedAt"
    ) VALUES (
        NEW.id::text,
        NEW.email,
        '', -- Handled by Supabase Auth
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'developer'),
        (NEW.email_confirmed_at IS NOT NULL),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("email") DO UPDATE SET
        "name" = EXCLUDED."name",
        "avatar" = COALESCE(EXCLUDED."avatar", public.users."avatar"),
        "emailVerified" = EXCLUDED."emailVerified",
        "updatedAt" = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

-- ─── 3. Analytics Aggregation RPC ────────────────────────────────────────────
-- Computes real-time overview analytics matching analytics.routes.ts
CREATE OR REPLACE FUNCTION public.get_user_analytics_summary(target_user_id TEXT)
RETURNS TABLE (
    total_prompts BIGINT,
    total_tokens_saved BIGINT,
    avg_compression_ratio DOUBLE PRECISION,
    avg_accuracy DOUBLE PRECISION,
    total_money_saved DOUBLE PRECISION,
    avg_latency_reduction DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COUNT(*)::BIGINT AS total_prompts,
        COALESCE(SUM("originalTokens" - "compressedTokens"), 0)::BIGINT AS total_tokens_saved,
        COALESCE(ROUND(AVG("compressionRatio")::numeric, 2)::double precision, 0.0) AS avg_compression_ratio,
        COALESCE(ROUND(AVG("semanticScore")::numeric, 2)::double precision, 0.0) AS avg_accuracy,
        COALESCE(ROUND(SUM("costSavings")::numeric, 4)::double precision, 0.0) AS total_money_saved,
        COALESCE(ROUND(AVG(COALESCE("latencyImprovement", 0))::numeric, 2)::double precision, 0.0) AS avg_latency_reduction
    FROM public.compressions
    WHERE "userId" = target_user_id;
$$;

-- ─── 4. Maintenance: Expired Token / Session Cleanup ─────────────────────────
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_sessions INTEGER;
    deleted_resets INTEGER;
BEGIN
    DELETE FROM public.sessions WHERE "expiresAt" < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

    DELETE FROM public.password_resets WHERE "expiresAt" < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_resets = ROW_COUNT;

    RETURN deleted_sessions + deleted_resets;
END;
$$;
