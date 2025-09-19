-- Add optional location column to appointments table
ALTER TABLE appointments 
ADD COLUMN location TEXT;

-- Add comment to document the column
COMMENT ON COLUMN appointments.location IS 'Optional location where the appointment takes place';
