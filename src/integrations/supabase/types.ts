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
      account_suspensions: {
        Row: {
          created_at: string
          created_by: string | null
          duration_key: string
          id: string
          internal_notes: string | null
          is_active: boolean
          is_permanent: boolean
          notify_user: boolean
          other_reason: string | null
          reactivated_at: string | null
          reactivated_by: string | null
          reason: string
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_key: string
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          is_permanent?: boolean
          notify_user?: boolean
          other_reason?: string | null
          reactivated_at?: string | null
          reactivated_by?: string | null
          reason: string
          suspended_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_key?: string
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          is_permanent?: boolean
          notify_user?: boolean
          other_reason?: string | null
          reactivated_at?: string | null
          reactivated_by?: string | null
          reason?: string
          suspended_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_likes: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
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
          requester_user_id: string | null
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
          requester_user_id?: string | null
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
          requester_user_id?: string | null
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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          announcement_id: string | null
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string | null
          user_id: string
        }
        Insert: {
          announcement_id?: string | null
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string | null
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      consumed_ad_slots: {
        Row: {
          announcement_id: string | null
          consumed_at: string
          created_at: string
          id: string
          is_premium: boolean
          kind: string
          profile_id: string
        }
        Insert: {
          announcement_id?: string | null
          consumed_at?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          kind?: string
          profile_id: string
        }
        Update: {
          announcement_id?: string | null
          consumed_at?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          kind?: string
          profile_id?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          announcement_id: string | null
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
          announcement_id?: string | null
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
          announcement_id?: string | null
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
            foreignKeyName: "conversations_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          attempts: number
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_type: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          finished_at: string | null
          id: string
          invalid_recipients: number
          last_error: string | null
          name: string
          sent_count: number
          started_at: string | null
          status: string
          template: string
          total_recipients: number
          updated_at: string
          uploaded_file_name: string | null
          valid_recipients: number
        }
        Insert: {
          audience_type?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          invalid_recipients?: number
          last_error?: string | null
          name: string
          sent_count?: number
          started_at?: string | null
          status?: string
          template: string
          total_recipients?: number
          updated_at?: string
          uploaded_file_name?: string | null
          valid_recipients?: number
        }
        Update: {
          audience_type?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          invalid_recipients?: number
          last_error?: string | null
          name?: string
          sent_count?: number
          started_at?: string | null
          status?: string
          template?: string
          total_recipients?: number
          updated_at?: string
          uploaded_file_name?: string | null
          valid_recipients?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_template_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      email_template_usage: {
        Row: {
          created_at: string
          id: string
          module_name: string
          template_id: string
          usage_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          module_name: string
          template_id: string
          usage_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          module_name?: string
          template_id?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_template_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_variables: {
        Row: {
          created_at: string
          description: string | null
          id: string
          required: boolean
          template_id: string
          variable_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          required?: boolean
          template_id: string
          variable_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          required?: boolean
          template_id?: string
          variable_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_template_variables_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          html_content: string | null
          id: string
          status: string
          subject: string
          template_id: string
          text_content: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_content?: string | null
          id?: string
          status?: string
          subject: string
          template_id: string
          text_content?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_content?: string | null
          id?: string
          status?: string
          subject?: string
          template_id?: string
          text_content?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          active_version_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_active_version_fk"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "email_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
      moderation_action_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_reversible: boolean
          key: string
          label: string
          severity: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_reversible?: boolean
          key: string
          label: string
          severity?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_reversible?: boolean
          key?: string
          label?: string
          severity?: number
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action_type_id: string
          case_id: string
          created_at: string
          id: string
          is_reversed: boolean
          parameters: Json
          performed_by: string | null
          reason: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          target_id: string | null
          target_type_id: string | null
        }
        Insert: {
          action_type_id: string
          case_id: string
          created_at?: string
          id?: string
          is_reversed?: boolean
          parameters?: Json
          performed_by?: string | null
          reason?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          target_id?: string | null
          target_type_id?: string | null
        }
        Update: {
          action_type_id?: string
          case_id?: string
          created_at?: string
          id?: string
          is_reversed?: boolean
          parameters?: Json
          performed_by?: string | null
          reason?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          target_id?: string | null
          target_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "moderation_action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_type_id_fkey"
            columns: ["target_type_id"]
            isOneToOne: false
            referencedRelation: "moderation_target_types"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_case_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          case_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["moderation_event_type"]
          from_value: Json | null
          id: string
          message: string | null
          payload: Json
          to_value: Json | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          case_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["moderation_event_type"]
          from_value?: Json | null
          id?: string
          message?: string | null
          payload?: Json
          to_value?: Json | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          case_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["moderation_event_type"]
          from_value?: Json | null
          id?: string
          message?: string | null
          payload?: Json
          to_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_case_notes: {
        Row: {
          author_id: string | null
          body: string
          case_id: string
          created_at: string
          id: string
          is_internal: boolean
        }
        Insert: {
          author_id?: string | null
          body: string
          case_id: string
          created_at?: string
          id?: string
          is_internal?: boolean
        }
        Update: {
          author_id?: string | null
          body?: string
          case_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "moderation_case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_cases: {
        Row: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_moderator_id?: string | null
          case_number?: string
          category_id: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          first_review_at?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["moderation_priority"]
          reopened_at?: string | null
          reporter_id?: string | null
          reports_count?: number
          resolution_action_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["moderation_case_status"]
          summary?: string | null
          target_id: string
          target_snapshot?: Json | null
          target_type_id: string
          title: string
          triaged_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_moderator_id?: string | null
          case_number?: string
          category_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          first_review_at?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["moderation_priority"]
          reopened_at?: string | null
          reporter_id?: string | null
          reports_count?: number
          resolution_action_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["moderation_case_status"]
          summary?: string | null
          target_id?: string
          target_snapshot?: Json | null
          target_type_id?: string
          title?: string
          triaged_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_cases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "moderation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_resolution_action_id_fkey"
            columns: ["resolution_action_id"]
            isOneToOne: false
            referencedRelation: "moderation_action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_target_type_id_fkey"
            columns: ["target_type_id"]
            isOneToOne: false
            referencedRelation: "moderation_target_types"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_categories: {
        Row: {
          created_at: string
          default_priority: Database["public"]["Enums"]["moderation_priority"]
          description: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_priority?: Database["public"]["Enums"]["moderation_priority"]
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_priority?: Database["public"]["Enums"]["moderation_priority"]
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      moderation_evidence: {
        Row: {
          added_by: string | null
          case_id: string
          content: string | null
          created_at: string
          id: string
          kind: string
          snapshot: Json | null
          url: string | null
        }
        Insert: {
          added_by?: string | null
          case_id: string
          content?: string | null
          created_at?: string
          id?: string
          kind: string
          snapshot?: Json | null
          url?: string | null
        }
        Update: {
          added_by?: string | null
          case_id?: string
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          snapshot?: Json | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          case_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json
          reason_key: string | null
          reporter_email: string | null
          reporter_id: string | null
          source: string
        }
        Insert: {
          case_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reason_key?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          source?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reason_key?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_reports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_target_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          label: string
          sort_order: number
          table_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          sort_order?: number
          table_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          sort_order?: number
          table_name?: string | null
        }
        Relationships: []
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
      pending_artist_registrations: {
        Row: {
          avatar_base64: string | null
          billing: string
          career_start_year: number | null
          country: string
          county: string
          created_at: string
          email: string
          experience_level: string | null
          first_name: string
          id: string
          last_name: string
          password_encrypted: string | null
          phone: string
          plan: string
          specialization: string | null
          stage_name: string
          stripe_session_id: string | null
        }
        Insert: {
          avatar_base64?: string | null
          billing: string
          career_start_year?: number | null
          country: string
          county: string
          created_at?: string
          email: string
          experience_level?: string | null
          first_name: string
          id?: string
          last_name: string
          password_encrypted?: string | null
          phone: string
          plan: string
          specialization?: string | null
          stage_name: string
          stripe_session_id?: string | null
        }
        Update: {
          avatar_base64?: string | null
          billing?: string
          career_start_year?: number | null
          country?: string
          county?: string
          created_at?: string
          email?: string
          experience_level?: string | null
          first_name?: string
          id?: string
          last_name?: string
          password_encrypted?: string | null
          phone?: string
          plan?: string
          specialization?: string | null
          stage_name?: string
          stripe_session_id?: string | null
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
      pricing_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          event_type: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          event_type: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_registration_notified_at: string | null
          allow_promotion: boolean
          avatar_url: string | null
          billing: string | null
          bio: string | null
          career_start_year: number | null
          comments_allow_from: string
          comments_allow_gifs: boolean
          country: string | null
          county: string | null
          cover_theme: string | null
          cover_url: string | null
          created_at: string | null
          email: string
          estimated_price: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook_url: string | null
          first_name: string
          gender: string | null
          hide_email: boolean
          hide_phone: boolean
          id: string
          instagram_url: string | null
          instruments: string | null
          is_active: boolean
          is_verified: boolean
          last_name: string
          music_genres: string | null
          notification_preferences: Json
          number_of_events: number
          pending_account_type: string | null
          phone: string
          plan: string
          slug: string | null
          specialization:
            | Database["public"]["Enums"]["artist_specialization"]
            | null
          spotify_url: string | null
          stage_name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_cancel_at_period_end: boolean
          subscription_current_period_end: string | null
          subscription_status: string | null
          tiktok_url: string | null
          updated_at: string | null
          verification_status: string
          welcome_email_attempts: number
          welcome_email_last_attempt_at: string | null
          welcome_email_sent_at: string | null
          youtube_url: string | null
        }
        Insert: {
          admin_registration_notified_at?: string | null
          allow_promotion?: boolean
          avatar_url?: string | null
          billing?: string | null
          bio?: string | null
          career_start_year?: number | null
          comments_allow_from?: string
          comments_allow_gifs?: boolean
          country?: string | null
          county?: string | null
          cover_theme?: string | null
          cover_url?: string | null
          created_at?: string | null
          email: string
          estimated_price?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook_url?: string | null
          first_name: string
          gender?: string | null
          hide_email?: boolean
          hide_phone?: boolean
          id: string
          instagram_url?: string | null
          instruments?: string | null
          is_active?: boolean
          is_verified?: boolean
          last_name: string
          music_genres?: string | null
          notification_preferences?: Json
          number_of_events?: number
          pending_account_type?: string | null
          phone: string
          plan?: string
          slug?: string | null
          specialization?:
            | Database["public"]["Enums"]["artist_specialization"]
            | null
          spotify_url?: string | null
          stage_name: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_cancel_at_period_end?: boolean
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          verification_status?: string
          welcome_email_attempts?: number
          welcome_email_last_attempt_at?: string | null
          welcome_email_sent_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          admin_registration_notified_at?: string | null
          allow_promotion?: boolean
          avatar_url?: string | null
          billing?: string | null
          bio?: string | null
          career_start_year?: number | null
          comments_allow_from?: string
          comments_allow_gifs?: boolean
          country?: string | null
          county?: string | null
          cover_theme?: string | null
          cover_url?: string | null
          created_at?: string | null
          email?: string
          estimated_price?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook_url?: string | null
          first_name?: string
          gender?: string | null
          hide_email?: boolean
          hide_phone?: boolean
          id?: string
          instagram_url?: string | null
          instruments?: string | null
          is_active?: boolean
          is_verified?: boolean
          last_name?: string
          music_genres?: string | null
          notification_preferences?: Json
          number_of_events?: number
          pending_account_type?: string | null
          phone?: string
          plan?: string
          slug?: string | null
          specialization?:
            | Database["public"]["Enums"]["artist_specialization"]
            | null
          spotify_url?: string | null
          stage_name?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_cancel_at_period_end?: boolean
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          verification_status?: string
          welcome_email_attempts?: number
          welcome_email_last_attempt_at?: string | null
          welcome_email_sent_at?: string | null
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
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          profile_id: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      ui_text_translations: {
        Row: {
          created_at: string
          lang: string
          source_text: string
          translated_text: string
        }
        Insert: {
          created_at?: string
          lang: string
          source_text: string
          translated_text: string
        }
        Update: {
          created_at?: string
          lang?: string
          source_text?: string
          translated_text?: string
        }
        Relationships: []
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
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          id_document_path: string
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_path: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          id_document_path: string
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          id_document_path?: string
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_profile_id_fkey"
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
      add_case_action: {
        Args: {
          _action_key: string
          _case_id: string
          _parameters?: Json
          _reason?: string
          _target_id?: string
          _target_type_key?: string
        }
        Returns: {
          action_type_id: string
          case_id: string
          created_at: string
          id: string
          is_reversed: boolean
          parameters: Json
          performed_by: string | null
          reason: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          target_id: string | null
          target_type_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "moderation_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_case_evidence: {
        Args: {
          _case_id: string
          _content?: string
          _kind: string
          _snapshot?: Json
          _url?: string
        }
        Returns: {
          added_by: string | null
          case_id: string
          content: string | null
          created_at: string
          id: string
          kind: string
          snapshot: Json | null
          url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "moderation_evidence"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_case_note: {
        Args: { _body: string; _case_id: string; _is_internal?: boolean }
        Returns: {
          author_id: string | null
          body: string
          case_id: string
          created_at: string
          id: string
          is_internal: boolean
        }
        SetofOptions: {
          from: "*"
          to: "moderation_case_notes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_get_profiles_basic: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          email: string
          id: string
          stage_name: string
        }[]
      }
      admin_list_profiles: {
        Args: never
        Returns: {
          active_suspension_id: string
          avatar_url: string
          avg_rating: number
          billing: string
          country: string
          county: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          is_permanent_suspension: boolean
          is_verified: boolean
          last_name: string
          last_sign_in_at: string
          phone: string
          plan: string
          reviews_count: number
          specialization: string
          stage_name: string
          stripe_subscription_id: string
          subscription_current_period_end: string
          subscription_status: string
          suspended_until: string
          suspension_reason: string
          verification_status: string
        }[]
      }
      assign_moderator: {
        Args: { _case_id: string; _moderator_id: string }
        Returns: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "moderation_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auto_reactivate_expired_suspensions: { Args: never; Returns: number }
      auto_reject_expired_booking_requests: { Args: never; Returns: undefined }
      change_case_priority: {
        Args: {
          _case_id: string
          _priority: Database["public"]["Enums"]["moderation_priority"]
        }
        Returns: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "moderation_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      change_case_status: {
        Args: {
          _case_id: string
          _next_status: Database["public"]["Enums"]["moderation_case_status"]
          _note?: string
        }
        Returns: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "moderation_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      close_case: {
        Args: {
          _case_id: string
          _resolution_action_key?: string
          _resolution_notes?: string
        }
        Returns: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "moderation_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_email_template_version: {
        Args: {
          _html_content: string
          _subject: string
          _template_id: string
          _text_content: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          html_content: string | null
          id: string
          status: string
          subject: string
          template_id: string
          text_content: string | null
          version_number: number
        }
        SetofOptions: {
          from: "*"
          to: "email_template_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_moderation_case: {
        Args: {
          _category_key: string
          _metadata?: Json
          _priority?: Database["public"]["Enums"]["moderation_priority"]
          _reporter_email?: string
          _reporter_id?: string
          _reporter_reason?: string
          _summary?: string
          _target_id: string
          _target_snapshot?: Json
          _target_type_key: string
          _title: string
        }
        Returns: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "moderation_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_moderation_case_number: { Args: never; Returns: string }
      get_accepted_events_count: {
        Args: { _profile_id: string }
        Returns: number
      }
      get_account_suspension_history: {
        Args: { _user_id: string }
        Returns: {
          admin_name: string
          created_at: string
          created_by: string
          duration_key: string
          id: string
          internal_notes: string
          is_active: boolean
          is_permanent: boolean
          notify_user: boolean
          other_reason: string
          reactivated_at: string
          reactivated_by: string
          reactivator_name: string
          reason: string
          suspended_until: string
          user_id: string
        }[]
      }
      get_admin_user_ids: { Args: never; Returns: string[] }
      get_booked_profile_ids: {
        Args: { _event_date: string; _profile_ids: string[] }
        Returns: string[]
      }
      get_moderation_case_details: { Args: { _case_id: string }; Returns: Json }
      get_moderation_case_timeline: {
        Args: { _case_id: string }
        Returns: {
          actor_id: string | null
          actor_role: string | null
          case_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["moderation_event_type"]
          from_value: Json | null
          id: string
          message: string | null
          payload: Json
          to_value: Json | null
        }[]
        SetofOptions: {
          from: "*"
          to: "moderation_case_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_calendar_event_for_date: {
        Args: { _event_date: string }
        Returns: {
          created_at: string
          event_date: string
          event_type: string | null
          id: string
          notes: string | null
          profile_id: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "calendar_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_calendar_events: {
        Args: never
        Returns: {
          created_at: string
          event_date: string
          event_type: string | null
          id: string
          notes: string | null
          profile_id: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "calendar_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_full_profile: {
        Args: never
        Returns: {
          admin_registration_notified_at: string | null
          allow_promotion: boolean
          avatar_url: string | null
          billing: string | null
          bio: string | null
          career_start_year: number | null
          comments_allow_from: string
          comments_allow_gifs: boolean
          country: string | null
          county: string | null
          cover_theme: string | null
          cover_url: string | null
          created_at: string | null
          email: string
          estimated_price: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          facebook_url: string | null
          first_name: string
          gender: string | null
          hide_email: boolean
          hide_phone: boolean
          id: string
          instagram_url: string | null
          instruments: string | null
          is_active: boolean
          is_verified: boolean
          last_name: string
          music_genres: string | null
          notification_preferences: Json
          number_of_events: number
          pending_account_type: string | null
          phone: string
          plan: string
          slug: string | null
          specialization:
            | Database["public"]["Enums"]["artist_specialization"]
            | null
          spotify_url: string | null
          stage_name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_cancel_at_period_end: boolean
          subscription_current_period_end: string | null
          subscription_status: string | null
          tiktok_url: string | null
          updated_at: string | null
          verification_status: string
          welcome_email_attempts: number
          welcome_email_last_attempt_at: string | null
          welcome_email_sent_at: string | null
          youtube_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_or_create_conversation: {
        Args: {
          _announcement_id?: string
          _artist_id: string
          _participant_id: string
        }
        Returns: string
      }
      get_profile_contact: {
        Args: { _profile_id: string }
        Returns: {
          email: string
          phone: string
        }[]
      }
      get_public_calendar: {
        Args: { _profile_id: string }
        Returns: {
          event_date: string
          slots: Json
          status: string
        }[]
      }
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      is_account_active: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_moderator_or_admin: { Args: { _user_id: string }; Returns: boolean }
      list_moderation_cases: {
        Args: {
          _assigned_to?: string
          _category_keys?: string[]
          _limit?: number
          _offset?: number
          _priorities?: Database["public"]["Enums"]["moderation_priority"][]
          _search?: string
          _statuses?: Database["public"]["Enums"]["moderation_case_status"][]
          _target_type_keys?: string[]
        }
        Returns: {
          assigned_moderator_id: string
          case_number: string
          category_key: string
          category_label: string
          closed_at: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["moderation_priority"]
          reporter_id: string
          reports_count: number
          resolved_at: string
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string
          target_id: string
          target_type_key: string
          title: string
          total_count: number
          updated_at: string
        }[]
      }
      moderation_require_mod: { Args: never; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      publish_email_template_version: {
        Args: { _version_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          html_content: string | null
          id: string
          status: string
          subject: string
          template_id: string
          text_content: string | null
          version_number: number
        }
        SetofOptions: {
          from: "*"
          to: "email_template_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reactivate_account: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          duration_key: string
          id: string
          internal_notes: string | null
          is_active: boolean
          is_permanent: boolean
          notify_user: boolean
          other_reason: string | null
          reactivated_at: string | null
          reactivated_by: string | null
          reason: string
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "account_suspensions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reopen_case: {
        Args: { _case_id: string; _reason?: string }
        Returns: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "moderation_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      restore_email_template_version: {
        Args: { _version_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          html_content: string | null
          id: string
          status: string
          subject: string
          template_id: string
          text_content: string | null
          version_number: number
        }
        SetofOptions: {
          from: "*"
          to: "email_template_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      retry_pending_welcome_emails: { Args: never; Returns: number }
      reverse_case_action: {
        Args: { _action_id: string; _reason: string }
        Returns: {
          action_type_id: string
          case_id: string
          created_at: string
          id: string
          is_reversed: boolean
          parameters: Json
          performed_by: string | null
          reason: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          target_id: string | null
          target_type_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "moderation_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      slugify: { Args: { input: string }; Returns: string }
      soft_delete_conversation: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      suspend_account: {
        Args: {
          _duration_key: string
          _internal_notes: string
          _notify_user: boolean
          _other_reason: string
          _reason: string
          _user_id: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          duration_key: string
          id: string
          internal_notes: string | null
          is_active: boolean
          is_permanent: boolean
          notify_user: boolean
          other_reason: string | null
          reactivated_at: string | null
          reactivated_by: string | null
          reason: string
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "account_suspensions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      try_lock_email_campaign: {
        Args: { _campaign_id: string }
        Returns: {
          audience_type: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          finished_at: string | null
          id: string
          invalid_recipients: number
          last_error: string | null
          name: string
          sent_count: number
          started_at: string | null
          status: string
          template: string
          total_recipients: number
          updated_at: string
          uploaded_file_name: string | null
          valid_recipients: number
        }[]
        SetofOptions: {
          from: "*"
          to: "email_campaigns"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      unaccent: { Args: { "": string }; Returns: string }
      unassign_moderator: {
        Args: { _case_id: string }
        Returns: {
          assigned_moderator_id: string | null
          case_number: string
          category_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          first_review_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["moderation_priority"]
          reopened_at: string | null
          reporter_id: string | null
          reports_count: number
          resolution_action_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["moderation_case_status"]
          summary: string | null
          target_id: string
          target_snapshot: Json | null
          target_type_id: string
          title: string
          triaged_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "moderation_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_welcome_trigger_secret: {
        Args: { _secret: string }
        Returns: boolean
      }
    }
    Enums: {
      artist_specialization: "Singer" | "Instrumentalist" | "DJ" | "Band"
      experience_level:
        | "Beginner"
        | "Intermediate"
        | "Advanced"
        | "Professional"
      moderation_case_status:
        | "open"
        | "triaged"
        | "in_review"
        | "waiting_for_response"
        | "resolved"
        | "closed"
        | "reopened"
      moderation_event_type:
        | "case_created"
        | "case_assigned"
        | "case_unassigned"
        | "status_changed"
        | "priority_changed"
        | "category_changed"
        | "report_added"
        | "evidence_added"
        | "note_added"
        | "action_applied"
        | "action_reversed"
        | "decision_changed"
        | "appeal_received"
        | "case_reopened"
        | "case_resolved"
        | "case_closed"
        | "system_note"
      moderation_priority: "low" | "medium" | "high" | "critical"
      user_type: "artist" | "user" | "admin" | "moderator"
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
      moderation_case_status: [
        "open",
        "triaged",
        "in_review",
        "waiting_for_response",
        "resolved",
        "closed",
        "reopened",
      ],
      moderation_event_type: [
        "case_created",
        "case_assigned",
        "case_unassigned",
        "status_changed",
        "priority_changed",
        "category_changed",
        "report_added",
        "evidence_added",
        "note_added",
        "action_applied",
        "action_reversed",
        "decision_changed",
        "appeal_received",
        "case_reopened",
        "case_resolved",
        "case_closed",
        "system_note",
      ],
      moderation_priority: ["low", "medium", "high", "critical"],
      user_type: ["artist", "user", "admin", "moderator"],
    },
  },
} as const
