-- =============================================================================
-- Supabase Development Seed Data
-- Safe, reproducible, deterministic development records for CortexAI
-- =============================================================================

-- ─── 1. Default LLM Provider Reference Configurations ────────────────────────
INSERT INTO "llm_provider_configs" (
    "id",
    "provider",
    "name",
    "defaultModel",
    "contextWindow",
    "costPer1kPrompt",
    "costPer1kCompletion",
    "is_enabled"
) VALUES
    ('00000000-0000-0000-0000-000000000101', 'openai', 'OpenAI', 'gpt-4o', 128000, 0.0025, 0.0100, true),
    ('00000000-0000-0000-0000-000000000102', 'anthropic', 'Anthropic Claude', 'claude-3-5-sonnet-20241022', 200000, 0.0030, 0.0150, true),
    ('00000000-0000-0000-0000-000000000103', 'gemini', 'Google Gemini', 'gemini-1.5-pro', 1000000, 0.00125, 0.0050, true),
    ('00000000-0000-0000-0000-000000000104', 'deepseek', 'DeepSeek', 'deepseek-chat', 64000, 0.00014, 0.00028, true),
    ('00000000-0000-0000-0000-000000000105', 'mistral', 'Mistral AI', 'mistral-large-latest', 128000, 0.0020, 0.0060, true),
    ('00000000-0000-0000-0000-000000000106', 'llama', 'Meta Llama', 'llama-3.3-70b-versatile', 128000, 0.0005, 0.0008, true),
    ('00000000-0000-0000-0000-000000000107', 'ollama', 'Ollama (Local)', 'llama3.1:latest', 32000, 0.0000, 0.0000, true)
ON CONFLICT ("provider") DO UPDATE SET
    "name" = EXCLUDED."name",
    "defaultModel" = EXCLUDED."defaultModel",
    "contextWindow" = EXCLUDED."contextWindow",
    "costPer1kPrompt" = EXCLUDED."costPer1kPrompt",
    "costPer1kCompletion" = EXCLUDED."costPer1kCompletion",
    "is_enabled" = EXCLUDED."is_enabled";

-- ─── 2. Safe Demo Developer Account ──────────────────────────────────────────
-- Password is 'Development123!' hashed with bcrypt (12 rounds)
INSERT INTO "users" (
    "id",
    "email",
    "password",
    "name",
    "avatar",
    "role",
    "theme",
    "language",
    "preferredLlm",
    "defaultCompression",
    "isActive",
    "emailVerified",
    "failedLoginCount",
    "createdAt",
    "updatedAt"
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'developer@cortexai.local',
    '$2a$12$K8yY5sd0PZzO5FpAgzXzveWzrqEshkG60bEsqtF5OqQ9dsmrL14.S',
    'Demo Developer',
    NULL,
    'developer',
    'dark',
    'en',
    'openai',
    'medium',
    true,
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- ─── 3. Sample Demo Document ─────────────────────────────────────────────────
INSERT INTO "documents" (
    "id",
    "userId",
    "filename",
    "originalName",
    "mimeType",
    "size",
    "documentType",
    "language",
    "content",
    "pages",
    "words",
    "characters",
    "tokens",
    "storagePath",
    "createdAt",
    "updatedAt"
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'demo-cortex-system-spec.txt',
    'cortex-system-spec.txt',
    'text/plain',
    1240,
    'text',
    'en',
    'CortexAI context compression engine reduces prompt token footprints by over 70% while preserving 95%+ of semantic reasoning capabilities through multi-agent LangGraph analysis.',
    1,
    25,
    185,
    42,
    '00000000-0000-0000-0000-000000000001/demo-cortex-system-spec.txt',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- ─── 4. Sample Completed Compression Run ─────────────────────────────────────
INSERT INTO "compressions" (
    "id",
    "userId",
    "documentId",
    "originalText",
    "compressedText",
    "originalTokens",
    "compressedTokens",
    "compressionRatio",
    "semanticScore",
    "compressionLevel",
    "requestedLevel",
    "llmProvider",
    "llmModel",
    "documentType",
    "language",
    "originalCost",
    "compressedCost",
    "costSavings",
    "latencyOriginalMs",
    "latencyCompressedMs",
    "latencyImprovement",
    "processingTimeMs",
    "accuracyTarget",
    "metTarget",
    "adaptiveFallback",
    "status",
    "createdAt"
) VALUES (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'CortexAI context compression engine reduces prompt token footprints by over 70% while preserving 95%+ of semantic reasoning capabilities through multi-agent LangGraph analysis.',
    'CortexAI cuts prompt tokens 70%+ while keeping 95%+ semantic fidelity via multi-agent graph.',
    42,
    15,
    0.357,
    0.972,
    'medium',
    'medium',
    'openai',
    'gpt-4o',
    'text',
    'en',
    0.000105,
    0.0000375,
    0.0000675,
    1240.0,
    450.0,
    63.7,
    312.0,
    0.95,
    true,
    false,
    'completed',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- ─── 5. Sample Compression Metric ────────────────────────────────────────────
INSERT INTO "compression_metrics" (
    "id",
    "compressionId",
    "tokensSaved",
    "wordsSaved",
    "charactersSaved",
    "moneySaved",
    "latencyReduced",
    "semanticSimilarity",
    "reasoningRetention",
    "estimatedAccuracy",
    "approved",
    "agentCount",
    "agentTimings",
    "createdAt"
) VALUES (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000020',
    27,
    11,
    91,
    0.0000675,
    63.7,
    0.972,
    0.985,
    0.975,
    true,
    13,
    '{"input":25,"classify":30,"token":20,"semantic":85,"compress":112,"validate":40}',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("compressionId") DO NOTHING;

-- ─── 6. Sample Initial Activity Logs ─────────────────────────────────────────
INSERT INTO "activity_logs" (
    "id",
    "userId",
    "action",
    "resource",
    "resourceId",
    "metadata",
    "ipAddress",
    "userAgent",
    "createdAt"
) VALUES (
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000001',
    'auth.register',
    'user',
    '00000000-0000-0000-0000-000000000001',
    '{"initialRole":"developer"}',
    '127.0.0.1',
    'CortexAI-DevSeed/1.0',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
