-- Seed the products table with common skincare products
-- This provides a starter catalog of popular skincare products

INSERT INTO public.products (name, brand, category, subcategory, ingredients, description, price, size) VALUES
-- Cleansers
('Hydrating Foaming Oil Cleanser', 'CeraVe', 'cleanser', 'oil cleanser', ARRAY['Caprylic/Capric Triglyceride', 'Cocamidopropyl Hydroxysultaine', 'Sodium Cocoyl Isethionate', 'Ceramides', 'Hyaluronic Acid'], 'Gentle oil cleanser that removes makeup and impurities while maintaining skin barrier', 15.99, '236ml'),
('Daily Facial Cleanser', 'CeraVe', 'cleanser', 'gel cleanser', ARRAY['Ceramides', 'Hyaluronic Acid', 'Niacinamide'], 'Non-foaming gel cleanser for normal to oily skin', 12.99, '236ml'),
('Ultra Gentle Daily Cleanser', 'Neutrogena', 'cleanser', 'cream cleanser', ARRAY['Glycerin', 'Cetyl Alcohol', 'Stearyl Alcohol'], 'Fragrance-free cleanser for sensitive skin', 8.99, '354ml'),

-- Moisturizers
('Daily Facial Moisturizing Lotion', 'CeraVe', 'moisturizer', 'day moisturizer', ARRAY['Ceramides', 'Hyaluronic Acid', 'MVE Technology'], 'Lightweight daily moisturizer with SPF 30', 13.99, '89ml'),
('PM Facial Moisturizing Lotion', 'CeraVe', 'moisturizer', 'night moisturizer', ARRAY['Ceramides', 'Hyaluronic Acid', 'Niacinamide', 'MVE Technology'], 'Rich night moisturizer for overnight repair', 16.99, '89ml'),
('Dramatically Different Moisturizing Lotion+', 'Clinique', 'moisturizer', 'day moisturizer', ARRAY['Glycerin', 'Urea', 'Sodium Hyaluronate'], 'Oil-free moisturizer for combination to oily skin', 29.50, '125ml'),

-- Serums
('Hyaluronic Acid 2% + B5', 'The Ordinary', 'serum', 'hydrating serum', ARRAY['Sodium Hyaluronate', 'Panthenol (Pro-Vitamin B5)'], 'Multi-molecular hyaluronic acid serum for intense hydration', 8.90, '30ml'),
('Niacinamide 10% + Zinc 1%', 'The Ordinary', 'serum', 'treatment serum', ARRAY['Niacinamide', 'Zinc PCA'], 'High-strength vitamin and mineral blemish formula', 6.90, '30ml'),
('Vitamin C + E Ferulic Acid Serum', 'Skinceuticals', 'serum', 'antioxidant serum', ARRAY['L-Ascorbic Acid', 'Alpha Tocopherol', 'Ferulic Acid'], 'Antioxidant serum for environmental protection', 169.00, '30ml'),

-- Sunscreens
('Ultra Light Daily Fluid SPF 60', 'La Roche-Posay', 'sunscreen', 'chemical sunscreen', ARRAY['Avobenzone', 'Homosalate', 'Octisalate', 'Octocrylene'], 'Lightweight daily sunscreen for face', 19.99, '60ml'),
('Mineral Sunscreen SPF 30', 'EltaMD', 'sunscreen', 'mineral sunscreen', ARRAY['Zinc Oxide', 'Titanium Dioxide'], 'Broad-spectrum mineral sunscreen', 37.00, '114g'),
('Anthelios Melt-in Milk Sunscreen SPF 100', 'La Roche-Posay', 'sunscreen', 'chemical sunscreen', ARRAY['Avobenzone', 'Homosalate', 'Octisalate', 'Octocrylene', 'Oxybenzone'], 'Very high protection sunscreen', 35.99, '150ml'),

-- Treatments
('Retinol 0.5% in Squalane', 'The Ordinary', 'treatment', 'retinol', ARRAY['Retinol', 'Squalane'], 'Mid-strength retinol for experienced users', 10.90, '30ml'),
('Salicylic Acid 2% Solution', 'The Ordinary', 'treatment', 'exfoliant', ARRAY['Salicylic Acid'], 'Beta hydroxy acid for blemish-prone skin', 7.90, '30ml'),
('Glycolic Acid 7% Toning Solution', 'The Ordinary', 'treatment', 'exfoliant', ARRAY['Glycolic Acid', 'Amino Acids', 'Aloe Vera', 'Ginseng'], 'Alpha hydroxy acid toner for radiance', 8.90, '240ml'),

-- Eye Care
('Eye Repair Cream', 'CeraVe', 'eye care', 'eye cream', ARRAY['Ceramides', 'Hyaluronic Acid', 'Niacinamide', 'Marine and Botanical Complex'], 'Firming eye cream for fine lines', 19.99, '14.2g'),
('Caffeine Solution 5% + EGCG', 'The Ordinary', 'eye care', 'eye serum', ARRAY['Caffeine', 'Epigallocatechin Gallatyl Glucoside'], 'Eye serum for puffiness and dark circles', 7.90, '30ml'),

-- Masks
('Ultra Repair Cream Intense Hydration', 'First Aid Beauty', 'mask', 'hydrating mask', ARRAY['Colloidal Oatmeal', 'Shea Butter', 'Ceramides'], 'Intensive hydrating treatment mask', 36.00, '170g'),
('AHA 30% + BHA 2% Peeling Solution', 'The Ordinary', 'mask', 'chemical peel', ARRAY['Glycolic Acid', 'Lactic Acid', 'Salicylic Acid'], 'High-strength weekly chemical peel', 8.50, '30ml')

ON CONFLICT DO NOTHING;
