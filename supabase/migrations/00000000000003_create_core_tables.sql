-- =============================================================================
-- Migration: 00000000000003_create_core_tables.sql
-- Description: Create all primary database tables matching application models
-- =============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'developer',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "language" TEXT NOT NULL DEFAULT 'en',
    "preferredLlm" TEXT NOT NULL DEFAULT 'openai',
    "defaultCompression" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3) WITH TIME ZONE,
    "lastLoginIp" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "refreshHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "revokedAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- 3. Password Resets Table
CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) WITH TIME ZONE,
    "expiresAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- 4. User API Keys Table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT,
    "encryptedKey" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyFingerprint" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) WITH TIME ZONE,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- 5. Documents Table
CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "language" TEXT,
    "content" TEXT,
    "pages" INTEGER,
    "words" INTEGER,
    "characters" INTEGER,
    "tokens" INTEGER,
    "storagePath" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- 6. Compressions Table
CREATE TABLE IF NOT EXISTS "compressions" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "originalText" TEXT NOT NULL,
    "compressedText" TEXT NOT NULL,
    "originalTokens" INTEGER NOT NULL,
    "compressedTokens" INTEGER NOT NULL,
    "compressionRatio" DOUBLE PRECISION NOT NULL,
    "semanticScore" DOUBLE PRECISION NOT NULL,
    "compressionLevel" TEXT NOT NULL,
    "requestedLevel" TEXT,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "documentType" TEXT NOT NULL,
    "language" TEXT,
    "originalCost" DOUBLE PRECISION NOT NULL,
    "compressedCost" DOUBLE PRECISION NOT NULL,
    "costSavings" DOUBLE PRECISION NOT NULL,
    "latencyOriginalMs" DOUBLE PRECISION,
    "latencyCompressedMs" DOUBLE PRECISION,
    "latencyImprovement" DOUBLE PRECISION,
    "processingTimeMs" DOUBLE PRECISION,
    "accuracyTarget" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "metTarget" BOOLEAN NOT NULL DEFAULT true,
    "adaptiveFallback" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compressions_pkey" PRIMARY KEY ("id")
);

-- 7. Compression Metrics Table
CREATE TABLE IF NOT EXISTS "compression_metrics" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "compressionId" TEXT NOT NULL,
    "tokensSaved" INTEGER NOT NULL,
    "wordsSaved" INTEGER NOT NULL,
    "charactersSaved" INTEGER NOT NULL,
    "moneySaved" DOUBLE PRECISION NOT NULL,
    "latencyReduced" DOUBLE PRECISION NOT NULL,
    "semanticSimilarity" DOUBLE PRECISION NOT NULL,
    "reasoningRetention" DOUBLE PRECISION NOT NULL,
    "estimatedAccuracy" DOUBLE PRECISION NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "agentCount" INTEGER NOT NULL DEFAULT 0,
    "agentTimings" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compression_metrics_pkey" PRIMARY KEY ("id")
);

-- 8. Activity Logs Table
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- 9. Background Jobs Table
CREATE TABLE IF NOT EXISTS "jobs" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'queued',
    "input" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) WITH TIME ZONE,
    "completedAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- 10. LLM Provider Reference Configs Table
CREATE TABLE IF NOT EXISTS "llm_provider_configs" (
    "id" TEXT NOT NULL DEFAULT extensions.gen_random_uuid()::text,
    "provider" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "defaultModel" TEXT NOT NULL,
    "contextWindow" INTEGER NOT NULL DEFAULT 128000,
    "costPer1kPrompt" DOUBLE PRECISION NOT NULL DEFAULT 0.0015,
    "costPer1kCompletion" DOUBLE PRECISION NOT NULL DEFAULT 0.0020,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_provider_configs_pkey" PRIMARY KEY ("id")
);
