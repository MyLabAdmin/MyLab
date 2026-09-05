CREATE OR REPLACE FUNCTION private.validate_knowledge_version_publishable(
  p_knowledge_item_version_id uuid
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_item_id uuid;
  v_item_type text;
  v_title text;
  v_content text;
  v_status text;
  v_specimen_count integer;
  v_category_count integer;
BEGIN
  SELECT
    v.knowledge_item_id,
    i.item_type,
    v.title,
    v.content,
    v.status
  INTO
    v_item_id,
    v_item_type,
    v_title,
    v_content,
    v_status
  FROM public.knowledge_item_versions v
  JOIN public.knowledge_items i
    ON i.id = v.knowledge_item_id
  WHERE v.id = p_knowledge_item_version_id;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Knowledge version not found'
      USING errcode = 'P0002';
  END IF;

  IF btrim(coalesce(v_title, '')) = '' THEN
    RAISE EXCEPTION 'Knowledge title is required'
      USING errcode = '22023';
  END IF;

  IF btrim(coalesce(v_content, '')) = '' THEN
    RAISE EXCEPTION 'Knowledge content is required'
      USING errcode = '22023';
  END IF;

  IF v_status <> 'draft' THEN
    RAISE EXCEPTION
      'Only draft versions can be submitted or published'
      USING errcode = '22023';
  END IF;

  SELECT count(*)
  INTO v_category_count
  FROM public.knowledge_item_categories c
  WHERE c.knowledge_item_id = v_item_id;

  IF v_category_count = 0 THEN
    RAISE EXCEPTION
      'At least one Knowledge category is required'
      USING errcode = '22023';
  END IF;

  IF v_item_type = 'laboratory_test' THEN
    SELECT count(*)
    INTO v_specimen_count
    FROM public.laboratory_test_versions ltv
    JOIN public.test_specimens ts
      ON ts.laboratory_test_version_id = ltv.id
    WHERE ltv.knowledge_item_version_id =
      p_knowledge_item_version_id;

    IF v_specimen_count = 0 THEN
      RAISE EXCEPTION
        'At least one laboratory test specimen is required'
        USING errcode = '22023';
    END IF;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION private.validate_knowledge_version_publishable(uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.validate_knowledge_version_publishable(uuid)
TO authenticated;
