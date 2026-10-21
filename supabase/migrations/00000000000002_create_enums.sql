-- =============================================================================
-- Migration: 00000000000002_create_enums.sql
-- Description: Define domain enums for roles, job states, compression levels
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'developer', 'researcher', 'guest');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compression_level') THEN
        CREATE TYPE compression_level AS ENUM ('low', 'medium', 'high', 'extreme');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
        CREATE TYPE job_type AS ENUM ('compression', 'ocr', 'ocr-compress');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'llm_provider') THEN
        CREATE TYPE llm_provider AS ENUM ('openai', 'gemini', 'anthropic', 'deepseek', 'mistral', 'llama', 'ollama');
    END IF;
END $$;
