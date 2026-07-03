import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'developer' | 'team_lead' | 'admin';
          skills: string[];
          bio: string | null;
          github_username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'developer' | 'team_lead' | 'admin';
          skills?: string[];
          bio?: string | null;
          github_username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'developer' | 'team_lead' | 'admin';
          skills?: string[];
          bio?: string | null;
          github_username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      repositories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          language: string | null;
          framework: string | null;
          source_type: 'github' | 'zip' | 'git_url';
          source_url: string | null;
          stars: number;
          branches: number;
          commits: number;
          size: number;
          license: string | null;
          last_analyzed_at: string | null;
          status: 'pending' | 'analyzing' | 'completed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          description?: string | null;
          language?: string | null;
          framework?: string | null;
          source_type: 'github' | 'zip' | 'git_url';
          source_url?: string | null;
          stars?: number;
          branches?: number;
          commits?: number;
          size?: number;
          license?: string | null;
          last_analyzed_at?: string | null;
          status?: 'pending' | 'analyzing' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          language?: string | null;
          framework?: string | null;
          source_type?: 'github' | 'zip' | 'git_url';
          source_url?: string | null;
          stars?: number;
          branches?: number;
          commits?: number;
          size?: number;
          license?: string | null;
          last_analyzed_at?: string | null;
          status?: 'pending' | 'analyzing' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          repository_id: string;
          user_id: string;
          type: 'full' | 'security' | 'architecture' | 'performance' | 'debt';
          status: 'pending' | 'processing' | 'completed' | 'failed';
          overall_score: number | null;
          security_score: number | null;
          maintainability_score: number | null;
          performance_score: number | null;
          debt_score: number | null;
          findings_count: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          repository_id: string;
          user_id?: string;
          type: 'full' | 'security' | 'architecture' | 'performance' | 'debt';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          overall_score?: number | null;
          security_score?: number | null;
          maintainability_score?: number | null;
          performance_score?: number | null;
          debt_score?: number | null;
          findings_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          repository_id?: string;
          user_id?: string;
          type?: 'full' | 'security' | 'architecture' | 'performance' | 'debt';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          overall_score?: number | null;
          security_score?: number | null;
          maintainability_score?: number | null;
          performance_score?: number | null;
          debt_score?: number | null;
          findings_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          analysis_id: string;
          repository_id: string;
          file_path: string;
          line_start: number | null;
          line_end: number | null;
          severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
          category: 'security' | 'performance' | 'maintainability' | 'bug_risk' | 'style';
          title: string;
          description: string | null;
          suggestion: string | null;
          code_snippet: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          repository_id: string;
          file_path: string;
          line_start?: number | null;
          line_end?: number | null;
          severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
          category: 'security' | 'performance' | 'maintainability' | 'bug_risk' | 'style';
          title: string;
          description?: string | null;
          suggestion?: string | null;
          code_snippet?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          repository_id?: string;
          file_path?: string;
          line_start?: number | null;
          line_end?: number | null;
          severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
          category?: 'security' | 'performance' | 'maintainability' | 'bug_risk' | 'style';
          title?: string;
          description?: string | null;
          suggestion?: string | null;
          code_snippet?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          repository_id: string;
          user_id: string;
          type: 'readme' | 'api' | 'architecture' | 'security' | 'full';
          title: string;
          content: string | null;
          format: 'markdown' | 'html' | 'pdf';
          created_at: string;
        };
        Insert: {
          id?: string;
          repository_id: string;
          user_id?: string;
          type: 'readme' | 'api' | 'architecture' | 'security' | 'full';
          title: string;
          content?: string | null;
          format?: 'markdown' | 'html' | 'pdf';
          created_at?: string;
        };
        Update: {
          id?: string;
          repository_id?: string;
          user_id?: string;
          type?: 'readme' | 'api' | 'architecture' | 'security' | 'full';
          title?: string;
          content?: string | null;
          format?: 'markdown' | 'html' | 'pdf';
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          repository_id: string | null;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          repository_id?: string | null;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          repository_id?: string | null;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: string;
          title: string;
          message?: string | null;
          read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Repository = Database['public']['Tables']['repositories']['Row'];
export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type Issue = Database['public']['Tables']['issues']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
