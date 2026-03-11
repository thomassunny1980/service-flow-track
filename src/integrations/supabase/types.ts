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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          contact: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          item_code: string | null
          item_name: string
          min_stock_level: number | null
          purchase_rate: number
          quantity: number
          sale_rate: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          item_code?: string | null
          item_name: string
          min_stock_level?: number | null
          purchase_rate?: number
          quantity?: number
          sale_rate?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          item_code?: string | null
          item_name?: string
          min_stock_level?: number | null
          purchase_rate?: number
          quantity?: number
          sale_rate?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_contact: string | null
          customer_email: string | null
          customer_name: string
          customer_state: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          items: Json
          notes: string | null
          payment_mode: string | null
          quotation_id: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_contact?: string | null
          customer_email?: string | null
          customer_name: string
          customer_state?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json
          notes?: string | null
          payment_mode?: string | null
          quotation_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_contact?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_state?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json
          notes?: string | null
          payment_mode?: string | null
          quotation_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          amount_paid: number | null
          completed_date: string | null
          created_at: string
          created_by: string | null
          customer_contact: string | null
          customer_id: string
          customer_name: string
          delivered_to: string | null
          external_expected_return: string | null
          external_sent_date: string | null
          external_service_center: string | null
          external_tracking_number: string | null
          id: string
          payment_mode: string | null
          payment_status: string | null
          product_name: string
          received_by: string | null
          serial_number: string | null
          service_charge: number | null
          status: Database["public"]["Enums"]["service_status"]
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_contact?: string | null
          customer_id: string
          customer_name: string
          delivered_to?: string | null
          external_expected_return?: string | null
          external_sent_date?: string | null
          external_service_center?: string | null
          external_tracking_number?: string | null
          id?: string
          payment_mode?: string | null
          payment_status?: string | null
          product_name: string
          received_by?: string | null
          serial_number?: string | null
          service_charge?: number | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_contact?: string | null
          customer_id?: string
          customer_name?: string
          delivered_to?: string | null
          external_expected_return?: string | null
          external_sent_date?: string | null
          external_service_center?: string | null
          external_tracking_number?: string | null
          id?: string
          payment_mode?: string | null
          payment_status?: string | null
          product_name?: string
          received_by?: string | null
          serial_number?: string | null
          service_charge?: number | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          advance_paid: number | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_contact: string | null
          customer_email: string | null
          customer_name: string
          customer_state: string | null
          id: string
          items: Json
          notes: string | null
          quotation_number: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          updated_at: string
          validity_date: string
        }
        Insert: {
          advance_paid?: number | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_contact?: string | null
          customer_email?: string | null
          customer_name: string
          customer_state?: string | null
          id?: string
          items?: Json
          notes?: string | null
          quotation_number?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          validity_date: string
        }
        Update: {
          advance_paid?: number | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_contact?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_state?: string | null
          id?: string
          items?: Json
          notes?: string | null
          quotation_number?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          validity_date?: string
        }
        Relationships: []
      }
      remarks: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          product_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          product_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remarks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          auto_reset_invoice_sequence: boolean | null
          auto_reset_quotation_sequence: boolean | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string
          id: string
          invoice_fy_last_number: number | null
          invoice_fy_year: string | null
          invoice_number_digits: number | null
          invoice_prefix: string | null
          invoice_year_format: string | null
          last_invoice_number: number | null
          last_quotation_number: number | null
          quotation_fy_last_number: number | null
          quotation_fy_year: string | null
          quotation_number_digits: number | null
          quotation_prefix: string | null
          quotation_year_format: string | null
          shop_address: string | null
          shop_city: string | null
          shop_email: string | null
          shop_gst: string | null
          shop_name: string
          shop_phone: string | null
          shop_pincode: string | null
          shop_state: string | null
          shop_website: string | null
          tax_rates: Json | null
          terms_and_conditions: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          auto_reset_invoice_sequence?: boolean | null
          auto_reset_quotation_sequence?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          invoice_fy_last_number?: number | null
          invoice_fy_year?: string | null
          invoice_number_digits?: number | null
          invoice_prefix?: string | null
          invoice_year_format?: string | null
          last_invoice_number?: number | null
          last_quotation_number?: number | null
          quotation_fy_last_number?: number | null
          quotation_fy_year?: string | null
          quotation_number_digits?: number | null
          quotation_prefix?: string | null
          quotation_year_format?: string | null
          shop_address?: string | null
          shop_city?: string | null
          shop_email?: string | null
          shop_gst?: string | null
          shop_name?: string
          shop_phone?: string | null
          shop_pincode?: string | null
          shop_state?: string | null
          shop_website?: string | null
          tax_rates?: Json | null
          terms_and_conditions?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          auto_reset_invoice_sequence?: boolean | null
          auto_reset_quotation_sequence?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          invoice_fy_last_number?: number | null
          invoice_fy_year?: string | null
          invoice_number_digits?: number | null
          invoice_prefix?: string | null
          invoice_year_format?: string | null
          last_invoice_number?: number | null
          last_quotation_number?: number | null
          quotation_fy_last_number?: number | null
          quotation_fy_year?: string | null
          quotation_number_digits?: number | null
          quotation_prefix?: string | null
          quotation_year_format?: string | null
          shop_address?: string | null
          shop_city?: string | null
          shop_email?: string | null
          shop_gst?: string | null
          shop_name?: string
          shop_phone?: string | null
          shop_pincode?: string | null
          shop_state?: string | null
          shop_website?: string | null
          tax_rates?: Json | null
          terms_and_conditions?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      inventory_staff_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          item_code: string | null
          item_name: string | null
          min_stock_level: number | null
          quantity: number | null
          sale_rate: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          item_code?: string | null
          item_name?: string | null
          min_stock_level?: number | null
          quantity?: number | null
          sale_rate?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          item_code?: string | null
          item_name?: string | null
          min_stock_level?: number | null
          quantity?: number | null
          sale_rate?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_quotations: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      quotation_status: "pending" | "approved" | "rejected"
      service_status:
        | "received"
        | "in_progress"
        | "awaiting_parts"
        | "completed"
        | "external_service"
        | "ready_for_pickup"
        | "delivered"
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
      app_role: ["admin", "staff", "customer"],
      quotation_status: ["pending", "approved", "rejected"],
      service_status: [
        "received",
        "in_progress",
        "awaiting_parts",
        "completed",
        "external_service",
        "ready_for_pickup",
        "delivered",
      ],
    },
  },
} as const
