-- Create default morning and evening routines for users
INSERT INTO routines (user_id, name, type, description, is_active, created_at, updated_at)
SELECT 
  auth.uid(),
  'Morning Routine',
  'morning',
  'Your daily morning skincare routine',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM routines 
  WHERE user_id = auth.uid() AND type = 'morning'
);

INSERT INTO routines (user_id, name, type, description, is_active, created_at, updated_at)
SELECT 
  auth.uid(),
  'Evening Routine',
  'evening', 
  'Your daily evening skincare routine',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM routines 
  WHERE user_id = auth.uid() AND type = 'evening'
);

-- Add default steps for morning routine
INSERT INTO routine_steps (routine_id, step_order, product_name, instructions, created_at, updated_at)
SELECT 
  r.id,
  1,
  'Cleanser',
  'Gently cleanse your face with lukewarm water',
  now(),
  now()
FROM routines r
WHERE r.user_id = auth.uid() 
  AND r.type = 'morning'
  AND NOT EXISTS (
    SELECT 1 FROM routine_steps rs WHERE rs.routine_id = r.id
  );

INSERT INTO routine_steps (routine_id, step_order, product_name, instructions, created_at, updated_at)
SELECT 
  r.id,
  2,
  'Moisturizer',
  'Apply moisturizer evenly across your face and neck',
  now(),
  now()
FROM routines r
WHERE r.user_id = auth.uid() 
  AND r.type = 'morning'
  AND NOT EXISTS (
    SELECT 1 FROM routine_steps rs WHERE rs.routine_id = r.id AND rs.step_order = 2
  );

-- Add default steps for evening routine  
INSERT INTO routine_steps (routine_id, step_order, product_name, instructions, created_at, updated_at)
SELECT 
  r.id,
  1,
  'Cleanser',
  'Remove makeup and cleanse thoroughly',
  now(),
  now()
FROM routines r
WHERE r.user_id = auth.uid() 
  AND r.type = 'evening'
  AND NOT EXISTS (
    SELECT 1 FROM routine_steps rs WHERE rs.routine_id = r.id
  );

INSERT INTO routine_steps (routine_id, step_order, product_name, instructions, created_at, updated_at)
SELECT 
  r.id,
  2,
  'Night Moisturizer',
  'Apply a richer night moisturizer before bed',
  now(),
  now()
FROM routines r
WHERE r.user_id = auth.uid() 
  AND r.type = 'evening'
  AND NOT EXISTS (
    SELECT 1 FROM routine_steps rs WHERE rs.routine_id = r.id AND rs.step_order = 2
  );
