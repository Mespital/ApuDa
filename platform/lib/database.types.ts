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
      appointments: {
        Row: {
          appointment_type: string
          created_at: string
          department: string | null
          hospital_name: string | null
          id: string
          notes: string | null
          profile_id: string
          scheduled_at: string
          title: string
        }
        Insert: {
          appointment_type: string
          created_at?: string
          department?: string | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          scheduled_at: string
          title: string
        }
        Update: {
          appointment_type?: string
          created_at?: string
          department?: string | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          scheduled_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          code: string | null
          created_at: string
          diagnosed_on: string | null
          id: string
          name: string
          notes: string | null
          profile_id: string
          status: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          diagnosed_on?: string | null
          id?: string
          name: string
          notes?: string | null
          profile_id: string
          status?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          diagnosed_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conditions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_type: string
          granted: boolean
          granted_at: string
          id: string
          profile_id: string
          version: string
        }
        Insert: {
          consent_type: string
          granted: boolean
          granted_at?: string
          id?: string
          profile_id: string
          version: string
        }
        Update: {
          consent_type?: string
          granted?: boolean
          granted_at?: string
          id?: string
          profile_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          canonical_code: string | null
          confirmed_by_user: boolean
          created_at: string
          id: string
          measured_at: string
          profile_id: string
          reference_range: string | null
          source: string
          test_name: string
          unit: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          canonical_code?: string | null
          confirmed_by_user?: boolean
          created_at?: string
          id?: string
          measured_at: string
          profile_id: string
          reference_range?: string | null
          source?: string
          test_name: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          canonical_code?: string | null
          confirmed_by_user?: boolean
          created_at?: string
          id?: string
          measured_at?: string
          profile_id?: string
          reference_range?: string | null
          source?: string
          test_name?: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          condition_id: string | null
          created_at: string
          dose_text: string | null
          ended_on: string | null
          frequency_text: string | null
          id: string
          name: string
          notes: string | null
          profile_id: string
          route: string | null
          started_on: string | null
        }
        Insert: {
          active?: boolean
          condition_id?: string | null
          created_at?: string
          dose_text?: string | null
          ended_on?: string | null
          frequency_text?: string | null
          id?: string
          name: string
          notes?: string | null
          profile_id: string
          route?: string | null
          started_on?: string | null
        }
        Update: {
          active?: boolean
          condition_id?: string | null
          created_at?: string
          dose_text?: string | null
          ended_on?: string | null
          frequency_text?: string | null
          id?: string
          name?: string
          notes?: string | null
          profile_id?: string
          route?: string | null
          started_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_year: number | null
          created_at: string
          display_name: string
          id: string
          owner_user_id: string
          profile_type: string
          relationship_to_user: string
          sex_at_birth: string | null
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          display_name: string
          id?: string
          owner_user_id: string
          profile_type?: string
          relationship_to_user?: string
          sex_at_birth?: string | null
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          display_name?: string
          id?: string
          owner_user_id?: string
          profile_type?: string
          relationship_to_user?: string
          sex_at_birth?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      symptom_logs: {
        Row: {
          confirmed_by_user: boolean
          count_value: number | null
          created_at: string
          id: string
          note: string | null
          profile_id: string
          recorded_at: string
          severity: number | null
          source: string
          symptom_code: string | null
          symptom_name: string
        }
        Insert: {
          confirmed_by_user?: boolean
          count_value?: number | null
          created_at?: string
          id?: string
          note?: string | null
          profile_id: string
          recorded_at?: string
          severity?: number | null
          source?: string
          symptom_code?: string | null
          symptom_name: string
        }
        Update: {
          confirmed_by_user?: boolean
          count_value?: number | null
          created_at?: string
          id?: string
          note?: string | null
          profile_id?: string
          recorded_at?: string
          severity?: number | null
          source?: string
          symptom_code?: string | null
          symptom_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          condition_id: string | null
          created_at: string
          cycle_label: string | null
          ended_on: string | null
          id: string
          name: string
          notes: string | null
          profile_id: string
          started_on: string | null
          treatment_type: string
        }
        Insert: {
          condition_id?: string | null
          created_at?: string
          cycle_label?: string | null
          ended_on?: string | null
          id?: string
          name: string
          notes?: string | null
          profile_id: string
          started_on?: string | null
          treatment_type: string
        }
        Update: {
          condition_id?: string | null
          created_at?: string
          cycle_label?: string | null
          ended_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          profile_id?: string
          started_on?: string | null
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_profile: { Args: { target_profile_id: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
