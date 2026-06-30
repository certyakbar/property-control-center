
CREATE OR REPLACE FUNCTION public.dev_join_demo_org()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_org constant uuid := '00000000-0000-0000-0000-000000000001';
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only ever attaches the caller to the fixed demo organisation.
  INSERT INTO public.organisation_members (organisation_id, user_id, role)
  VALUES (demo_org, uid, 'owner')
  ON CONFLICT (organisation_id, user_id) DO NOTHING;

  RETURN demo_org;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dev_join_demo_org() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_join_demo_org() TO authenticated;
