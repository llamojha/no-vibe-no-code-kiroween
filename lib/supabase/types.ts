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
          tier: "free" | "paid" | "admin";
        };
        Insert: {
          id: string;
          created_at?: string | null;
          tier?: "free" | "paid" | "admin";
        };
        Update: {
          id?: string;
          created_at?: string | null;
          tier?: "free" | "paid" | "admin";
        };
        Relationships: [];
      };
      saved_analyses: {
        Row: {
          id: string;
          user_id: string;
          idea: string;
          analysis: Json;
          audio_base64: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea: string;
          analysis: Json;
          audio_base64?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          idea?: string;
          analysis?: Json;
          audio_base64?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      saved_hackathon_analyses: {
        Row: {
          id: string;
          user_id: string;
          project_description: string;
          selected_category:
            | "resurrection"
            | "frankenstein"
            | "skeleton-crew"
            | "costume-contest";
          kiro_usage: string;
          analysis: Json;
          audio_base64: string | null;
          supporting_materials: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_description: string;
          selected_category:
            | "resurrection"
            | "frankenstein"
            | "skeleton-crew"
            | "costume-contest";
          kiro_usage: string;
          analysis: Json;
          audio_base64?: string | null;
          supporting_materials?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_description?: string;
          selected_category?:
            | "resurrection"
            | "frankenstein"
            | "skeleton-crew"
            | "costume-contest";
          kiro_usage?: string;
          analysis?: Json;
          audio_base64?: string | null;
          supporting_materials?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      saved_frankenstein_ideas: {
        Row: {
          id: string;
          user_id: string;
          mode: "companies" | "aws";
          tech1_name: string;
          tech1_description: string;
          tech1_category: string;
          tech2_name: string;
          tech2_description: string;
          tech2_category: string;
          analysis: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: "companies" | "aws";
          tech1_name: string;
          tech1_description: string;
          tech1_category: string;
          tech2_name: string;
          tech2_description: string;
          tech2_category: string;
          analysis: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: "companies" | "aws";
          tech1_name?: string;
          tech1_description?: string;
          tech1_category?: string;
          tech2_name?: string;
          tech2_description?: string;
          tech2_category?: string;
          analysis?: Json;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SavedAnalysesRow =
  Database["public"]["Tables"]["saved_analyses"]["Row"];
export type SavedAnalysesInsert =
  Database["public"]["Tables"]["saved_analyses"]["Insert"];
export type SavedAnalysesUpdate =
  Database["public"]["Tables"]["saved_analyses"]["Update"];
export type SavedHackathonAnalysesRow =
  Database["public"]["Tables"]["saved_hackathon_analyses"]["Row"];
export type SavedHackathonAnalysesInsert =
  Database["public"]["Tables"]["saved_hackathon_analyses"]["Insert"];
export type SavedHackathonAnalysesUpdate =
  Database["public"]["Tables"]["saved_hackathon_analyses"]["Update"];
export type SavedFrankensteinIdeasRow =
  Database["public"]["Tables"]["saved_frankenstein_ideas"]["Row"];
export type SavedFrankensteinIdeasInsert =
  Database["public"]["Tables"]["saved_frankenstein_ideas"]["Insert"];
export type SavedFrankensteinIdeasUpdate =
  Database["public"]["Tables"]["saved_frankenstein_ideas"]["Update"];
export type UserTier = Database["public"]["Tables"]["profiles"]["Row"]["tier"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
