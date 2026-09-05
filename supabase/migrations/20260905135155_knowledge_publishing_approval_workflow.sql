ALTER TABLE public.knowledge_item_versions
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS review_updated_at timestamptz;

ALTER TABLE public.knowledge_item_versions
  DROP CONSTRAINT IF EXISTS knowledge_item_versions_review_status_check;

ALTER TABLE public.knowledge_item_versions
  ADD CONSTRAINT knowledge_item_versions_review_status_check
  CHECK (
    review_status = ANY (
      ARRAY[
        'draft'::text,
        'pending_review'::text,
        'approved'::text,
        'rejected'::text
      ]
    )
  );

CREATE TABLE IF NOT EXISTS public.knowledge_version_reviews (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  knowledge_item_version_id uuid NOT NULL
    REFERENCES public.knowledge_item_versions(id)
    ON DELETE CASCADE,
  action text NOT NULL,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_version_reviews_action_check
    CHECK (
      action = ANY (
        ARRAY[
          'submitted'::text,
          'approved'::text,
          'rejected'::text,
          'published'::text
        ]
      )
    )
);

CREATE INDEX IF NOT EXISTS knowledge_version_reviews_version_idx
  ON public.knowledge_version_reviews(knowledge_item_version_id);

ALTER TABLE public.knowledge_version_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.knowledge_version_reviews FROM anon;
REVOKE ALL ON TABLE public.knowledge_version_reviews FROM authenticated;

GRANT SELECT ON TABLE public.knowledge_version_reviews TO authenticated;
GRANT ALL ON TABLE public.knowledge_version_reviews TO service_role;

DROP POLICY IF EXISTS knowledge_version_reviews_select
  ON public.knowledge_version_reviews;

CREATE POLICY knowledge_version_reviews_select
ON public.knowledge_version_reviews
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (SELECT public.current_user_has_role('knowledge_reviewer'::public.staff_role))
  OR
  (SELECT public.current_user_has_role('knowledge_manager'::public.staff_role))
  OR
  (SELECT public.current_user_has_role('super_admin'::public.staff_role))
);

DROP POLICY IF EXISTS knowledge_item_versions_editable_review_state
  ON public.knowledge_item_versions;

CREATE POLICY knowledge_item_versions_editable_review_state
ON public.knowledge_item_versions
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  review_status = ANY (
    ARRAY[
      'draft'::text,
      'rejected'::text
    ]
  )
)
WITH CHECK (
  review_status = ANY (
    ARRAY[
      'draft'::text,
      'rejected'::text
    ]
  )
);

CREATE OR REPLACE FUNCTION private.authorize_knowledge_submitter()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING errcode = '28000';
  END IF;

  IF NOT public.current_user_is_active() THEN
    RAISE EXCEPTION 'Active account required'
      USING errcode = '42501';
  END IF;

  IF NOT (
    public.current_user_has_role('knowledge_manager'::public.staff_role)
    OR public.current_user_has_role('super_admin'::public.staff_role)
  ) THEN
    RAISE EXCEPTION 'Knowledge authoring permission required'
      USING errcode = '42501';
  END IF;

  RETURN v_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION private.authorize_knowledge_reviewer()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING errcode = '28000';
  END IF;

  IF NOT public.current_user_is_active() THEN
    RAISE EXCEPTION 'Active account required'
      USING errcode = '42501';
  END IF;

  IF NOT (
    public.current_user_has_role('knowledge_reviewer'::public.staff_role)
    OR public.current_user_has_role('super_admin'::public.staff_role)
  ) THEN
    RAISE EXCEPTION 'Knowledge review permission required'
      USING errcode = '42501';
  END IF;

  RETURN v_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION private.authorize_knowledge_publisher()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING errcode = '28000';
  END IF;

  IF NOT public.current_user_is_active() THEN
    RAISE EXCEPTION 'Active account required'
      USING errcode = '42501';
  END IF;

  IF NOT public.current_user_has_role('super_admin'::public.staff_role) THEN
    RAISE EXCEPTION 'Knowledge publishing permission required'
      USING errcode = '42501';
  END IF;

  RETURN v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION private.authorize_knowledge_submitter() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.authorize_knowledge_reviewer() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.authorize_knowledge_publisher() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.authorize_knowledge_submitter()
TO authenticated;

GRANT EXECUTE ON FUNCTION private.authorize_knowledge_reviewer()
TO authenticated;

GRANT EXECUTE ON FUNCTION private.authorize_knowledge_publisher()
TO authenticated;

CREATE OR REPLACE FUNCTION private.knowledge_version_is_editable(
  p_knowledge_item_version_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.knowledge_item_versions v
    WHERE v.id = p_knowledge_item_version_id
      AND v.status = 'draft'
      AND v.review_status IN ('draft', 'rejected')
  );
$function$;

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
    RAISE EXCEPTION 'Only draft versions can be submitted or published'
      USING errcode = '22023';
  END IF;

  SELECT count(*)
  INTO v_category_count
  FROM public.knowledge_item_categories c
  WHERE c.knowledge_item_id = v_item_id;

  IF v_category_count = 0 THEN
    RAISE EXCEPTION 'At least one Knowledge category is required'
      USING errcode = '22023';
  END IF;

  IF v_item_type = 'laboratory_test' THEN
    SELECT count(*)
    INTO v_specimen_count
    FROM public.laboratory_test_versions ltv
    JOIN public.test_specimens ts
      ON ts.laboratory_test_version_id = ltv.id
    WHERE ltv.knowledge_item_version_id = p_knowledge_item_version_id;

    IF v_specimen_count = 0 THEN
      RAISE EXCEPTION
        'At least one laboratory test specimen is required'
        USING errcode = '22023';
    END IF;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION private.knowledge_version_is_editable(uuid)
FROM PUBLIC;

REVOKE ALL ON FUNCTION private.validate_knowledge_version_publishable(uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.knowledge_version_is_editable(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION private.validate_knowledge_version_publishable(uuid)
TO authenticated;

CREATE OR REPLACE FUNCTION private.submit_knowledge_version_for_review(
  p_knowledge_item_version_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := private.authorize_knowledge_submitter();
  v_item_id uuid;
  v_status text;
  v_review_status text;
BEGIN
  SELECT
    knowledge_item_id,
    status,
    review_status
  INTO
    v_item_id,
    v_status,
    v_review_status
  FROM public.knowledge_item_versions
  WHERE id = p_knowledge_item_version_id
  FOR UPDATE;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Knowledge version not found'
      USING errcode = 'P0002';
  END IF;

  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft versions can be submitted'
      USING errcode = '22023';
  END IF;

  IF v_review_status NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION
      'Knowledge version is already under review or approved'
      USING errcode = '22023';
  END IF;

  PERFORM private.validate_knowledge_version_publishable(
    p_knowledge_item_version_id
  );

  UPDATE public.knowledge_item_versions
  SET
    review_status = 'pending_review',
    review_updated_at = now()
  WHERE id = p_knowledge_item_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to submit Knowledge version'
      USING errcode = 'P0001';
  END IF;

  INSERT INTO public.knowledge_version_reviews (
    knowledge_item_version_id,
    action,
    actor_id
  )
  VALUES (
    p_knowledge_item_version_id,
    'submitted',
    v_user_id
  );

  RETURN jsonb_build_object(
    'knowledge_item_id', v_item_id,
    'knowledge_item_version_id', p_knowledge_item_version_id,
    'review_status', 'pending_review'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.approve_knowledge_version(
  p_knowledge_item_version_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := private.authorize_knowledge_reviewer();
  v_item_id uuid;
  v_review_status text;
BEGIN
  SELECT
    knowledge_item_id,
    review_status
  INTO
    v_item_id,
    v_review_status
  FROM public.knowledge_item_versions
  WHERE id = p_knowledge_item_version_id
  FOR UPDATE;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Knowledge version not found'
      USING errcode = 'P0002';
  END IF;

  IF v_review_status <> 'pending_review' THEN
    RAISE EXCEPTION
      'Only pending Knowledge versions can be approved'
      USING errcode = '22023';
  END IF;

  PERFORM private.validate_knowledge_version_publishable(
    p_knowledge_item_version_id
  );

  UPDATE public.knowledge_item_versions
  SET
    review_status = 'approved',
    review_updated_at = now()
  WHERE id = p_knowledge_item_version_id;

  INSERT INTO public.knowledge_version_reviews (
    knowledge_item_version_id,
    action,
    actor_id,
    note
  )
  VALUES (
    p_knowledge_item_version_id,
    'approved',
    v_user_id,
    NULLIF(btrim(coalesce(p_note, '')), '')
  );

  RETURN jsonb_build_object(
    'knowledge_item_id', v_item_id,
    'knowledge_item_version_id', p_knowledge_item_version_id,
    'review_status', 'approved'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.reject_knowledge_version(
  p_knowledge_item_version_id uuid,
  p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := private.authorize_knowledge_reviewer();
  v_item_id uuid;
  v_review_status text;
BEGIN
  IF btrim(coalesce(p_note, '')) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required'
      USING errcode = '22023';
  END IF;

  SELECT
    knowledge_item_id,
    review_status
  INTO
    v_item_id,
    v_review_status
  FROM public.knowledge_item_versions
  WHERE id = p_knowledge_item_version_id
  FOR UPDATE;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Knowledge version not found'
      USING errcode = 'P0002';
  END IF;

  IF v_review_status <> 'pending_review' THEN
    RAISE EXCEPTION
      'Only pending Knowledge versions can be rejected'
      USING errcode = '22023';
  END IF;

  UPDATE public.knowledge_item_versions
  SET
    review_status = 'rejected',
    review_updated_at = now()
  WHERE id = p_knowledge_item_version_id;

  INSERT INTO public.knowledge_version_reviews (
    knowledge_item_version_id,
    action,
    actor_id,
    note
  )
  VALUES (
    p_knowledge_item_version_id,
    'rejected',
    v_user_id,
    btrim(p_note)
  );

  RETURN jsonb_build_object(
    'knowledge_item_id', v_item_id,
    'knowledge_item_version_id', p_knowledge_item_version_id,
    'review_status', 'rejected'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.publish_knowledge_version(
  p_knowledge_item_version_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := private.authorize_knowledge_publisher();
  v_item_id uuid;
  v_review_status text;
  v_previous_published_id uuid;
BEGIN
  SELECT
    knowledge_item_id,
    review_status
  INTO
    v_item_id,
    v_review_status
  FROM public.knowledge_item_versions
  WHERE id = p_knowledge_item_version_id
  FOR UPDATE;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Knowledge version not found'
      USING errcode = 'P0002';
  END IF;

  IF v_review_status <> 'approved' THEN
    RAISE EXCEPTION
      'Only approved Knowledge versions can be published'
      USING errcode = '22023';
  END IF;

  PERFORM private.validate_knowledge_version_publishable(
    p_knowledge_item_version_id
  );

  SELECT id
  INTO v_previous_published_id
  FROM public.knowledge_item_versions
  WHERE knowledge_item_id = v_item_id
    AND status = 'published'
    AND id <> p_knowledge_item_version_id
  FOR UPDATE;

  IF v_previous_published_id IS NOT NULL THEN
    UPDATE public.knowledge_item_versions
    SET status = 'superseded'
    WHERE id = v_previous_published_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Failed to supersede previous Knowledge version'
        USING errcode = 'P0001';
    END IF;
  END IF;

  UPDATE public.knowledge_item_versions
  SET
    status = 'published',
    published_at = now(),
    review_updated_at = now()
  WHERE id = p_knowledge_item_version_id
    AND status = 'draft'
    AND review_status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to publish Knowledge version'
      USING errcode = 'P0001';
  END IF;

  UPDATE public.knowledge_items
  SET
    status = 'published',
    updated_by = v_user_id,
    updated_at = now()
  WHERE id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Failed to update Knowledge item publication status'
      USING errcode = 'P0001';
  END IF;

  INSERT INTO public.knowledge_version_reviews (
    knowledge_item_version_id,
    action,
    actor_id
  )
  VALUES (
    p_knowledge_item_version_id,
    'published',
    v_user_id
  );

  RETURN jsonb_build_object(
    'knowledge_item_id', v_item_id,
    'knowledge_item_version_id', p_knowledge_item_version_id,
    'previous_published_version_id', v_previous_published_id,
    'status', 'published',
    'review_status', 'approved'
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.submit_knowledge_version_for_review(uuid)
FROM PUBLIC;
REVOKE ALL ON FUNCTION private.approve_knowledge_version(uuid, text)
FROM PUBLIC;
REVOKE ALL ON FUNCTION private.reject_knowledge_version(uuid, text)
FROM PUBLIC;
REVOKE ALL ON FUNCTION private.publish_knowledge_version(uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.submit_knowledge_version_for_review(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION private.approve_knowledge_version(uuid, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION private.reject_knowledge_version(uuid, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION private.publish_knowledge_version(uuid)
TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_knowledge_version_for_review(
  p_knowledge_item_version_id uuid
)
RETURNS jsonb
LANGUAGE sql
SET search_path TO ''
AS $function$
  SELECT private.submit_knowledge_version_for_review(
    p_knowledge_item_version_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.approve_knowledge_version(
  p_knowledge_item_version_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SET search_path TO ''
AS $function$
  SELECT private.approve_knowledge_version(
    p_knowledge_item_version_id,
    p_note
  );
$function$;

CREATE OR REPLACE FUNCTION public.reject_knowledge_version(
  p_knowledge_item_version_id uuid,
  p_note text
)
RETURNS jsonb
LANGUAGE sql
SET search_path TO ''
AS $function$
  SELECT private.reject_knowledge_version(
    p_knowledge_item_version_id,
    p_note
  );
$function$;

CREATE OR REPLACE FUNCTION public.publish_knowledge_version(
  p_knowledge_item_version_id uuid
)
RETURNS jsonb
LANGUAGE sql
SET search_path TO ''
AS $function$
  SELECT private.publish_knowledge_version(
    p_knowledge_item_version_id
  );
$function$;

REVOKE ALL ON FUNCTION public.submit_knowledge_version_for_review(uuid)
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.approve_knowledge_version(uuid, text)
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.reject_knowledge_version(uuid, text)
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.publish_knowledge_version(uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_knowledge_version_for_review(uuid)
TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.approve_knowledge_version(uuid, text)
TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.reject_knowledge_version(uuid, text)
TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.publish_knowledge_version(uuid)
TO authenticated, service_role;
