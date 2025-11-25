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
      support_requests: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['support_requests']['Row'], 'id' | 'created_at'>>;
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          report_type: string;
          data: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          report_type: string;
          data?: Record<string, any>;
          created_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: Record<string, any>;
          status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
          hero_image_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          published_at: string | null;
          author_id: string | null;
          editor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content?: Record<string, any>;
          status?: 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
          hero_image_url?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          published_at?: string | null;
          author_id?: string | null;
          editor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['pages']['Row'], 'id' | 'created_at'>>;
      };
      page_revisions: {
        Row: {
          id: string;
          page_id: string;
          version: number;
          title: string;
          excerpt: string | null;
          content: Record<string, any>;
          author_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          version?: number;
          title: string;
          excerpt?: string | null;
          content: Record<string, any>;
          author_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['page_revisions']['Row'], 'id' | 'page_id' | 'version'>>;
      };
      posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: Record<string, any>;
          status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
          cover_image_url: string | null;
          tags: string[];
          published_at: string | null;
          author_id: string | null;
          editor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content?: Record<string, any>;
          status?: 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
          cover_image_url?: string | null;
          tags?: string[];
          published_at?: string | null;
          author_id?: string | null;
          editor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at'>>;
      };
      media_assets: {
        Row: {
          id: string;
          bucket: string;
          path: string;
          mime_type: string | null;
          size_bytes: number | null;
          alt_text: string | null;
          metadata: Record<string, any>;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bucket?: string;
          path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          alt_text?: string | null;
          metadata?: Record<string, any>;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['media_assets']['Row'], 'id' | 'created_at'>>;
      };
      site_settings: {
        Row: {
          key: string;
          value: Record<string, any>;
          is_public: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Record<string, any>;
          is_public?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>;
      };
      admin_activity_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['admin_activity_logs']['Row'], 'id'>>;
      };
    };
  };
}
