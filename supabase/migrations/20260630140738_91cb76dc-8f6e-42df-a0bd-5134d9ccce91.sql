
-- Restrict SECURITY DEFINER helpers to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.org_for_property(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_for_property(uuid) TO authenticated;

-- Storage policies for the property-documents bucket
-- Path convention: <organisation_id>/<folder>/<filename>
CREATE POLICY "property_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "property_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-documents'
    AND public.has_org_role(((storage.foldername(name))[1])::uuid, ARRAY['owner','admin','property_manager'])
  );

CREATE POLICY "property_docs_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND public.has_org_role(((storage.foldername(name))[1])::uuid, ARRAY['owner','admin','property_manager'])
  )
  WITH CHECK (
    bucket_id = 'property-documents'
    AND public.has_org_role(((storage.foldername(name))[1])::uuid, ARRAY['owner','admin','property_manager'])
  );

CREATE POLICY "property_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND public.has_org_role(((storage.foldername(name))[1])::uuid, ARRAY['owner','admin'])
  );
