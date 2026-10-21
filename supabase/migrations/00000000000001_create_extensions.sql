-- =============================================================================
-- Migration: 00000000000001_create_extensions.sql
-- Description: Enable core PostgreSQL extensions required by CortexAI
-- =============================================================================

-- Cryptographic extension for hashing, encryption, and gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Performance telemetry and query stat tracking
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
