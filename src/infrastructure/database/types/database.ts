/**
 * Database types for Supabase integration
 * These types represent the actual database schema
 */

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
          credits: number;
        };
        Insert: {
          id: string;
          created_at?: string | null;
          tier?: "free" | "paid" | "admin";
          credits?: number;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          tier?: "free" | "paid" | "admin";
          credits?: number;
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
      saved_hackathon_analyses: {
        Row: {
          id: string;
          user_id: string;
          project_description: string;
          selected_category: string;
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
          selected_category?: string;
          kiro_usage?: string;
          analysis: Json;
          audio_base64?: string | null;
          supporting_materials?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_description?: string;
          selected_category?: string;
          kiro_usage?: string;
          analysis?: Json;
          audio_base64?: string | null;
          supporting_materials?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: "deduct" | "add" | "refund" | "admin_adjustment";
          description: string;
          metadata: Json | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: "deduct" | "add" | "refund" | "admin_adjustment";
          description: string;
          metadata?: Json | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: "deduct" | "add" | "refund" | "admin_adjustment";
          description?: string;
          metadata?: Json | null;
          timestamp?: string;
          created_at?: string;
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

// Convenience type exports
export type SavedAnalysesRow =
  Database["public"]["Tables"]["saved_analyses"]["Row"];
export type SavedAnalysesInsert =
  Database["public"]["Tables"]["saved_analyses"]["Insert"];
export type SavedAnalysesUpdate =
  Database["public"]["Tables"]["saved_analyses"]["Update"];

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type UserTier = Database["public"]["Tables"]["profiles"]["Row"]["tier"];

export type SavedHackathonAnalysesRow =
  Database["public"]["Tables"]["saved_hackathon_analyses"]["Row"];
export type SavedHackathonAnalysesInsert =
  Database["public"]["Tables"]["saved_hackathon_analyses"]["Insert"];
export type SavedHackathonAnalysesUpdate =
  Database["public"]["Tables"]["saved_hackathon_analyses"]["Update"];
export type CreditTransactionRow =
  Database["public"]["Tables"]["credit_transactions"]["Row"];
export type CreditTransactionInsert =
  Database["public"]["Tables"]["credit_transactions"]["Insert"];
export type CreditTransactionUpdate =
  Database["public"]["Tables"]["credit_transactions"]["Update"];
