-- MyLab Phase 2.8 — Knowledge Domain Reconciliation
-- Production Knowledge schema already exists in Supabase.
-- This migration verifies the approved live schema without destructive changes.

begin;

DO $$
DECLARE
  expected_tables text[] := ARRAY[
    'knowledge_categories',
    'knowledge_items',
    'knowledge_item_versions',
    'knowledge_item_categories',
    'knowledge_references',
    'laboratory_tests',
    'laboratory_procedures',
    'laboratory_equipment'
  ];

  expected_policies text[] := ARRAY[
    'knowledge_categories_insert',
    'knowledge_categories_select',
    'knowledge_categories_update',

    'knowledge_items_insert',
    'knowledge_items_select',
    'knowledge_items_update',

    'knowledge_item_versions_insert',
    'knowledge_item_versions_select',
    'knowledge_item_versions_update',

    'knowledge_item_categories_insert',
    'knowledge_item_categories_select',
    'knowledge_item_categories_update',

    'knowledge_references_insert',
    'knowledge_references_select',
    'knowledge_references_update',

    'laboratory_tests_insert',
    'laboratory_tests_select',
    'laboratory_tests_update',

    'laboratory_procedures_insert',
    'laboratory_procedures_select',
    'laboratory_procedures_update',

    'laboratory_equipment_insert',
    'laboratory_equipment_select',
    'laboratory_equipment_update'
  ];

  t text;
  p text;
BEGIN

  -- ============================================================
  -- Required Knowledge tables
  -- ============================================================

  FOREACH t IN ARRAY expected_tables LOOP

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

  -- ============================================================
  -- Required RLS policies
  -- ============================================================

  FOREACH p IN ARRAY expected_policies LOOP

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND policyname = p
    ) THEN
      RAISE EXCEPTION
        'Phase 2.8 reconciliation failed: missing policy %',
        p;
    END IF;

  END LOOP;

  -- ============================================================
  -- Core Knowledge constraints
  -- ============================================================

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.knowledge_items'::regclass
      AND conname = 'knowledge_items_item_type_check'
  ) THEN
    RAISE EXCEPTION
      'Missing knowledge_items_item_type_check';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.knowledge_items'::regclass
      AND conname = 'knowledge_items_status_check'
  ) THEN
    RAISE EXCEPTION
      'Missing knowledge_items_status_check';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.knowledge_item_versions'::regclass
      AND conname = 'knowledge_item_versions_version_unique'
  ) THEN
    RAISE EXCEPTION
      'Missing knowledge_item_versions_version_unique';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.laboratory_tests'::regclass
      AND conname = 'laboratory_tests_test_code_key'
  ) THEN
    RAISE EXCEPTION
      'Missing laboratory_tests_test_code_key';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.laboratory_procedures'::regclass
      AND conname = 'laboratory_procedures_procedure_code_key'
  ) THEN
    RAISE EXCEPTION
      'Missing laboratory_procedures_procedure_code_key';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.laboratory_equipment'::regclass
      AND conname = 'laboratory_equipment_equipment_code_key'
  ) THEN
    RAISE EXCEPTION
      'Missing laboratory_equipment_equipment_code_key';
  END IF;

  -- ============================================================
  -- Published-version invariant
  -- ============================================================

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'knowledge_item_versions_one_published_idx'
  ) THEN
    RAISE EXCEPTION
      'Missing knowledge_item_versions_one_published_idx';
  END IF;

  -- ============================================================
  -- Existing triggers
  -- ============================================================

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND trigger_name = 'knowledge_items_set_updated_at'
  ) THEN
    RAISE EXCEPTION
      'Missing knowledge_items_set_updated_at trigger';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND trigger_name = 'knowledge_item_versions_set_published_at'
  ) THEN
    RAISE EXCEPTION
      'Missing knowledge_item_versions_set_published_at trigger';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND trigger_name = 'laboratory_tests_set_updated_at'
  ) THEN
    RAISE EXCEPTION
      'Missing laboratory_tests_set_updated_at trigger';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND trigger_name = 'laboratory_procedures_set_updated_at'
  ) THEN
    RAISE EXCEPTION
      'Missing laboratory_procedures_set_updated_at trigger';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND trigger_name = 'laboratory_equipment_set_updated_at'
  ) THEN
    RAISE EXCEPTION
      'Missing laboratory_equipment_set_updated_at trigger';
  END IF;

END $$;

commit;
