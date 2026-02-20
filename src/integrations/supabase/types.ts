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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      auth_sessions: {
        Row: {
          created_at: string
          expires_at: string
          phone: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          phone: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          phone?: string
          token?: string
        }
        Relationships: []
      }
      authorized_phones: {
        Row: {
          created_at: string
          customer_group: Database["public"]["Enums"]["customer_group"] | null
          id: string
          name: string | null
          phone: string
          referred_by: string | null
        }
        Insert: {
          created_at?: string
          customer_group?: Database["public"]["Enums"]["customer_group"] | null
          id?: string
          name?: string | null
          phone: string
          referred_by?: string | null
        }
        Update: {
          created_at?: string
          customer_group?: Database["public"]["Enums"]["customer_group"] | null
          id?: string
          name?: string | null
          phone?: string
          referred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorized_phones_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "authorized_phones"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          phone: string
          reason: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          phone: string
          reason: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          phone?: string
          reason?: string
        }
        Relationships: []
      }
      group_pricing: {
        Row: {
          airport_malpensa: number | null
          airport_orio: number | null
          base_price: number | null
          customer_group: Database["public"]["Enums"]["customer_group"]
          discount_long: number | null
          discount_short: number | null
          display_name: string
          id: string
          is_active: boolean | null
          night_surcharge: number | null
          price_per_km: number | null
          price_per_min: number | null
          updated_at: string
        }
        Insert: {
          airport_malpensa?: number | null
          airport_orio?: number | null
          base_price?: number | null
          customer_group: Database["public"]["Enums"]["customer_group"]
          discount_long?: number | null
          discount_short?: number | null
          display_name: string
          id?: string
          is_active?: boolean | null
          night_surcharge?: number | null
          price_per_km?: number | null
          price_per_min?: number | null
          updated_at?: string
        }
        Update: {
          airport_malpensa?: number | null
          airport_orio?: number | null
          base_price?: number | null
          customer_group?: Database["public"]["Enums"]["customer_group"]
          discount_long?: number | null
          discount_short?: number | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          night_surcharge?: number | null
          price_per_km?: number | null
          price_per_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ride_requests: {
        Row: {
          admin_lat: number | null
          admin_lon: number | null
          confirmation_token: string
          confirmed_at: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          date_time: string
          dest_lat: number
          dest_lon: number
          destination: string
          estimated_km: number
          estimated_min: number
          estimated_price: number
          eta_min: number | null
          id: string
          maps_link: string | null
          pickup: string
          pickup_lat: number
          pickup_lon: number
          referral_name: string | null
          status: string
        }
        Insert: {
          admin_lat?: number | null
          admin_lon?: number | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          date_time: string
          dest_lat: number
          dest_lon: number
          destination: string
          estimated_km: number
          estimated_min: number
          estimated_price: number
          eta_min?: number | null
          id?: string
          maps_link?: string | null
          pickup: string
          pickup_lat: number
          pickup_lon: number
          referral_name?: string | null
          status?: string
        }
        Update: {
          admin_lat?: number | null
          admin_lon?: number | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          date_time?: string
          dest_lat?: number
          dest_lon?: number
          destination?: string
          estimated_km?: number
          estimated_min?: number
          estimated_price?: number
          eta_min?: number | null
          id?: string
          maps_link?: string | null
          pickup?: string
          pickup_lat?: number
          pickup_lon?: number
          referral_name?: string | null
          status?: string
        }
        Relationships: []
      }
      ride_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          ride_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: string
          phone: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      vehicle_settings: {
        Row: {
          base_price: number | null
          description: string | null
          display_name: string | null
          id: string
          image_url: string | null
          is_available: boolean
          price_multiplier: number | null
          updated_at: string
          vehicle_name: string
        }
        Insert: {
          base_price?: number | null
          description?: string | null
          display_name?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          price_multiplier?: number | null
          updated_at?: string
          vehicle_name: string
        }
        Update: {
          base_price?: number | null
          description?: string | null
          display_name?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          price_multiplier?: number | null
          updated_at?: string
          vehicle_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { check_phone: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      customer_group: "private" | "business" | "ambassador"
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
    Enums: {
      app_role: ["admin", "user"],
      customer_group: ["private", "business", "ambassador"],
    },
  },
} as const
