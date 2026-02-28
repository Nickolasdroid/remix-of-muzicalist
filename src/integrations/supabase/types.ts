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
      announcements: {
        Row: {
          budget: string | null
          created_at: string
          date: string
          description: string
          event_date: string | null
          id: string
          is_premium: boolean
          location: string | null
          media_type: string | null
          media_url: string | null
          profile_id: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          date?: string
          description: string
          event_date?: string | null
          id?: string
          is_premium?: boolean
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          profile_id: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          date?: string
          description?: string
          event_date?: string | null
          id?: string
          is_premium?: boolean
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          profile_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          created_at: string
          event_date: string
          event_end_date: string | null
          event_type: string | null
          id: string
          message: string | null
          profile_id: string
          requester_email: string
          requester_name: string
          requester_phone: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_end_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          profile_id: string
          requester_email: string
          requester_name: string
          requester_phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_end_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          profile_id?: string
          requester_email?: string
          requester_name?: string
          requester_phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          event_date: string
          event_type: string | null
          id: string
          notes: string | null
          profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_type?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          artist_id: string
          created_at: string
          deleted_at_by_artist: string | null
          deleted_at_by_participant: string | null
          deleted_by_artist: boolean
          deleted_by_participant: boolean
          id: string
          participant_id: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          deleted_at_by_artist?: string | null
          deleted_at_by_participant?: string | null
          deleted_by_artist?: boolean
          deleted_by_participant?: boolean
          id?: string
          participant_id: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          deleted_at_by_artist?: string | null
          deleted_at_by_participant?: string | null
          deleted_by_artist?: boolean
          deleted_by_participant?: boolean
          id?: string
          participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          artist_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          thumbnail_url: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          thumbnail_url?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          thumbnail_url?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          id: string
          message: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          career_start_year: number | null
          country: string | null
          county: string
          created_at: string | null
          email: string
          estimated_price: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook_url: string | null
          first_name: string
          hide_email: boolean
          hide_phone: boolean
          id: string
          instagram_url: string | null
          instruments: string | null
          last_name: string
          music_genres: string | null
          number_of_events: number
          phone: string
          plan: string
          specialization:
            | Database["public"]["Enums"]["artist_specialization"]
            | null
          spotify_url: string | null
          stage_name: string
          tiktok_url: string | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          career_start_year?: number | null
          country?: string | null
          county: string
          created_at?: string | null
          email: string
          estimated_price?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook_url?: string | null
          first_name: string
          hide_email?: boolean
          hide_phone?: boolean
          id: string
          instagram_url?: string | null
          instruments?: string | null
          last_name: string
          music_genres?: string | null
          number_of_events?: number
          phone: string
          plan?: string
          specialization?:
            | Database["public"]["Enums"]["artist_specialization"]
            | null
          spotify_url?: string | null
          stage_name: string
          tiktok_url?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          career_start_year?: number | null
          country?: string | null
          county?: string
          created_at?: string | null
          email?: string
          estimated_price?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook_url?: string | null
          first_name?: string
          hide_email?: boolean
          hide_phone?: boolean
          id?: string
          instagram_url?: string | null
          instruments?: string | null
          last_name?: string
          music_genres?: string | null
          number_of_events?: number
          phone?: string
          plan?: string
          specialization?:
            | Database["public"]["Enums"]["artist_specialization"]
            | null
          spotify_url?: string | null
          stage_name?: string
          tiktok_url?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          profile_id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          reviewer_user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          reviewer_user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          rating?: number
          reviewer_email?: string
          reviewer_name?: string
          reviewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
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
      auto_reject_expired_booking_requests: { Args: never; Returns: undefined }
      get_or_create_conversation: {
        Args: { _artist_id: string; _participant_id: string }
        Returns: string
      }
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      soft_delete_conversation: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
    }
    Enums: {
      artist_specialization: "Singer" | "Instrumentalist" | "DJ" | "Band"
      experience_level:
        | "Beginner"
        | "Intermediate"
        | "Advanced"
        | "Professional"
      user_type: "artist" | "user"
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
      artist_specialization: ["Singer", "Instrumentalist", "DJ", "Band"],
      experience_level: [
        "Beginner",
        "Intermediate",
        "Advanced",
        "Professional",
      ],
      user_type: ["artist", "user"],
    },
  },
} as const
