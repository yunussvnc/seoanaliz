import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          domain: string;
          name: string;
          status: 'active' | 'paused' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain: string;
          name: string;
          status?: 'active' | 'paused' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain?: string;
          name?: string;
          status?: 'active' | 'paused' | 'archived';
          updated_at?: string;
        };
      };
      seo_analyses: {
        Row: {
          id: string;
          project_id: string;
          analysis_type: string;
          results: Record<string, any>;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          analysis_type: string;
          results?: Record<string, any>;
          score?: number;
          created_at?: string;
        };
      };
      keywords: {
        Row: {
          id: string;
          project_id: string;
          keyword: string;
          position: number;
          search_volume: number;
          difficulty: number;
          checked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          keyword: string;
          position?: number;
          search_volume?: number;
          difficulty?: number;
          checked_at?: string;
          created_at?: string;
        };
      };
    };
  };
}
