-- Fix chat_history table schema to properly handle user messages and AI responses
-- Drop the existing table and recreate with better structure

DROP TABLE IF EXISTS public.chat_history CASCADE;

-- Create new chat_history table with proper structure
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- to group messages in a conversation
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'product_recommendation', 'routine_update', 'treatment_suggestion')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "chat_history_select_own" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_history_insert_own" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_history_update_own" ON public.chat_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chat_history_delete_own" ON public.chat_history FOR DELETE USING (auth.uid() = user_id);
