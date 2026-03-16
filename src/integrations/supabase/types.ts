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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      credit_purchases: {
        Row: {
          created_at: string
          credits: number
          id: string
          payment_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          payment_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          sumit_customer_id: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          sumit_customer_id?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          sumit_customer_id?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      file_shares: {
        Row: {
          created_at: string
          file_id: string
          id: string
          permission: string
          share_token: string | null
          shared_by: string
          shared_with_email: string | null
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          permission?: string
          share_token?: string | null
          shared_by: string
          shared_with_email?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          permission?: string
          share_token?: string | null
          shared_by?: string
          shared_with_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_cycle: string | null
          created_at: string
          credits: number | null
          currency: string
          id: string
          payment_type: string
          plan_key: string | null
          status: string
          sumit_transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle?: string | null
          created_at?: string
          credits?: number | null
          currency?: string
          id?: string
          payment_type?: string
          plan_key?: string | null
          status?: string
          sumit_transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string | null
          created_at?: string
          credits?: number | null
          currency?: string
          id?: string
          payment_type?: string
          plan_key?: string | null
          status?: string
          sumit_transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pixi_handoff_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          plan: string
          quota: number
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          plan?: string
          quota?: number
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          plan?: string
          quota?: number
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
          whatsapp_verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
          whatsapp_verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
          whatsapp_verified?: boolean
        }
        Relationships: []
      }
      project_shares: {
        Row: {
          created_at: string
          id: string
          permission: string
          project_id: string
          share_token: string | null
          shared_by: string
          shared_with_email: string | null
          video_id: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission?: string
          project_id: string
          share_token?: string | null
          shared_by: string
          shared_with_email?: string | null
          video_id?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          project_id?: string
          share_token?: string | null
          shared_by?: string
          shared_with_email?: string | null
          video_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shares_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle_end: string
          billing_cycle_start: string
          created_at: string
          id: string
          monthly_credits: number
          plan_type: string
          status: string
          user_id: string
        }
        Insert: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          id?: string
          monthly_credits?: number
          plan_type?: string
          status?: string
          user_id: string
        }
        Update: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          id?: string
          monthly_credits?: number
          plan_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          billing_cycle_start: string
          created_at: string
          extra_credits: number
          id: string
          is_unlimited: boolean
          plan_credits: number
          plan_type: string
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          billing_cycle_start?: string
          created_at?: string
          extra_credits?: number
          id?: string
          is_unlimited?: boolean
          plan_credits?: number
          plan_type?: string
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          billing_cycle_start?: string
          created_at?: string
          extra_credits?: number
          id?: string
          is_unlimited?: boolean
          plan_credits?: number
          plan_type?: string
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      user_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          is_deleted: boolean
          is_starred: boolean
          project_id: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number
          file_type?: string
          file_url: string
          folder_id?: string | null
          id?: string
          is_deleted?: boolean
          is_starred?: boolean
          project_id?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          is_deleted?: boolean
          is_starred?: boolean
          project_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_folders: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          category: string | null
          content_type: string | null
          created_at: string
          credits_used: number
          description: string | null
          id: string
          parent_video_id: string | null
          project_id: string | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          user_id: string
          version_number: number
          video_url: string | null
        }
        Insert: {
          category?: string | null
          content_type?: string | null
          created_at?: string
          credits_used?: number
          description?: string | null
          id?: string
          parent_video_id?: string | null
          project_id?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          user_id: string
          version_number?: number
          video_url?: string | null
        }
        Update: {
          category?: string | null
          content_type?: string | null
          created_at?: string
          credits_used?: number
          description?: string | null
          id?: string
          parent_video_id?: string | null
          project_id?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          version_number?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_parent_video_id_fkey"
            columns: ["parent_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_extra_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      consume_credit: { Args: { p_user_id: string }; Returns: Json }
      ensure_admin_credits: { Args: { p_user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_admin_by_email: { Args: { p_email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "admin"
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
      app_role: ["user", "admin"],
    },
  },
} as const
