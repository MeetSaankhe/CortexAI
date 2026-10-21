# Database Schema Architecture

This document describes the schema architecture for CortexAI / Compression Engine on PostgreSQL / Supabase.

---

## 1. Architectural Overview

The database powers an LLM Context Compression Engine with multi-agent orchestration, user session management, document storage, and analytics.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC SCHEMA                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌───────────────┐        1:N       ┌────────────────────────┐        │
│   │     users     │─────────────────▶│        sessions        │        │
│   └───────┬───────┘                  └────────────────────────┘        │
│           │                                                            │
│           │ 1:N            1:N       ┌────────────────────────┐        │
│           ├─────────────────────────▶│    password_resets     │        │
│           │                          └────────────────────────┘        │
│           │                                                            │
│           │ 1:N            1:N       ┌────────────────────────┐        │
│           ├─────────────────────────▶│        api_keys        │        │
│           │                          └────────────────────────┘        │
│           │                                                            │
│           │ 1:N            1:N       ┌────────────────────────┐        │
│           ├─────────────────────────▶│       documents        │        │
│           │                          └───────────┬────────────┘        │
│           │                                      │ 1:N                 │
│           │ 1:N            1:N                   ▼                     │
│           ├─────────────────────────▶┌────────────────────────┐        │
│           │                          │      compressions      │        │
│           │                          └───────────┬────────────┘        │
│           │                                      │ 1:1                 │
│           │                                      ▼                     │
│           │                          ┌────────────────────────┐        │
│           │                          │  compression_metrics   │        │
│           │                          └────────────────────────┘        │
│           │                                                            │
│           │ 1:N                      ┌────────────────────────┐        │
│           ├─────────────────────────▶│     activity_logs      │        │
│           │                          └────────────────────────┘        │
│           │                                                            │
│           │ 1:N                      ┌────────────────────────┐        │
│           └─────────────────────────▶│          jobs          │        │
│                                      └────────────────────────┘        │
│                                                                        │
│   ┌────────────────────────┐                                           │
│   │  llm_provider_configs  │ (Public read-only catalog)                │
│   └────────────────────────┘                                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Catalog

| Table | Primary Key | Description | RLS Policy |
| :--- | :--- | :--- | :--- |
| `users` | `id` (TEXT UUID) | User profile, authentication credentials, and preferences | Owner read/update |
| `sessions` | `id` (TEXT UUID) | Active user sessions with SHA-256 token hashes | Revoked from client / server only |
| `password_resets` | `id` (TEXT UUID) | One-time password reset tokens | Revoked from client / server only |
| `api_keys` | `id` (TEXT UUID) | AES-256-GCM encrypted LLM API keys | Owner full access |
| `documents` | `id` (TEXT UUID) | Parsed document metadata, tokens, and storage references | Owner full access |
| `compressions` | `id` (TEXT UUID) | Compression job outputs, token counts, and cost savings | Owner full access |
| `compression_metrics` | `id` (TEXT UUID) | Detailed quality metrics (semantic similarity, retention) | Owner access via compression |
| `activity_logs` | `id` (TEXT UUID) | Audit trail of security and execution events | Owner read/insert |
| `jobs` | `id` (TEXT UUID) | Asynchronous background processing queue | Owner full access |
| `llm_provider_configs` | `id` (TEXT UUID) | Global provider pricing, context limits, and availability | Public SELECT (if enabled) |

---

## 3. Casing & Compatibility

The application utilizes Prisma Client with TypeScript. To preserve 100% interoperability without schema mismatches:
- Table names are lowercase snake_case or single-word plurals (`users`, `documents`, `compressions`).
- Foreign keys and camelCase columns (`userId`, `tokenHash`, `createdAt`, `updatedAt`) are quoted in SQL DDL to preserve casing.
- Default UUID generators (`extensions.gen_random_uuid()::text`) are assigned at the database level.
