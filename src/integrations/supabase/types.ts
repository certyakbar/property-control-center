export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_decisions: {
        Row: {
          confidence_score: number | null
          created_at: string
          explanation: string | null
          id: string
          input_summary: string | null
          model_used: string | null
          object_id: string | null
          object_type: string | null
          organisation_id: string
          output_json: Json | null
          task_type: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          input_summary?: string | null
          model_used?: string | null
          object_id?: string | null
          object_type?: string | null
          organisation_id: string
          output_json?: Json | null
          task_type?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          explanation?: string | null
          id?: string
          input_summary?: string | null
          model_used?: string | null
          object_id?: string | null
          object_type?: string | null
          organisation_id?: string
          output_json?: Json | null
          task_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_decisions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          id: string
          object_id: string | null
          object_type: string | null
          organisation_id: string
        }
        Insert: {
          action?: string | null
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          organisation_id: string
        }
        Update: {
          action?: string | null
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string
          hmrc_mapping: string | null
          id: string
          name: string
          risk_level: string | null
          type: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          hmrc_mapping?: string | null
          id?: string
          name: string
          risk_level?: string | null
          type?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          hmrc_mapping?: string | null
          id?: string
          name?: string
          risk_level?: string | null
          type?: string | null
        }
        Relationships: []
      }
      compliance_items: {
        Row: {
          compliance_type: string | null
          created_at: string
          document_id: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          organisation_id: string
          property_id: string
          reminder_date: string | null
          status: string | null
        }
        Insert: {
          compliance_type?: string | null
          created_at?: string
          document_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organisation_id: string
          property_id: string
          reminder_date?: string | null
          status?: string | null
        }
        Update: {
          compliance_type?: string | null
          created_at?: string
          document_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string
          property_id?: string
          reminder_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_summary: string | null
          created_at: string
          document_type: string | null
          expiry_date: string | null
          extracted_text: string | null
          file_name: string | null
          file_path: string | null
          id: string
          issue_date: string | null
          organisation_id: string
          property_id: string | null
          status: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          document_type?: string | null
          expiry_date?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          organisation_id: string
          property_id?: string | null
          status?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          document_type?: string | null
          expiry_date?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          organisation_id?: string
          property_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_links: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_id: string | null
          id: string
          linked_object_id: string | null
          linked_object_type: string | null
          organisation_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          id?: string
          linked_object_id?: string | null
          linked_object_type?: string | null
          organisation_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          id?: string
          linked_object_id?: string | null
          linked_object_type?: string | null
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_links_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          council_name: string | null
          created_at: string
          document_status: string | null
          expected_monthly_rent: number | null
          expense_status: string | null
          id: string
          is_hmo: boolean | null
          name: string
          notes: string | null
          organisation_id: string
          postcode: string | null
          property_type: string | null
          readiness_score: number | null
          rent_status: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          council_name?: string | null
          created_at?: string
          document_status?: string | null
          expected_monthly_rent?: number | null
          expense_status?: string | null
          id?: string
          is_hmo?: boolean | null
          name: string
          notes?: string | null
          organisation_id: string
          postcode?: string | null
          property_type?: string | null
          readiness_score?: number | null
          rent_status?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          council_name?: string | null
          created_at?: string
          document_status?: string | null
          expected_monthly_rent?: number | null
          expense_status?: string | null
          id?: string
          is_hmo?: boolean | null
          name?: string
          notes?: string | null
          organisation_id?: string
          postcode?: string | null
          property_type?: string | null
          readiness_score?: number | null
          rent_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_packs: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          period_end: string | null
          period_start: string | null
          readiness_score: number | null
          status: string | null
          summary_json: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          period_end?: string | null
          period_start?: string | null
          readiness_score?: number | null
          status?: string | null
          summary_json?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          period_end?: string | null
          period_start?: string | null
          readiness_score?: number | null
          status?: string | null
          summary_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_packs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_charges: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          organisation_id: string
          property_id: string | null
          status: string | null
          tenancy_id: string | null
          unit_id: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          organisation_id: string
          property_id?: string | null
          status?: string | null
          tenancy_id?: string | null
          unit_id?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string
          property_id?: string | null
          status?: string | null
          tenancy_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_charges_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_charges_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_charges_tenancy_id_fkey"
            columns: ["tenancy_id"]
            isOneToOne: false
            referencedRelation: "tenancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_charges_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      review_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_type: string | null
          linked_object_id: string | null
          linked_object_type: string | null
          organisation_id: string
          priority: string | null
          property_id: string | null
          resolved_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string | null
          linked_object_id?: string | null
          linked_object_type?: string | null
          organisation_id: string
          priority?: string | null
          property_id?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string | null
          linked_object_id?: string | null
          linked_object_type?: string | null
          organisation_id?: string
          priority?: string | null
          property_id?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenancies: {
        Row: {
          created_at: string
          deposit_status: string | null
          end_date: string | null
          id: string
          organisation_id: string
          property_id: string | null
          rent_amount: number | null
          rent_due_day: number | null
          start_date: string | null
          status: string | null
          tenant_id: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          deposit_status?: string | null
          end_date?: string | null
          id?: string
          organisation_id: string
          property_id?: string | null
          rent_amount?: number | null
          rent_due_day?: number | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          deposit_status?: string | null
          end_date?: string | null
          id?: string
          organisation_id?: string
          property_id?: string | null
          rent_amount?: number | null
          rent_due_day?: number | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenancies_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          organisation_id: string
          phone: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          organisation_id: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          organisation_id?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          confidence_score: number | null
          confirmed_category_id: string | null
          created_at: string
          date: string | null
          description: string | null
          direction: string | null
          evidence_status: string | null
          id: string
          merchant_or_payer: string | null
          organisation_id: string
          predicted_category_id: string | null
          property_id: string | null
          raw_source: string | null
          review_status: string | null
          risk_level: string | null
        }
        Insert: {
          amount: number
          confidence_score?: number | null
          confirmed_category_id?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          direction?: string | null
          evidence_status?: string | null
          id?: string
          merchant_or_payer?: string | null
          organisation_id: string
          predicted_category_id?: string | null
          property_id?: string | null
          raw_source?: string | null
          review_status?: string | null
          risk_level?: string | null
        }
        Update: {
          amount?: number
          confidence_score?: number | null
          confirmed_category_id?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          direction?: string | null
          evidence_status?: string | null
          id?: string
          merchant_or_payer?: string | null
          organisation_id?: string
          predicted_category_id?: string | null
          property_id?: string | null
          raw_source?: string | null
          review_status?: string | null
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_confirmed_category_id_fkey"
            columns: ["confirmed_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_predicted_category_id_fkey"
            columns: ["predicted_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          expected_rent: number | null
          id: string
          name: string
          notes: string | null
          property_id: string
          rent_frequency: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          expected_rent?: number | null
          id?: string
          name: string
          notes?: string | null
          property_id: string
          rent_frequency?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          expected_rent?: number | null
          id?: string
          name?: string
          notes?: string | null
          property_id?: string
          rent_frequency?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dev_join_demo_org: { Args: never; Returns: string }
      has_org_role: {
        Args: { _org: string; _roles: string[] }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string }; Returns: boolean }
      org_for_property: { Args: { _property_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
