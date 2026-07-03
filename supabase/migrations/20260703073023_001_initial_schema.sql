/*
# CodePilot AI Initial Schema

## Overview
This migration creates the foundational schema for CodePilot AI - an intelligent software engineering assistant.
The system supports three user roles: Developer, Team Lead, and Admin.

## New Tables

### user_profiles
Extends auth.users with role-based access control and profile information.
- `id` (uuid, PK, references auth.users)
- `email` (text, unique)
- `full_name` (text)
- `avatar_url` (text)
- `role` (text: 'developer' | 'team_lead' | 'admin')
- `skills` (text[])
- `bio` (text)
- `github_username` (text)
- `created_at`, `updated_at` (timestamps)

### repositories
Stores imported/uploaded repositories for analysis.
- `id` (uuid, PK)
- `user_id` (uuid, references user_profiles)
- `name` (text)
- `description` (text)
- `language` (text)
- `framework` (text)
- `source_type` (text: 'github' | 'zip' | 'git_url')
- `source_url` (text)
- `stars` (integer)
- `branches` (integer)
- `commits` (integer)
- `size` (bigint)
- `license` (text)
- `last_analyzed_at` (timestamp)
- `status` (text: 'pending' | 'analyzing' | 'completed' | 'failed')
- `created_at`, `updated_at` (timestamps)

### analyses
Records AI analysis runs on repositories.
- `id` (uuid, PK)
- `repository_id` (uuid, references repositories)
- `user_id` (uuid, references user_profiles)
- `type` (text: 'full' | 'security' | 'architecture' | 'performance' | 'debt')
- `status` (text: 'pending' | 'processing' | 'completed' | 'failed')
- `overall_score` (decimal)
- `security_score` (decimal)
- `maintainability_score` (decimal)
- `performance_score` (decimal)
- `debt_score` (decimal)
- ` findings_count` (integer)
- `started_at`, `completed_at` (timestamps)
- `created_at` (timestamp)

### issues
Individual code issues detected by AI analysis.
- `id` (uuid, PK)
- `analysis_id` (uuid, references analyses)
- `repository_id` (uuid, references repositories)
- `file_path` (text)
- `line_start`, `line_end` (integers)
- `severity` (text: 'critical' | 'high' | 'medium' | 'low' | 'info')
- `category` (text: 'security' | 'performance' | 'maintainability' | 'bug_risk' | 'style')
- `title` (text)
- `description` (text)
- `suggestion` (text)
- `code_snippet` (text)
- `created_at` (timestamp)

### reports
Generated documentation and analysis reports.
- `id` (uuid, PK)
- `repository_id` (uuid, references repositories)
- `user_id` (uuid, references user_profiles)
- `type` (text: 'readme' | 'api' | 'architecture' | 'security' | 'full')
- `title` (text)
- `content` (text)
- `format` (text: 'markdown' | 'html' | 'pdf')
- `created_at` (timestamp)

### chat_sessions
AI chat sessions with repositories.
- `id` (uuid, PK)
- `repository_id` (uuid, references repositories)
- `user_id` (uuid, references user_profiles)
- `title` (text)
- `created_at`, `updated_at` (timestamps)

### chat_messages
Individual messages in chat sessions.
- `id` (uuid, PK)
- `session_id` (uuid, references chat_sessions)
- `role` (text: 'user' | 'assistant')
- `content` (text)
- `created_at` (timestamp)

### notifications
User notifications for analysis completion, security alerts, etc.
- `id` (uuid, PK)
- `user_id` (uuid, references user_profiles)
- `type` (text)
- `title` (text)
- `message` (text)
- `read` (boolean)
- `action_url` (text)
- `created_at` (timestamp)

## Security
- RLS enabled on all tables
- Owner-scoped policies for user-owned data
- Admin role has full access via service role

## Indexes
- user_id columns for efficient queries
- repository_id for analysis lookups
- status columns for filtering
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'developer' CHECK (role IN ('developer', 'team_lead', 'admin')),
  skills text[] DEFAULT '{}',
  bio text,
  github_username text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  language text,
  framework text,
  source_type text NOT NULL CHECK (source_type IN ('github', 'zip', 'git_url')),
  source_url text,
  stars integer DEFAULT 0,
  branches integer DEFAULT 0,
  commits integer DEFAULT 0,
  size bigint DEFAULT 0,
  license text,
  last_analyzed_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('full', 'security', 'architecture', 'performance', 'debt')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  overall_score decimal(5,2),
  security_score decimal(5,2),
  maintainability_score decimal(5,2),
  performance_score decimal(5,2),
  debt_score decimal(5,2),
  findings_count integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  line_start integer,
  line_end integer,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  category text NOT NULL CHECK (category IN ('security', 'performance', 'maintainability', 'bug_risk', 'style')),
  title text NOT NULL,
  description text,
  suggestion text,
  code_snippet text,
  created_at timestamptz DEFAULT now()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('readme', 'api', 'architecture', 'security', 'full')),
  title text NOT NULL,
  content text,
  format text NOT NULL DEFAULT 'markdown' CHECK (format IN ('markdown', 'html', 'pdf')),
  created_at timestamptz DEFAULT now()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES repositories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Repositories policies
DROP POLICY IF EXISTS "select_own_repositories" ON repositories;
CREATE POLICY "select_own_repositories" ON repositories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_repositories" ON repositories;
CREATE POLICY "insert_own_repositories" ON repositories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_repositories" ON repositories;
CREATE POLICY "update_own_repositories" ON repositories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_repositories" ON repositories;
CREATE POLICY "delete_own_repositories" ON repositories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Analyses policies (scoped through repository ownership)
DROP POLICY IF EXISTS "select_own_analyses" ON analyses;
CREATE POLICY "select_own_analyses" ON analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analyses" ON analyses;
CREATE POLICY "insert_own_analyses" ON analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analyses" ON analyses;
CREATE POLICY "update_own_analyses" ON analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Issues policies (inherited from analysis/repository ownership)
DROP POLICY IF EXISTS "select_own_issues" ON issues;
CREATE POLICY "select_own_issues" ON issues FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM analyses WHERE analyses.id = issues.analysis_id AND analyses.user_id = auth.uid())
  );

-- Reports policies
DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Chat sessions policies
DROP POLICY IF EXISTS "select_own_chat_sessions" ON chat_sessions;
CREATE POLICY "select_own_chat_sessions" ON chat_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat_sessions" ON chat_sessions;
CREATE POLICY "insert_own_chat_sessions" ON chat_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_chat_sessions" ON chat_sessions;
CREATE POLICY "update_own_chat_sessions" ON chat_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat_sessions" ON chat_sessions;
CREATE POLICY "delete_own_chat_sessions" ON chat_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Chat messages policies (scoped through session ownership)
DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
  );

-- Notifications policies
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_status ON repositories(status);
CREATE INDEX IF NOT EXISTS idx_analyses_repository_id ON analyses(repository_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_issues_analysis_id ON issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_issues_repository_id ON issues(repository_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_reports_repository_id ON reports(repository_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_repository_id ON chat_sessions(repository_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repositories_updated_at ON repositories;
CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON repositories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();