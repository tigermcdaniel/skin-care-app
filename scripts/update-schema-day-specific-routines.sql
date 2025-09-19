-- Add day_of_week column to routines table to support day-specific routines
ALTER TABLE routines ADD COLUMN day_of_week INTEGER;

-- Add constraint to ensure day_of_week is between 0-6 (Sunday=0, Monday=1, etc.)
ALTER TABLE routines ADD CONSTRAINT check_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Create index for efficient querying by user and day
CREATE INDEX idx_routines_user_day_type ON routines(user_id, day_of_week, type);

-- Update existing routines to have day_of_week = NULL (will be handled by migration script)
-- This allows us to identify old shared routines vs new day-specific ones
