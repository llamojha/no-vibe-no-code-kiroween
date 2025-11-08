-- Migration: Create saved_frankenstein_ideas table
-- Description: Stores Doctor Frankenstein generated ideas with technology combinations
-- Date: 2025-11-08

-- Create the saved_frankenstein_ideas table
CREATE TABLE IF NOT EXISTS saved_frankenstein_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('companies', 'aws')),
  tech1_name TEXT NOT NULL,
  tech1_description TEXT NOT NULL,
  tech1_category TEXT NOT NULL,
  tech2_name TEXT NOT NULL,
  tech2_description TEXT NOT NULL,
  tech2_category TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_saved_frankenstein_ideas_user_id 
  ON saved_frankenstein_ideas(user_id);

CREATE INDEX idx_saved_frankenstein_ideas_created_at 
  ON saved_frankenstein_ideas(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_frankenstein_ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own ideas
CREATE POLICY "Users can view own ideas"
  ON saved_frankenstein_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own ideas
CREATE POLICY "Users can insert own ideas"
  ON saved_frankenstein_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own ideas
CREATE POLICY "Users can delete own ideas"
  ON saved_frankenstein_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Comment on table
COMMENT ON TABLE saved_frankenstein_ideas IS 'Stores Doctor Frankenstein generated startup ideas with technology combinations';

-- Comment on columns
COMMENT ON COLUMN saved_frankenstein_ideas.mode IS 'Technology source mode: companies or aws';
COMMENT ON COLUMN saved_frankenstein_ideas.tech1_name IS 'First technology name';
COMMENT ON COLUMN saved_frankenstein_ideas.tech1_description IS 'First technology description';
COMMENT ON COLUMN saved_frankenstein_ideas.tech1_category IS 'First technology category';
COMMENT ON COLUMN saved_frankenstein_ideas.tech2_name IS 'Second technology name';
COMMENT ON COLUMN saved_frankenstein_ideas.tech2_description IS 'Second technology description';
COMMENT ON COLUMN saved_frankenstein_ideas.tech2_category IS 'Second technology category';
COMMENT ON COLUMN saved_frankenstein_ideas.analysis IS 'AI-generated analysis in JSON format';
