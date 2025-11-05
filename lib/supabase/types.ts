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
          tier: 'free' | 'paid' | 'admin';
        };
        Insert: {
          id: string;
          created_at?: string | null;
          tier?: 'free' | 'paid' | 'admin';
        };
        Update: {
          id?: string;
          created_at?: string | null;
          tier?: 'free' | 'paid' | 'admin';
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SavedAnalysesRow = Database['public']['Tables']['saved_analyses']['Row'];
export type SavedAnalysesInsert = Database['public']['Tables']['saved_analyses']['Insert'];
export type SavedAnalysesUpdate = Database['public']['Tables']['saved_analyses']['Update'];
export type UserTier = Database['public']['Tables']['profiles']['Row']['tier'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
