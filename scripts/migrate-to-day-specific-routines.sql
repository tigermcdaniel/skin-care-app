-- Migration script to convert shared routines to day-specific routines
-- This will create 7 copies of each existing routine (one for each day of the week)

DO $$
DECLARE
    routine_record RECORD;
    step_record RECORD;
    new_routine_id UUID;
    day_num INTEGER;
BEGIN
    -- Loop through each existing routine that doesn't have a day_of_week set
    FOR routine_record IN 
        SELECT * FROM routines WHERE day_of_week IS NULL AND is_active = true
    LOOP
        -- Create 7 day-specific versions of this routine (Sunday=0 to Saturday=6)
        FOR day_num IN 0..6 LOOP
            -- Generate new UUID for the day-specific routine
            new_routine_id := gen_random_uuid();
            
            -- Insert new day-specific routine
            INSERT INTO routines (
                id, 
                user_id, 
                type, 
                name, 
                is_active, 
                day_of_week,
                created_at, 
                updated_at
            ) VALUES (
                new_routine_id,
                routine_record.user_id,
                routine_record.type,
                routine_record.name || ' - ' || 
                CASE day_num
                    WHEN 0 THEN 'Sunday'
                    WHEN 1 THEN 'Monday'
                    WHEN 2 THEN 'Tuesday'
                    WHEN 3 THEN 'Wednesday'
                    WHEN 4 THEN 'Thursday'
                    WHEN 5 THEN 'Friday'
                    WHEN 6 THEN 'Saturday'
                END,
                true,
                day_num,
                NOW(),
                NOW()
            );
            
            -- Copy all routine steps for this day-specific routine
            FOR step_record IN 
                SELECT * FROM routine_steps WHERE routine_id = routine_record.id
            LOOP
                INSERT INTO routine_steps (
                    id,
                    routine_id,
                    product_id,
                    step_order,
                    instructions,
                    amount,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    new_routine_id,
                    step_record.product_id,
                    step_record.step_order,
                    step_record.instructions,
                    step_record.amount,
                    NOW()
                );
            END LOOP;
        END LOOP;
        
        -- Deactivate the original shared routine
        UPDATE routines 
        SET is_active = false, updated_at = NOW()
        WHERE id = routine_record.id;
        
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;
