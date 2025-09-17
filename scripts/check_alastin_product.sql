-- Check if Alastin Ultra Lite Moisturizer was added to the database
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.created_at,
    ui.id as inventory_id,
    ui.user_id,
    ui.notes,
    ui.created_at as added_to_inventory_at
FROM products p
LEFT JOIN user_inventory ui ON p.id = ui.product_id
WHERE p.name ILIKE '%alastin%' 
   OR p.name ILIKE '%ultra lite%'
   OR p.name ILIKE '%moisturizer%'
   OR (p.brand ILIKE '%alastin%' AND p.category ILIKE '%moisturizer%')
ORDER BY p.created_at DESC, ui.created_at DESC;

-- Also check for the generic AI Recommendation product that might have been updated
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.created_at,
    ui.id as inventory_id,
    ui.user_id,
    ui.notes,
    ui.created_at as added_to_inventory_at
FROM products p
LEFT JOIN user_inventory ui ON p.id = ui.product_id
WHERE p.name = 'AI Recommendation'
ORDER BY ui.created_at DESC;
