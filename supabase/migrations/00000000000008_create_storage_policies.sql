-- =============================================================================
-- Migration: 00000000000008_create_storage_policies.sql
-- Description: Configure Supabase Storage buckets and security access policies
-- =============================================================================

DO $$
BEGIN
    -- Only run if the Supabase storage schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN

        -- ─── 1. Create Storage Buckets ───────────────────────────────────────
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES
            (
                'documents',
                'documents',
                false,
                52428800, -- 50 MB
                ARRAY[
                    'application/pdf',
                    'text/plain',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/markdown',
                    'application/json',
                    'text/csv',
                    'image/png',
                    'image/jpeg',
                    'image/webp',
                    'image/gif',
                    'image/bmp',
                    'image/tiff'
                ]
            ),
            (
                'avatars',
                'avatars',
                true,
                5242880,  -- 5 MB
                ARRAY[
                    'image/png',
                    'image/jpeg',
                    'image/webp',
                    'image/gif',
                    'image/svg+xml'
                ]
            )
        ON CONFLICT (id) DO UPDATE SET
            public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;

        -- ─── 2. Documents Bucket Policies (User-Isolated) ────────────────────
        DROP POLICY IF EXISTS "documents_owner_select" ON storage.objects;
        CREATE POLICY "documents_owner_select" ON storage.objects
            FOR SELECT TO authenticated
            USING (
                bucket_id = 'documents'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "documents_owner_insert" ON storage.objects;
        CREATE POLICY "documents_owner_insert" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (
                bucket_id = 'documents'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "documents_owner_update" ON storage.objects;
        CREATE POLICY "documents_owner_update" ON storage.objects
            FOR UPDATE TO authenticated
            USING (
                bucket_id = 'documents'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "documents_owner_delete" ON storage.objects;
        CREATE POLICY "documents_owner_delete" ON storage.objects
            FOR DELETE TO authenticated
            USING (
                bucket_id = 'documents'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        -- ─── 3. Avatars Bucket Policies ──────────────────────────────────────
        DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
        CREATE POLICY "avatars_public_select" ON storage.objects
            FOR SELECT TO public
            USING (bucket_id = 'avatars');

        DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
        CREATE POLICY "avatars_owner_insert" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (
                bucket_id = 'avatars'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
        CREATE POLICY "avatars_owner_update" ON storage.objects
            FOR UPDATE TO authenticated
            USING (
                bucket_id = 'avatars'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
        CREATE POLICY "avatars_owner_delete" ON storage.objects
            FOR DELETE TO authenticated
            USING (
                bucket_id = 'avatars'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

    END IF;
END $$;
