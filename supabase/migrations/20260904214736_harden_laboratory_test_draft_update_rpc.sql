-- Harden laboratory test draft update RPC.
-- Prevent anonymous execution and fail loudly on silent UPDATE no-ops.

REVOKE EXECUTE ON FUNCTION public.update_laboratory_test_draft(
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
) FROM anon;

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
) TO authenticated;

REVOKE EXECUTE ON FUNCTION private.update_laboratory_test_draft(
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
) FROM anon;

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
) TO authenticated;
