export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string | null;
          tier: Database["public"]["Enums"]["user_tier"];
        };
        Insert: {
          id: string;
          created_at?: string | null;
          tier?: Database["public"]["Enums"]["user_tier"];
        };
        Update: {
          id?: string;
          created_at?: string | null;
          tier?: Database["public"]["Enums"]["user_tier"];
        };
        Relationships: [];
      };
      saved_analyses: {
        Row: {
          id: string;
          user_id: string;
          analysis_type: string;
          idea: string;
          analysis: Json;
          audio_base64: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          analysis_type?: string;
          idea: string;
          analysis: Json;
          audio_base64?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          analysis_type?: string;
          idea?: string;
          analysis?: Json;
          audio_base64?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          user_id: string;
          idea_text: string;
          source: "manual" | "frankenstein";
          project_status: "idea" | "in_progress" | "completed" | "archived";
          notes: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea_text: string;
          source?: "manual" | "frankenstein";
          project_status?: "idea" | "in_progress" | "completed" | "archived";
          notes?: string;
          tags?: string[];
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          idea_text?: string;
          source?: "manual" | "frankenstein";
          project_status?: "idea" | "in_progress" | "completed" | "archived";
          notes?: string;
          tags?: string[];
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          idea_id: string;
          user_id: string;
          document_type: "startup_analysis" | "hackathon_analysis";
          title: string | null;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          user_id: string;
          document_type: "startup_analysis" | "hackathon_analysis";
          title?: string | null;
          content: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          idea_id?: string;
          user_id?: string;
          document_type?: "startup_analysis" | "hackathon_analysis";
          title?: string | null;
          content?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_tier: "free" | "paid" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type SavedAnalysesRow =
  Database["public"]["Tables"]["saved_analyses"]["Row"];
export type SavedAnalysesInsert =
  Database["public"]["Tables"]["saved_analyses"]["Insert"];
export type SavedAnalysesUpdate =
  Database["public"]["Tables"]["saved_analyses"]["Update"];
export type UserTier = Database["public"]["Enums"]["user_tier"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// Re-export hackathon analysis table types from infrastructure database types.
// This avoids duplicating or extending the schema here.
export type {
  SavedHackathonAnalysesRow,
  SavedHackathonAnalysesInsert,
  SavedHackathonAnalysesUpdate,
} from "@/infrastructure/database/types/database";
