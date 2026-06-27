-- Supabase Schema for FlowMind

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  code TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  description TEXT,
  deadline TEXT,
  leader_name TEXT NOT NULL,
  group_chat_name TEXT,
  created_by TEXT REFERENCES public.users(email),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Teams (Join table for User -> Team)
CREATE TABLE IF NOT EXISTS public.user_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  role TEXT NOT NULL,
  source TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, team_code)
);

-- Team Members (Denormalized array data from local storage)
CREATE TABLE IF NOT EXISTS public.team_members (
  id TEXT PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'todo',
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  deadline TEXT,
  priority TEXT,
  task_type TEXT,
  assignment_reason TEXT,
  meeting_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Updates
CREATE TABLE IF NOT EXISTS public.task_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decisions
CREATE TABLE IF NOT EXISTS public.decisions (
  id TEXT PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  reason TEXT,
  impact TEXT,
  involved_people TEXT,
  meeting_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id TEXT PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT,
  attendees JSONB,
  leader TEXT,
  agenda TEXT,
  duration NUMERIC DEFAULT 0,
  summary TEXT,
  key_topics JSONB,
  transcript TEXT,
  follow_up_items JSONB,
  status TEXT DEFAULT 'completed',
  active_attendees JSONB DEFAULT '[]'::jsonb,
  memory_stored BOOLEAN DEFAULT TRUE,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: If table already exists, add new columns
-- Run this in the Supabase SQL editor:
-- ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS leader TEXT;
-- ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS agenda TEXT;

-- Member Profiles
CREATE TABLE IF NOT EXISTS public.member_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  profile_data JSONB,
  UNIQUE(team_code, member_name)
);

-- Memory Feed (UI Feed)
CREATE TABLE IF NOT EXISTS public.memory_feed (
  id TEXT PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  icon TEXT,
  meta JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Chats
CREATE TABLE IF NOT EXISTS public.group_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct Chats
CREATE TABLE IF NOT EXISTS public.direct_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_key TEXT NOT NULL,
  from_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  team_code TEXT REFERENCES public.teams(code) ON DELETE CASCADE,
  team_name TEXT,
  applicant_email TEXT REFERENCES public.users(email),
  applicant_name TEXT NOT NULL,
  applied_role TEXT DEFAULT 'Member',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application Chats
CREATE TABLE IF NOT EXISTS public.application_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id TEXT REFERENCES public.applications(id) ON DELETE CASCADE,
  from_email TEXT,
  from_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Disabled for hackathon/MVP speed since we rely on custom app-level auth
-- Note: In production, you MUST enable RLS and write policies.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_feed DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_chats DISABLE ROW LEVEL SECURITY;

