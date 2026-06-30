
-- Phase 2A — Ledgerless HMO data foundation (schema only; bucket + storage policies handled separately)

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- organisations
CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisations TO authenticated;
GRANT ALL ON public.organisations TO service_role;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organisation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','property_manager','accountant','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisation_members TO authenticated;
GRANT ALL ON public.organisation_members TO service_role;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_org_members_user ON public.organisation_members(user_id);
CREATE INDEX idx_org_members_org ON public.organisation_members(organisation_id);

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organisation_members WHERE organisation_id = _org AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org uuid, _roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organisation_members
    WHERE organisation_id = _org AND user_id = auth.uid() AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_organisation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    UPDATE public.organisations SET owner_user_id = auth.uid() WHERE id = NEW.id AND owner_user_id IS NULL;
    NEW.owner_user_id := auth.uid();
  END IF;
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.organisation_members (organisation_id, user_id, role)
    VALUES (NEW.id, NEW.owner_user_id, 'owner')
    ON CONFLICT (organisation_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_organisation_created AFTER INSERT ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organisation();

CREATE POLICY "organisations_select_members" ON public.organisations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "organisations_insert_authenticated" ON public.organisations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "organisations_update_owner_admin" ON public.organisations FOR UPDATE
  USING (public.has_org_role(id, ARRAY['owner','admin'])) WITH CHECK (public.has_org_role(id, ARRAY['owner','admin']));
CREATE POLICY "organisations_delete_owner" ON public.organisations FOR DELETE USING (public.has_org_role(id, ARRAY['owner']));

CREATE POLICY "org_members_select" ON public.organisation_members FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "org_members_insert" ON public.organisation_members FOR INSERT
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin']));
CREATE POLICY "org_members_update" ON public.organisation_members FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin']));
CREATE POLICY "org_members_delete" ON public.organisation_members FOR DELETE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address_line_1 text, address_line_2 text, city text, postcode text, council_name text,
  property_type text CHECK (property_type IN ('standard_rental','hmo','mixed','other')),
  is_hmo boolean DEFAULT false,
  expected_monthly_rent numeric DEFAULT 0,
  readiness_score numeric DEFAULT 0,
  rent_status text DEFAULT 'unknown',
  document_status text DEFAULT 'unknown',
  expense_status text DEFAULT 'unknown',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_properties_org ON public.properties(organisation_id);
CREATE POLICY "properties_select" ON public.properties FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "properties_insert" ON public.properties FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "properties_update" ON public.properties FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "properties_delete" ON public.properties FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- helper for unit org lookup
CREATE OR REPLACE FUNCTION public.org_for_property(_property_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organisation_id FROM public.properties WHERE id = _property_id;
$$;

-- units
CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  expected_rent numeric DEFAULT 0,
  rent_frequency text CHECK (rent_frequency IN ('weekly','monthly','quarterly')),
  status text CHECK (status IN ('available','occupied','inactive')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_units_property ON public.units(property_id);
CREATE POLICY "units_select" ON public.units FOR SELECT USING (public.is_org_member(public.org_for_property(property_id)));
CREATE POLICY "units_insert" ON public.units FOR INSERT WITH CHECK (public.has_org_role(public.org_for_property(property_id), ARRAY['owner','admin','property_manager']));
CREATE POLICY "units_update" ON public.units FOR UPDATE
  USING (public.has_org_role(public.org_for_property(property_id), ARRAY['owner','admin','property_manager']))
  WITH CHECK (public.has_org_role(public.org_for_property(property_id), ARRAY['owner','admin','property_manager']));
CREATE POLICY "units_delete" ON public.units FOR DELETE USING (public.has_org_role(public.org_for_property(property_id), ARRAY['owner','admin']));

-- tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  email text, phone text,
  status text CHECK (status IN ('active','former','prospective')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tenants_org ON public.tenants(organisation_id);
CREATE POLICY "tenants_select" ON public.tenants FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "tenants_insert" ON public.tenants FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "tenants_update" ON public.tenants FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "tenants_delete" ON public.tenants FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- tenancies
CREATE TABLE public.tenancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id),
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  start_date date, end_date date,
  rent_amount numeric DEFAULT 0,
  rent_due_day integer,
  deposit_status text CHECK (deposit_status IN ('unknown','not_required','protected','unprotected','returned')),
  status text CHECK (status IN ('active','ended','pending')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenancies TO authenticated;
GRANT ALL ON public.tenancies TO service_role;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tenancies_org ON public.tenancies(organisation_id);
CREATE POLICY "tenancies_select" ON public.tenancies FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "tenancies_insert" ON public.tenancies FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "tenancies_update" ON public.tenancies FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "tenancies_delete" ON public.tenancies FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- rent_charges
CREATE TABLE public.rent_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  tenancy_id uuid REFERENCES public.tenancies(id),
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  due_date date,
  amount_due numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  status text CHECK (status IN ('due','paid','partially_paid','overdue','waived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rent_charges TO authenticated;
GRANT ALL ON public.rent_charges TO service_role;
ALTER TABLE public.rent_charges ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_rent_charges_org ON public.rent_charges(organisation_id);
CREATE POLICY "rent_charges_select" ON public.rent_charges FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "rent_charges_insert" ON public.rent_charges FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "rent_charges_update" ON public.rent_charges FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "rent_charges_delete" ON public.rent_charges FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- categories (global lookup, authenticated read only)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('income','expense','transfer','unknown')),
  hmrc_mapping text,
  risk_level text CHECK (risk_level IN ('low','medium','high')),
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_authenticated" ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);

-- transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id),
  date date,
  description text,
  merchant_or_payer text,
  amount numeric NOT NULL,
  direction text CHECK (direction IN ('income','expense','transfer','unknown')),
  raw_source text CHECK (raw_source IN ('manual','csv','bank_feed','import')),
  predicted_category_id uuid REFERENCES public.categories(id),
  confirmed_category_id uuid REFERENCES public.categories(id),
  confidence_score numeric,
  evidence_status text CHECK (evidence_status IN ('complete','missing','partial','not_required','unknown')),
  review_status text CHECK (review_status IN ('pending','approved','corrected','rejected','needs_human_review')),
  risk_level text CHECK (risk_level IN ('low','medium','high')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_org ON public.transactions(organisation_id);
CREATE INDEX idx_transactions_property ON public.transactions(property_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id),
  document_type text,
  file_path text, file_name text, extracted_text text,
  issue_date date, expiry_date date,
  status text CHECK (status IN ('active','expired','expiring_soon','missing_info','archived')),
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_documents_org ON public.documents(organisation_id);
CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "documents_update" ON public.documents FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "documents_delete" ON public.documents FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- evidence_links
CREATE TABLE public.evidence_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  linked_object_type text CHECK (linked_object_type IN ('transaction','property','tenancy','rent_charge','compliance_item')),
  linked_object_id uuid,
  confidence_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_links TO authenticated;
GRANT ALL ON public.evidence_links TO service_role;
ALTER TABLE public.evidence_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_evidence_links_org ON public.evidence_links(organisation_id);
CREATE POLICY "evidence_links_select" ON public.evidence_links FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "evidence_links_insert" ON public.evidence_links FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "evidence_links_update" ON public.evidence_links FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "evidence_links_delete" ON public.evidence_links FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- compliance_items
CREATE TABLE public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  compliance_type text,
  status text CHECK (status IN ('missing','active','expired','expiring_soon','not_required','unknown')),
  expiry_date date,
  document_id uuid REFERENCES public.documents(id),
  reminder_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_items TO authenticated;
GRANT ALL ON public.compliance_items TO service_role;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_compliance_org ON public.compliance_items(organisation_id);
CREATE POLICY "compliance_select" ON public.compliance_items FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "compliance_insert" ON public.compliance_items FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "compliance_update" ON public.compliance_items FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager']));
CREATE POLICY "compliance_delete" ON public.compliance_items FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- review_items
CREATE TABLE public.review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id),
  title text NOT NULL,
  description text,
  item_type text CHECK (item_type IN ('missing_receipt','rent_issue','document_expiry','uncategorised_expense','property_confirmation','document_confirmation','compliance_issue','quarterly_pack','other')),
  linked_object_type text, linked_object_id uuid,
  priority text CHECK (priority IN ('low','medium','high','urgent')),
  status text CHECK (status IN ('open','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_items TO authenticated;
GRANT ALL ON public.review_items TO service_role;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_review_items_org ON public.review_items(organisation_id);
CREATE POLICY "review_items_select" ON public.review_items FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "review_items_insert" ON public.review_items FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "review_items_update" ON public.review_items FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','property_manager','accountant']));
CREATE POLICY "review_items_delete" ON public.review_items FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- quarterly_packs
CREATE TABLE public.quarterly_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  period_start date, period_end date,
  readiness_score numeric DEFAULT 0,
  status text CHECK (status IN ('draft','needs_review','ready','exported')),
  summary_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quarterly_packs TO authenticated;
GRANT ALL ON public.quarterly_packs TO service_role;
ALTER TABLE public.quarterly_packs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_quarterly_packs_org ON public.quarterly_packs(organisation_id);
CREATE POLICY "qp_select" ON public.quarterly_packs FOR SELECT USING (public.is_org_member(organisation_id));
CREATE POLICY "qp_insert" ON public.quarterly_packs FOR INSERT WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','accountant']));
CREATE POLICY "qp_update" ON public.quarterly_packs FOR UPDATE
  USING (public.has_org_role(organisation_id, ARRAY['owner','admin','accountant']))
  WITH CHECK (public.has_org_role(organisation_id, ARRAY['owner','admin','accountant']));
CREATE POLICY "qp_delete" ON public.quarterly_packs FOR DELETE USING (public.has_org_role(organisation_id, ARRAY['owner','admin']));

-- ai_decisions (structure only)
CREATE TABLE public.ai_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  object_type text, object_id uuid,
  task_type text, input_summary text,
  output_json jsonb,
  confidence_score numeric,
  explanation text, model_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_decisions TO authenticated;
GRANT ALL ON public.ai_decisions TO service_role;
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ai_decisions_org ON public.ai_decisions(organisation_id);
CREATE POLICY "ai_decisions_select" ON public.ai_decisions FOR SELECT USING (public.has_org_role(organisation_id, ARRAY['owner','admin','accountant']));

-- audit_logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.profiles(id),
  action text, object_type text, object_id uuid,
  before_json jsonb, after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organisation_id);
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.has_org_role(organisation_id, ARRAY['owner','admin','accountant']));

-- Seed categories
INSERT INTO public.categories (name, type, risk_level) VALUES
  ('Rental income','income','low'),
  ('Repairs and maintenance','expense','medium'),
  ('Safety certificates','expense','low'),
  ('Insurance','expense','low'),
  ('Mortgage interest','expense','medium'),
  ('Utilities','expense','low'),
  ('Council tax','expense','low'),
  ('Cleaning','expense','low'),
  ('Licence fees','expense','low'),
  ('Professional fees','expense','low'),
  ('Advertising','expense','low'),
  ('Bank charges','expense','low'),
  ('Personal or disallowed','expense','high'),
  ('Unknown','unknown','medium');
