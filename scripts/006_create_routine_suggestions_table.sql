-- Create routine_suggestions table for tracking pending routine approvals
CREATE TABLE IF NOT EXISTS routine_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  weekly_schedule JSONB NOT NULL,
  reasoning TEXT,
  suggestion_type TEXT NOT NULL DEFAULT 'weekly',
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  denied_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_routine_suggestions_user_status ON routine_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_routine_suggestions_created_at ON routine_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE routine_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own routine suggestions" ON routine_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine suggestions" ON routine_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine suggestions" ON routine_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine suggestions" ON routine_suggestions
  FOR DELETE USING (auth.uid() = user_id);
