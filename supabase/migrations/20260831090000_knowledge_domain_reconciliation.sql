-- MyLab Phase 2.8 — Knowledge Domain Reconciliation
-- Production schema already exists in Supabase.
-- This migration verifies the approved live schema without destructive changes.

begin;

DO $$
DECLARE
  expected text[] := ARRAY[
    'knowledge_categories',
    'knowledge_items',
    'knowledge_item_versions',
    'knowledge_item_categories',
    'knowledge_references',
    'laboratory_tests'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY expected LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relkind = 'r'
    ) THEN
      RAISE EXCEPTION
        'Phase 2.8 reconciliation failed: missing public.%',
        t;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION
        'Phase 2.8 reconciliation failed: RLS disabled on public.%',
        t;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.knowledge_items'::regclass
      AND conname = 'knowledge_items_status_check'
  ) THEN
    RAISE EXCEPTION
      'Phase 2.8 reconciliation failed: knowledge_items_status_check missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.knowledge_item_versions'::regclass
      AND conname = 'knowledge_item_versions_version_unique'
  ) THEN
    RAISE EXCEPTION
      'Phase 2.8 reconciliation failed: version uniqueness missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'knowledge_item_versions_one_published_idx'
  ) THEN
    RAISE EXCEPTION
      'Phase 2.8 reconciliation failed: published-version index missing';
  END IF;
END $$;

commit;
