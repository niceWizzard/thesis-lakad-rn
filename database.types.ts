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
      itinerary: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      itinerary_poi_order: {
        Row: {
          itinerary_id: number
          poi_id: number
          visit_order: number
        }
        Insert: {
          itinerary_id: number
          poi_id: number
          visit_order?: number
        }
        Update: {
          itinerary_id?: number
          poi_id?: number
          visit_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_poi_order_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_poi_order_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "poi"
            referencedColumns: ["id"]
          },
        ]
      }
      landmark: {
        Row: {
          categories: Database["public"]["Enums"]["landmark_category"][]
          created_at: string
          created_by_user: boolean
          deleted_at: string | null
          description: string | null
          district: Database["public"]["Enums"]["district"]
          gmaps_rating: number
          id: number
          image_url: string | null
          latitude: number
          longitude: number
          municipality: Database["public"]["Enums"]["municipality"]
          name: string
          updated_at: string
        }
        Insert: {
          categories?: Database["public"]["Enums"]["landmark_category"][]
          created_at?: string
          created_by_user?: boolean
          deleted_at?: string | null
          description?: string | null
          district: Database["public"]["Enums"]["district"]
          gmaps_rating?: number
          id?: number
          image_url?: string | null
          latitude: number
          longitude: number
          municipality: Database["public"]["Enums"]["municipality"]
          name?: string
          updated_at?: string
        }
        Update: {
          categories?: Database["public"]["Enums"]["landmark_category"][]
          created_at?: string
          created_by_user?: boolean
          deleted_at?: string | null
          description?: string | null
          district?: Database["public"]["Enums"]["district"]
          gmaps_rating?: number
          id?: number
          image_url?: string | null
          latitude?: number
          longitude?: number
          municipality?: Database["public"]["Enums"]["municipality"]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      poi: {
        Row: {
          created_at: string
          id: number
          itinerary_id: number
          landmark_id: number
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          itinerary_id: number
          landmark_id: number
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          itinerary_id?: number
          landmark_id?: number
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poi_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poi_landmark_id_fkey"
            columns: ["landmark_id"]
            isOneToOne: false
            referencedRelation: "landmark"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: number
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: number
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: number
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_full_itinerary:
        | { Args: { p_landmark_list: Json; p_name: string }; Returns: number }
        | {
            Args: { p_landmark_list: Json; p_name: string; p_user_id: string }
            Returns: number
          }
    }
    Enums: {
      district: "1" | "2" | "3" | "4" | "5" | "6" | "Lone"
      landmark_category:
        | "Nature"
        | "Landscape"
        | "Water"
        | "History"
        | "Religious"
      municipality:
        | "Bulakan"
        | "Calumpit"
        | "Hagonoy"
        | "Malolos"
        | "Paombong"
        | "Pulilan"
        | "Baliwag"
        | "Bustos"
        | "Plaridel"
        | "DRT"
        | "San_Ildefonso"
        | "San_Miguel"
        | "San_Rafael"
        | "Marilao"
        | "Meycauayan"
        | "Obando"
        | "Balagtas"
        | "Bocaue"
        | "Guiguinto"
        | "Pandi"
        | "Angat"
        | "Norzagaray"
        | "Santa_Maria"
        | "SJDM"
      poi_category: "Church" | "Historical" | "Nature" | "Museum" | "Landmark"
      user_type: "Regular" | "Admin" | "SuperAdmin"
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
      district: ["1", "2", "3", "4", "5", "6", "Lone"],
      landmark_category: [
        "Nature",
        "Landscape",
        "Water",
        "History",
        "Religious",
      ],
      municipality: [
        "Bulakan",
        "Calumpit",
        "Hagonoy",
        "Malolos",
        "Paombong",
        "Pulilan",
        "Baliwag",
        "Bustos",
        "Plaridel",
        "DRT",
        "San_Ildefonso",
        "San_Miguel",
        "San_Rafael",
        "Marilao",
        "Meycauayan",
        "Obando",
        "Balagtas",
        "Bocaue",
        "Guiguinto",
        "Pandi",
        "Angat",
        "Norzagaray",
        "Santa_Maria",
        "SJDM",
      ],
      poi_category: ["Church", "Historical", "Nature", "Museum", "Landmark"],
      user_type: ["Regular", "Admin", "SuperAdmin"],
    },
  },
} as const
