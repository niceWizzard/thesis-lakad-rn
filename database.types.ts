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
      distances: {
        Row: {
          created_at: string
          destination: number
          distance: number
          source: number
        }
        Insert: {
          created_at?: string
          destination: number
          distance: number
          source: number
        }
        Update: {
          created_at?: string
          destination?: number
          distance?: number
          source?: number
        }
        Relationships: [
          {
            foreignKeyName: "distances_destination_fkey"
            columns: ["destination"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distances_source_fkey"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary: {
        Row: {
          created_at: string
          deleted_at: string | null
          distance: number
          id: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          distance?: number
          id?: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          distance?: number
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      opening_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          day_of_week: number
          is_closed: boolean
          opens_at: string | null
          place_id: number
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          day_of_week?: number
          is_closed?: boolean
          opens_at?: string | null
          place_id: number
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          day_of_week?: number
          is_closed?: boolean
          opens_at?: string | null
          place_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "landmark_opening_hours_landmark_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          created_at: string
          creation_type: Database["public"]["Enums"]["LandmarkCreationType"]
          deleted_at: string | null
          description: string | null
          district: Database["public"]["Enums"]["district"]
          gmaps_rating: number
          id: number
          image_credits: string | null
          image_url: string | null
          is_verified: boolean
          latitude: number
          longitude: number
          municipality: Database["public"]["Enums"]["municipality"]
          name: string
          type: Database["public"]["Enums"]["landmark_type2"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creation_type?: Database["public"]["Enums"]["LandmarkCreationType"]
          deleted_at?: string | null
          description?: string | null
          district: Database["public"]["Enums"]["district"]
          gmaps_rating?: number
          id?: number
          image_credits?: string | null
          image_url?: string | null
          is_verified?: boolean
          latitude: number
          longitude: number
          municipality: Database["public"]["Enums"]["municipality"]
          name: string
          type?: Database["public"]["Enums"]["landmark_type2"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creation_type?: Database["public"]["Enums"]["LandmarkCreationType"]
          deleted_at?: string | null
          description?: string | null
          district?: Database["public"]["Enums"]["district"]
          gmaps_rating?: number
          id?: number
          image_credits?: string | null
          image_url?: string | null
          is_verified?: boolean
          latitude?: number
          longitude?: number
          municipality?: Database["public"]["Enums"]["municipality"]
          name?: string
          type?: Database["public"]["Enums"]["landmark_type2"] | null
          updated_at?: string
        }
        Relationships: []
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
      review_reports: {
        Row: {
          created_at: string
          details: string
          id: number
          reason: string
          reporter_id: string | null
          review_id: number | null
          status: Database["public"]["Enums"]["review_report_status"]
        }
        Insert: {
          created_at?: string
          details?: string
          id?: number
          reason?: string
          reporter_id?: string | null
          review_id?: number | null
          status?: Database["public"]["Enums"]["review_report_status"]
        }
        Update: {
          created_at?: string
          details?: string
          id?: number
          reason?: string
          reporter_id?: string | null
          review_id?: number | null
          status?: Database["public"]["Enums"]["review_report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: number
          images: string[]
          place_id: number | null
          rating: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          images: string[]
          place_id?: number | null
          rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          images?: string[]
          place_id?: number | null
          rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landmark_reviews_landmark_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      stops: {
        Row: {
          created_at: string
          id: number
          itinerary_id: number
          place_id: number
          visit_duration: number
          visit_order: number
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          itinerary_id: number
          place_id: number
          visit_duration?: number
          visit_order?: number
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          itinerary_id?: number
          place_id?: number
          visit_duration?: number
          visit_order?: number
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
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_full_itinerary: {
        Args: { p_distance: number; p_name: string; p_place_list: Json }
        Returns: number
      }
      get_filterable_reviews: {
        Args: {
          ignore_user_id?: string
          page_number?: number
          page_size?: number
          place_id_input: number
          rating_filter?: number
          sort_column?: string
          sort_descending?: boolean
        }
        Returns: {
          author_name: string
          content: string
          created_at: string
          id: number
          images: string[]
          place_id: number
          rating: number
          updated_at: string
          user_id: string
        }[]
      }
      get_places_with_stats: {
        Args: { target_id?: number }
        Returns: {
          average_rating: number
          created_at: string
          creation_type: Database["public"]["Enums"]["LandmarkCreationType"]
          deleted_at: string
          description: string
          district: Database["public"]["Enums"]["district"]
          gmaps_rating: number
          id: number
          image_credits: string
          image_url: string
          latitude: number
          longitude: number
          municipality: Database["public"]["Enums"]["municipality"]
          name: string
          opening_hours: Json
          review_count: number
          type: Database["public"]["Enums"]["landmark_type2"]
          updated_at: string
        }[]
      }
      get_recent_reviews_by_place: {
        Args: { limit_input?: number; place_id_input: number }
        Returns: {
          author_name: string
          content: string
          created_at: string
          id: number
          images: string[]
          place_id: number
          rating: number
          updated_at: string
          user_id: string
        }[]
      }
      get_review_report_by_id: {
        Args: { p_report_id: number }
        Returns: {
          created_at: string
          details: string
          id: number
          place_name: string
          reason: string
          reporter_id: string
          reporter_name: string
          review_content: string
          review_id: number
          review_images: string[]
          review_rating: number
          reviewer_name: string
          status: Database["public"]["Enums"]["review_report_status"]
        }[]
      }
      get_review_reports: {
        Args: { p_status?: Database["public"]["Enums"]["review_report_status"] }
        Returns: {
          created_at: string
          details: string
          id: number
          place_name: string
          reason: string
          reporter_id: string
          reporter_name: string
          review_content: string
          review_id: number
          review_images: string[]
          review_rating: number
          reviewer_name: string
          status: Database["public"]["Enums"]["review_report_status"]
        }[]
      }
      submit_place_review: {
        Args: {
          content_input: string
          images_input: string[]
          place_id_input: number
          rating_input: number
        }
        Returns: {
          content: string
          created_at: string
          id: number
          images: string[]
          place_id: number | null
          rating: number | null
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: false
          isSetofReturn: true
        }
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
      landmark_type:
        | "Caves"
        | "Church"
        | "Cultural Heritage"
        | "Falls"
        | "Farm"
        | "Garden"
        | "Historic Monuments"
        | "Historical Cultural Attraction"
        | "Historical Road/Trails"
        | "Historical Site"
        | "Landscape/Seascape"
        | "Mall"
        | "Monument"
        | "Mountain/Hill/Highland"
        | "Museum"
        | "Natural Attraction"
        | "Religious Site"
        | "Restaurant"
        | "River/Landscape"
        | "Structures"
      landmark_type2:
        | "Historical"
        | "Landmark"
        | "Nature"
        | "Religious"
        | "Museum"
        | "Mall"
      LandmarkCreationType: "TOURIST_ATTRACTION" | "COMMERCIAL" | "PERSONAL"
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
        | "San Ildefonso"
        | "San Miguel"
        | "San Rafael"
        | "Marilao"
        | "Meycauayan"
        | "Obando"
        | "Balagtas"
        | "Bocaue"
        | "Guiguinto"
        | "Pandi"
        | "Angat"
        | "Norzagaray"
        | "Santa Maria"
        | "SJDM"
      review_report_status: "PENDING" | "ACTION_TAKEN" | "DISMISSED"
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
      landmark_type: [
        "Caves",
        "Church",
        "Cultural Heritage",
        "Falls",
        "Farm",
        "Garden",
        "Historic Monuments",
        "Historical Cultural Attraction",
        "Historical Road/Trails",
        "Historical Site",
        "Landscape/Seascape",
        "Mall",
        "Monument",
        "Mountain/Hill/Highland",
        "Museum",
        "Natural Attraction",
        "Religious Site",
        "Restaurant",
        "River/Landscape",
        "Structures",
      ],
      landmark_type2: [
        "Historical",
        "Landmark",
        "Nature",
        "Religious",
        "Museum",
        "Mall",
      ],
      LandmarkCreationType: ["TOURIST_ATTRACTION", "COMMERCIAL", "PERSONAL"],
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
        "San Ildefonso",
        "San Miguel",
        "San Rafael",
        "Marilao",
        "Meycauayan",
        "Obando",
        "Balagtas",
        "Bocaue",
        "Guiguinto",
        "Pandi",
        "Angat",
        "Norzagaray",
        "Santa Maria",
        "SJDM",
      ],
      review_report_status: ["PENDING", "ACTION_TAKEN", "DISMISSED"],
      user_type: ["Regular", "Admin", "SuperAdmin"],
    },
  },
} as const
