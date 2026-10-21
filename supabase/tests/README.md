# Database Verification Tests

This directory contains automated database validation scripts for CortexAI.

## Running Tests

### Option A: Via Supabase CLI
```bash
supabase test db
```

### Option B: Via Supabase SQL Editor or psql
You can run [`00001_database_tests.sql`](file:///c:/Users/bhavi/Desktop/Project/CortexAI1/supabase/tests/00001_database_tests.sql) directly in the Supabase SQL Editor.

The test suite will check:
1. Existence of all 10 core tables.
2. Active status of Row-Level Security (RLS) on all user-scoped tables.
3. Installation of timestamp, auth sync, analytics RPC, and cleanup functions.
4. Correctness of foreign keys, cascades, and constraints.
