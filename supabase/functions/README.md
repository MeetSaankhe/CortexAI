# Supabase Edge Functions

This directory is reserved for Supabase Edge Functions (Deno runtime).

## Current Architecture
The primary compression engine runs as a Node.js/Express service in [`compression-engine/server`](file:///c:/Users/bhavi/Desktop/Project/CortexAI1/compression-engine/server) and is deployed on serverless infrastructure (Vercel Functions or Railway/Render).

## Future Edge Functions Opportunities
If you migrate stateless micro-tasks to Supabase Edge Functions:
1. `ocr-webhook`: Receives external OCR callback notifications.
2. `cleanup-cron`: Scheduled Edge Function executing `SELECT public.clean_expired_sessions()`.
3. `token-estimate`: Ultra-low-latency edge token counting.

To scaffold a new Edge Function with the Supabase CLI:
```bash
supabase functions new <function_name>
```
