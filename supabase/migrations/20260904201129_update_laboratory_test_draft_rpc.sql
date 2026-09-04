CREATE OR REPLACE FUNCTION private.update_laboratory_test_draft(
  p_laboratory_test_id uuid,
  p_title text,
  p_subtitle text,
  p_summary text,
  p_content text,
  p_pre_test_preparation text,
  p_test_code text,
  p_loinc_code text,
  p_primary_category_id uuid,
  p_subcategory_id uuid,
  p_specimens jsonb DEFAULT '[]'::jsonb,
  p_methods jsonb DEFAULT '[]'::jsonb,
  p_interpretations jsonb DEFAULT '[]'::jsonb,
  p_reference_ranges jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_knowledge_item_id uuid;
  v_knowledge_item_version_id uuid;
  v_laboratory_test_version_id uuid;
  v_primary_category_id uuid;
  v_subcategory_id uuid;
  v_specimen_count integer;
BEGIN
  v_user_id := private.authorize_knowledge_write();

  IF nullif(btrim(p_title), '') IS NULL THEN
    RAISE EXCEPTION 'Laboratory test title is required';
  END IF;

  IF nullif(btrim(p_test_code), '') IS NULL THEN
    RAISE EXCEPTION 'Laboratory test code is required';
  END IF;

  IF jsonb_typeof(coalesce(p_specimens, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(coalesce(p_methods, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(coalesce(p_interpretations, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(coalesce(p_reference_ranges, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Laboratory test collections must be JSON arrays';
  END IF;

  SELECT
    lt.knowledge_item_id,
    ltv.knowledge_item_version_id,
    ltv.id
  INTO
    v_knowledge_item_id,
    v_knowledge_item_version_id,
    v_laboratory_test_version_id
  FROM public.laboratory_tests lt
  JOIN public.knowledge_items ki
    ON ki.id = lt.knowledge_item_id
  JOIN public.laboratory_test_versions ltv
    ON ltv.laboratory_test_id = lt.id
  JOIN public.knowledge_item_versions kiv
    ON kiv.id = ltv.knowledge_item_version_id
  WHERE lt.id = p_laboratory_test_id
    AND ki.status <> 'archived'
    AND kiv.status = 'draft'
  ORDER BY kiv.version_number DESC
  LIMIT 1
  FOR UPDATE OF kiv;

  IF v_knowledge_item_id IS NULL THEN
    RAISE EXCEPTION 'Laboratory test draft not found or not editable'
      USING errcode = 'P0002';
  END IF;

  SELECT parent.id, child.id
  INTO v_primary_category_id, v_subcategory_id
  FROM public.knowledge_categories parent
  JOIN public.knowledge_categories child
    ON child.parent_id = parent.id
  WHERE parent.id = p_primary_category_id
    AND child.id = p_subcategory_id
    AND parent.parent_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.knowledge_categories grandchild
      WHERE grandchild.parent_id = child.id
    );

  IF v_primary_category_id IS NULL OR v_subcategory_id IS NULL THEN
    RAISE EXCEPTION 'Invalid laboratory test category hierarchy';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.laboratory_tests
    WHERE test_code = btrim(p_test_code)
      AND id <> p_laboratory_test_id
  ) THEN
    RAISE EXCEPTION 'Laboratory test code already exists';
  END IF;

  UPDATE public.knowledge_item_versions
  SET title = btrim(p_title),
      subtitle = nullif(btrim(p_subtitle), ''),
      summary = nullif(btrim(p_summary), ''),
      content = coalesce(p_content, ''),
      pre_test_preparation =
        nullif(btrim(p_pre_test_preparation), '')
  WHERE id = v_knowledge_item_version_id;

  UPDATE public.laboratory_tests
  SET test_code = btrim(p_test_code),
      loinc_code = nullif(btrim(p_loinc_code), '')
  WHERE id = p_laboratory_test_id;

  DELETE FROM public.knowledge_item_categories
  WHERE knowledge_item_id = v_knowledge_item_id;

  INSERT INTO public.knowledge_item_categories (
    knowledge_item_id,
    category_id
  )
  VALUES (
    v_knowledge_item_id,
    v_subcategory_id
  );

  DELETE FROM public.test_specimens
  WHERE laboratory_test_version_id = v_laboratory_test_version_id;

  SELECT count(*)
  INTO v_specimen_count
  FROM jsonb_array_elements(
    coalesce(p_specimens, '[]'::jsonb)
  );

  IF v_specimen_count = 0 THEN
    RAISE EXCEPTION 'At least one specimen is required';
  END IF;

  INSERT INTO public.test_specimens (
    laboratory_test_version_id,
    specimen_type,
    container,
    handling_instructions
  )
  SELECT
    v_laboratory_test_version_id,
    nullif(btrim(x.specimen_type), ''),
    nullif(btrim(x.container), ''),
    nullif(btrim(x.handling_instructions), '')
  FROM jsonb_to_recordset(
    coalesce(p_specimens, '[]'::jsonb)
  ) AS x(
    specimen_type text,
    container text,
    handling_instructions text
  );

  IF EXISTS (
    SELECT 1
    FROM public.test_specimens
    WHERE laboratory_test_version_id =
      v_laboratory_test_version_id
      AND nullif(btrim(specimen_type), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Specimen type is required';
  END IF;

  DELETE FROM public.test_methods
  WHERE laboratory_test_version_id = v_laboratory_test_version_id;

  INSERT INTO public.test_methods (
    laboratory_test_version_id,
    method_name,
    description
  )
  SELECT
    v_laboratory_test_version_id,
    nullif(btrim(x.method_name), ''),
    nullif(btrim(x.description), '')
  FROM jsonb_to_recordset(
    coalesce(p_methods, '[]'::jsonb)
  ) AS x(
    method_name text,
    description text
  )
  WHERE nullif(btrim(x.method_name), '') IS NOT NULL;

  DELETE FROM public.test_interpretations
  WHERE laboratory_test_version_id =
    v_laboratory_test_version_id;

  INSERT INTO public.test_interpretations (
    laboratory_test_version_id,
    condition,
    interpretation,
    clinical_significance,
    notes
  )
  SELECT
    v_laboratory_test_version_id,
    nullif(btrim(x.condition), ''),
    nullif(btrim(x.interpretation), ''),
    nullif(btrim(x.clinical_significance), ''),
    nullif(btrim(x.notes), '')
  FROM jsonb_to_recordset(
    coalesce(p_interpretations, '[]'::jsonb)
  ) AS x(
    condition text,
    interpretation text,
    clinical_significance text,
    notes text
  )
  WHERE nullif(btrim(x.condition), '') IS NOT NULL
    AND nullif(btrim(x.interpretation), '') IS NOT NULL;

  DELETE FROM public.test_reference_ranges
  WHERE laboratory_test_version_id =
    v_laboratory_test_version_id;

  INSERT INTO public.test_reference_ranges (
    laboratory_test_version_id,
    specimen_type,
    method_name,
    population_label,
    age_min,
    age_max,
    age_unit,
    sex,
    lower_value,
    upper_value,
    unit,
    notes
  )
  SELECT
    v_laboratory_test_version_id,
    nullif(btrim(x.specimen_type), ''),
    nullif(btrim(x.method_name), ''),
    nullif(btrim(x.population_label), ''),
    x.age_min,
    x.age_max,
    nullif(btrim(x.age_unit), ''),
    nullif(btrim(x.sex), ''),
    x.lower_value,
    x.upper_value,
    nullif(btrim(x.unit), ''),
    nullif(btrim(x.notes), '')
  FROM jsonb_to_recordset(
    coalesce(p_reference_ranges, '[]'::jsonb)
  ) AS x(
    specimen_type text,
    method_name text,
    population_label text,
    age_min numeric,
    age_max numeric,
    age_unit text,
    sex text,
    lower_value numeric,
    upper_value numeric,
    unit text,
    notes text
  );

  UPDATE public.knowledge_items
  SET updated_by = v_user_id
  WHERE id = v_knowledge_item_id;

  RETURN jsonb_build_object(
    'knowledge_item_id', v_knowledge_item_id,
    'knowledge_item_version_id', v_knowledge_item_version_id,
    'laboratory_test_id', p_laboratory_test_id,
    'laboratory_test_version_id', v_laboratory_test_version_id,
    'version_number', (
      SELECT version_number
      FROM public.knowledge_item_versions
      WHERE id = v_knowledge_item_version_id
    ),
    'category_id', v_subcategory_id,
    'primary_category_id', v_primary_category_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.update_laboratory_test_draft(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.update_laboratory_test_draft(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_laboratory_test_draft(
  p_laboratory_test_id uuid,
  p_title text,
  p_subtitle text,
  p_summary text,
  p_content text,
  p_pre_test_preparation text,
  p_test_code text,
  p_loinc_code text,
  p_primary_category_id uuid,
  p_subcategory_id uuid,
  p_specimens jsonb DEFAULT '[]'::jsonb,
  p_methods jsonb DEFAULT '[]'::jsonb,
  p_interpretations jsonb DEFAULT '[]'::jsonb,
  p_reference_ranges jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE sql
SET search_path TO ''
AS $function$
  SELECT private.update_laboratory_test_draft(
    p_laboratory_test_id,
    p_title,
    p_subtitle,
    p_summary,
    p_content,
    p_pre_test_preparation,
    p_test_code,
    p_loinc_code,
    p_primary_category_id,
    p_subcategory_id,
    p_specimens,
    p_methods,
    p_interpretations,
    p_reference_ranges
  );
$function$;

REVOKE ALL ON FUNCTION public.update_laboratory_test_draft(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_laboratory_test_draft(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) TO authenticated, service_role;
