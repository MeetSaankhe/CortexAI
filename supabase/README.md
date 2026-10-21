# CortexAI / Compression Engine — Supabase Database Architecture & Reproduction Guide

This directory contains the production database migrations, configuration, functions, security policies, storage setup, and seed data required to recreate the entire database for this project in a **brand new Supabase account** without depending on any external accounts or dashboard state.

---

## Table of Contents
1. [Overview & Structure](#1-overview--structure)
2. [Prerequisites & CLI Installation](#2-prerequisites--cli-installation)
3. [Step-by-Step Setup in a New Supabase Account](#3-step-by-step-setup-in-a-new-supabase-account)
4. [Local Development Workflow](#4-local-development-workflow)
5. [Storage Configuration](#5-storage-configuration)
6. [Security & Row-Level Security (RLS)](#6-security--row-level-security-rls)
7. [Verification & Database Testing](#7-verification--database-testing)
8. [Generating Database Types](#8-generating-database-types)
9. [Schema Reconstruction vs. Production Data Migration](#9-schema-reconstruction-vs-production-data-migration)
10. [Environment Variables Reference](#10-environment-variables-reference)

---

## 1. Overview & Structure

```
supabase/
├── config.toml                              # Local Supabase emulator config (ports, storage, auth)
├── README.md                                # This authoritative guide
├── migrations/                              # Chronological, dependency-aware SQL migrations
│   ├── 00000000000001_create_extensions.sql
│   ├── 00000000000002_create_enums.sql
│   ├── 00000000000003_create_core_tables.sql
│   ├── 00000000000004_create_relationships_and_indexes.sql
│   ├── 00000000000005_create_functions.sql
│   ├── 00000000000006_create_triggers.sql
│   ├── 00000000000007_create_rls_policies.sql
│   └── 00000000000008_create_storage_policies.sql
├── seed.sql                                 # Safe, reproducible development seed records
├── schemas/
│   └── README.md                            # Entity-Relationship breakdown & column details
├── tests/
│   ├── README.md                            # Test instructions
│   └── 00001_database_tests.sql             # SQL verification suite (tables, RLS, FKs, functions)
├── functions/
│   └── README.md                            # Edge Functions integration guide
└── types/
    └── database.types.ts                    # Generated TypeScript database schema types
```

---

## 2. Prerequisites & CLI Installation

Install the Supabase CLI using your preferred package manager:

### macOS / Linux (Homebrew):
```bash
brew install supabase/tap/supabase
```

### Windows (Scoop or npm):
```powershell
# Using npm
npm install -g supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Verify your installation:
```bash
supabase --version
```

---

## 3. Step-by-Step Setup in a New Supabase Account

### Step 3.1: Create a Project in Supabase
1. Log in to [https://supabase.com](https://supabase.com) and click **New Project**.
2. Set a project name (e.g., `cortex-ai-prod`).
3. Choose a strong database password (store it securely).
4. Select the region closest to your backend server or users.

### Step 3.2: Authenticate Supabase CLI
```bash
supabase login
```
This opens your browser to generate an access token.

### Step 3.3: Link Repository to Your New Project
Obtain your **Project Reference ID** from your Supabase Dashboard URL (`https://supabase.com/dashboard/project/<PROJECT_REF>`) or **Project Settings → General**:

```bash
cd c:\Users\bhavi\Desktop\Project\CortexAI1
supabase link --project-ref <YOUR_NEW_PROJECT_REF>
```
*(You will be prompted to enter the database password you chose in Step 3.1).*

### Step 3.4: Apply All Migrations
Deploy all tracked SQL migrations in chronological order to your new database:

```bash
supabase db push
```

Alternatively, if you prefer using the Supabase SQL Editor:
Open the SQL Editor in your Supabase dashboard and run the files in `supabase/migrations/` sequentially from `00000000000001` through `00000000000008`.

### Step 3.5: Run Seed Data (Optional for Development)
To populate default LLM provider configurations and a demo developer account:

```bash
# In Supabase SQL Editor or via CLI:
supabase db execute --file supabase/seed.sql
```

---

## 4. Local Development Workflow

To run a fully isolated local database emulator on your machine using Docker:

```bash
# Start local Supabase (Postgres, Studio, Auth, Storage)
supabase start

# Reset database to clean state, run all migrations, and execute seed.sql
# ⚠️ CAUTION: 'db reset' is destructive to the local database and re-creates everything from scratch.
supabase db reset

# Access local Supabase Studio
# Open http://localhost:54323 in your browser
```

To stop local services:
```bash
supabase stop
```

---

## 5. Storage Configuration

The application creates two Supabase Storage buckets via [`00000000000008_create_storage_policies.sql`](file:///c:/Users/bhavi/Desktop/Project/CortexAI1/supabase/migrations/00000000000008_create_storage_policies.sql):

1. **`documents` (Private)**:
   - Size limit: 50MB
   - Permitted MIME types: PDF, Plain Text, DOCX, Markdown, JSON, CSV, and OCR image types (PNG, JPG, WebP, GIF, BMP, TIFF).
   - Access control: Isolated per user under `{userId}/{filename}`.
2. **`avatars` (Public)**:
   - Size limit: 5MB
   - Permitted MIME types: Standard image formats (PNG, JPG, WebP, GIF, SVG).
   - Access control: Public read, owner-only write/update/delete.

---

## 6. Security & Row-Level Security (RLS)

All 10 core tables have Row-Level Security enabled:
- **Zero-trust by default**: Direct queries via `anon` key are rejected.
- **Service Role Bypass**: The backend Node.js server authenticates using the PostgreSQL connection pooler (service role / direct credentials), bypassing RLS for fast multi-agent background graph operations.
- **User Isolation**: When queried by authenticated users, policies enforce `auth.uid()::text = "userId"::text`.
- **Secret Encryption**: Stored user API keys are encrypted at rest using AES-256-GCM before reaching the database.

---

## 7. Verification & Database Testing

Run the automated verification suite to confirm that all 10 tables, triggers, functions, and RLS policies are healthy:

```bash
# Via Supabase CLI:
supabase test db

# Or copy and execute tests/00001_database_tests.sql in Supabase Dashboard SQL Editor
```

A successful output will conclude with:
```
SUCCESS: All 10 core tables exist.
SUCCESS: Row Level Security is active on all tables.
SUCCESS: All database functions installed.
SUCCESS: Foreign key relationships verified.
─── All CortexAI Database Verification Tests Passed ───
```

---

## 8. Generating Database Types

To refresh the TypeScript database types whenever SQL migrations are modified:

```bash
supabase gen types typescript --linked > supabase/types/database.types.ts
```

For local development:
```bash
supabase gen types typescript --local > supabase/types/database.types.ts
```

---

## 9. Schema Reconstruction vs. Production Data Migration

> [!IMPORTANT]
> **Schema Reconstruction** creates the exact tables, columns, indexes, types, triggers, and functions required by the codebase in a fresh database.
>
> If you have existing historical customer data in an old Supabase instance that must be transferred, perform a secure data-only dump:
>
> ```bash
> # Export DATA ONLY from source Supabase (excluding system schemas)
> pg_dump -h <OLD_HOST> -U postgres -d postgres --data-only \
>   -t 'users' -t 'documents' -t 'compressions' -t 'compression_metrics' \
>   -t 'activity_logs' -t 'api_keys' -t 'jobs' > production_data_dump.sql
>
> # Import into target Supabase
> psql -h <NEW_HOST> -U postgres -d postgres -f production_data_dump.sql
> ```

---

## 10. Environment Variables Reference

Update your server configuration in [`compression-engine/server/.env`](file:///c:/Users/bhavi/Desktop/Project/CortexAI1/compression-engine/server/.env):

```env
# Supabase Transaction Pooler (Port 6543) - For normal app queries
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (Port 5432) - For migrations
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# JWT & Data Encryption Secrets
JWT_SECRET="<GENERATE_64_BYTE_HEX>"
JWT_REFRESH_SECRET="<GENERATE_64_BYTE_HEX>"
ENCRYPTION_KEY="<GENERATE_32_BYTE_HEX>"
```
