-- Updated check for Alastin Ultra Lite Moisturizer after API fix
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.description,
    p.created_at,
    ui.id as inventory_id,
    ui.user_id,
    ui.notes,
    ui.amount_remaining,
    ui.created_at as added_to_inventory_at
FROM products p
LEFT JOIN user_inventory ui ON p.id = ui.product_id
WHERE p.name ILIKE '%alastin%' 
   OR p.name ILIKE '%ultra lite%'
   OR p.name ILIKE '%moisturizer%'
   OR (p.brand ILIKE '%alastin%')
ORDER BY p.created_at DESC, ui.created_at DESC;

-- Check all recent inventory additions
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    ui.id as inventory_id,
    ui.user_id,
    ui.notes,
    ui.amount_remaining,
    ui.created_at as added_to_inventory_at
FROM products p
JOIN user_inventory ui ON p.id = ui.product_id
WHERE ui.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY ui.created_at DESC;
