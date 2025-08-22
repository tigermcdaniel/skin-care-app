-- Create comprehensive database schema for skincare management app
-- This script sets up all necessary tables with proper RLS policies

-- Products table - stores all skincare products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- cleanser, moisturizer, serum, sunscreen, etc.
  subcategory TEXT, -- gel cleanser, cream moisturizer, etc.
  ingredients TEXT[], -- array of ingredients
  description TEXT,
  price DECIMAL(10,2),
  size TEXT, -- 50ml, 1oz, etc.
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User inventory - products that users own
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  purchase_date DATE,
  expiry_date DATE,
  amount_remaining INTEGER DEFAULT 100, -- percentage remaining
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Routines - morning and evening skincare routines
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Morning Routine", "Evening Routine", etc.
  type TEXT NOT NULL CHECK (type IN ('morning', 'evening', 'weekly', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routine steps - products in routines with order
CREATE TABLE IF NOT EXISTS public.routine_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  instructions TEXT, -- "Apply to damp skin", "Wait 20 minutes", etc.
  amount TEXT, -- "2-3 drops", "pea-sized amount", etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals - user's skincare goals and milestones
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress photos - daily check-in photos
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'daily' CHECK (photo_type IN ('daily', 'weekly', 'monthly', 'before', 'after')),
  notes TEXT,
  lighting_conditions TEXT, -- "natural", "indoor", "flash", etc.
  skin_condition_rating INTEGER CHECK (skin_condition_rating >= 1 AND skin_condition_rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily check-ins - track daily skin condition and routine completion
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  morning_routine_completed BOOLEAN DEFAULT false,
  evening_routine_completed BOOLEAN DEFAULT false,
  skin_condition_rating INTEGER CHECK (skin_condition_rating >= 1 AND skin_condition_rating <= 10),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  notes TEXT,
  sleep_hours DECIMAL(3,1),
  water_intake INTEGER, -- glasses of water
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Treatments - professional treatments like botox, lasers, facials
CREATE TABLE IF NOT EXISTS public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- "botox", "laser", "facial", "chemical_peel", etc.
  provider TEXT, -- clinic or practitioner name
  cost DECIMAL(10,2),
  date_performed DATE,
  next_recommended_date DATE,
  notes TEXT,
  results_rating INTEGER CHECK (results_rating >= 1 AND results_rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments - upcoming skincare appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_type TEXT NOT NULL,
  provider TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  cost DECIMAL(10,2),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat history - AI conversations about skincare
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'product_recommendation', 'routine_update', 'treatment_suggestion')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Products table policies (public read access for product catalog)
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert_admin" ON public.products FOR INSERT WITH CHECK (false); -- Admin only
CREATE POLICY "products_update_admin" ON public.products FOR UPDATE USING (false); -- Admin only
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE USING (false); -- Admin only

-- User inventory policies
CREATE POLICY "user_inventory_select_own" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_inventory_insert_own" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_inventory_update_own" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_inventory_delete_own" ON public.user_inventory FOR DELETE USING (auth.uid() = user_id);

-- Routines policies
CREATE POLICY "routines_select_own" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "routines_insert_own" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routines_update_own" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "routines_delete_own" ON public.routines FOR DELETE USING (auth.uid() = user_id);

-- Routine steps policies (access through routine ownership)
CREATE POLICY "routine_steps_select_own" ON public.routine_steps FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_steps.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_steps_insert_own" ON public.routine_steps FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_steps.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_steps_update_own" ON public.routine_steps FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_steps.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_steps_delete_own" ON public.routine_steps FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_steps.routine_id AND routines.user_id = auth.uid()));

-- Goals policies
CREATE POLICY "goals_select_own" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Progress photos policies
CREATE POLICY "progress_photos_select_own" ON public.progress_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_photos_insert_own" ON public.progress_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_photos_update_own" ON public.progress_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "progress_photos_delete_own" ON public.progress_photos FOR DELETE USING (auth.uid() = user_id);

-- Daily check-ins policies
CREATE POLICY "daily_checkins_select_own" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_checkins_insert_own" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_checkins_update_own" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_checkins_delete_own" ON public.daily_checkins FOR DELETE USING (auth.uid() = user_id);

-- Treatments policies
CREATE POLICY "treatments_select_own" ON public.treatments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "treatments_insert_own" ON public.treatments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "treatments_update_own" ON public.treatments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "treatments_delete_own" ON public.treatments FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert_own" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update_own" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "appointments_delete_own" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- Chat history policies
CREATE POLICY "chat_history_select_own" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_history_insert_own" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_history_update_own" ON public.chat_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chat_history_delete_own" ON public.chat_history FOR DELETE USING (auth.uid() = user_id);
