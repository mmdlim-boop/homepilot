-- HomePilot Seed Data
-- Run AFTER schema.sql
-- Replace 'YOUR_HOUSEHOLD_ID' with actual UUID after creating household

-- ============================================================
-- RECIPES (seeded from Home recipes.gdoc)
-- ============================================================
-- NOTE: After creating a household, run this with the real household_id
-- or use the app's Settings > Recipes to manage your recipe library.

-- You can set this variable or replace it in queries:
-- \set household_id 'YOUR-HOUSEHOLD-UUID-HERE'

-- WESTERN (Monday theme)
-- Recipes from user's saved collection
-- These will be seeded via the app onboarding wizard

-- PANTRY ITEMS (common pantry/spice items to check on planning day)
-- These appear in the helper's pantry check form
-- ============================================================

-- Default pantry items list (stored as app constant, see lib/pantryItems.ts)
-- oyster sauce, soy sauce, fish sauce, sesame oil, dark soy sauce,
-- cooking wine, cornstarch, white pepper, black pepper, salt,
-- sugar, garlic, ginger, onion, spring onion,
-- vegetable oil, chicken stock, dried chilli, bay leaves,
-- pasta, rice, noodles (dried), canned tomatoes, canned coconut milk,
-- curry powder, cumin, paprika, turmeric, coriander powder,
-- olive oil, butter, flour, bread crumbs, panko

-- ============================================================
-- CHORES (seeded from Daily Chores.gdoc)
-- ============================================================
-- Also seeded via onboarding; see app/onboarding for the wizard
-- or manually insert with your household_id below.

-- EXAMPLE INSERT (replace HOUSEHOLD_ID):
/*
insert into chores (household_id, title_en, time_slot, time_label, days_of_week, is_monthly, sort_order) values
-- EVERY DAY
('HOUSEHOLD_ID', 'Wake up + shower', '06:30', 'Morning', '{1,2,3,4,5,6}', false, 1),
('HOUSEHOLD_ID', 'Prepare breakfast', '07:00-09:00', 'Morning', '{1,2,3,4,5,6}', false, 2),
('HOUSEHOLD_ID', 'Prepare baby''s school bag and tea-time snacks', '07:00-09:00', 'Morning', '{1,2,3,4,5,6}', false, 3),
('HOUSEHOLD_ID', 'Get baby ready (sit on toilet / shower / brush teeth)', '07:00-09:00', 'Morning', '{1,2,3,4,5,6}', false, 4),
('HOUSEHOLD_ID', 'Feed baby breakfast', '07:00-09:00', 'Morning', '{1,2,3,4,5,6}', false, 5),
('HOUSEHOLD_ID', 'Take baby to school and return home', '07:00-09:00', 'Morning', '{1,2,3,4,5,6}', false, 6),
('HOUSEHOLD_ID', 'Clear master bedroom and baby''s room (remove diaper, milk bottles and tidy rooms)', '09:00-13:30', 'Morning', '{1,2,3,4,5,6}', false, 7),
('HOUSEHOLD_ID', 'Do dishes', '09:00-13:30', 'Morning', '{1,2,3,4,5,6}', false, 8),
('HOUSEHOLD_ID', 'Laundry — Wash / Hang / Fold / Iron', '09:00-13:30', 'Morning', '{1,2,3,4,5,6}', false, 9),
('HOUSEHOLD_ID', 'Vacuum + steam clean all floors', '09:00-13:30', 'Morning', '{1,2,3,4,5,6}', false, 10),
('HOUSEHOLD_ID', 'Sweep + Wash the outside', '09:00-13:30', 'Morning', '{1,2,3,4,5,6}', false, 11),
('HOUSEHOLD_ID', 'Arrange the shoes outside', '09:00-13:30', 'Morning', '{1,2,3,4,5,6}', false, 12),
-- MONDAY
('HOUSEHOLD_ID', 'Wash two toilets', null, 'Afternoon', '{1}', false, 20),
('HOUSEHOLD_ID', 'Change bedsheets for both rooms', null, 'Afternoon', '{1}', false, 21),
('HOUSEHOLD_ID', 'Change all towels', null, 'Afternoon', '{1}', false, 22),
('HOUSEHOLD_ID', 'Change all rugs in house', null, 'Afternoon', '{1}', false, 23),
('HOUSEHOLD_ID', 'Baby''s room: Mop with Dettol', null, 'Afternoon', '{1}', false, 24),
('HOUSEHOLD_ID', 'Grocery shopping for the week', null, 'Afternoon', '{1}', false, 25),
-- TUESDAY
('HOUSEHOLD_ID', 'Wipe all surfaces — Living room: sofa, TV, radio, fans, lights', null, 'Afternoon', '{2}', false, 30),
('HOUSEHOLD_ID', 'Wipe all surfaces — Bedroom: cupboards, tablet ops', null, 'Afternoon', '{2}', false, 31),
('HOUSEHOLD_ID', 'Tidy wardrobes and cabinets', null, 'Afternoon', '{2}', false, 32),
('HOUSEHOLD_ID', 'Cut fruits from groceries', null, 'Afternoon', '{2}', false, 33),
-- WEDNESDAY
('HOUSEHOLD_ID', 'Wipe gate and door, shoe rack', null, 'Afternoon', '{3}', false, 40),
('HOUSEHOLD_ID', 'Water plants and fill fountain with water', null, 'Afternoon', '{3}', false, 41),
('HOUSEHOLD_ID', 'Deep clean: Kitchen Cabinets — take out appliances, cutlery and ingredients, wipe clean and arrange', null, 'Afternoon', '{3}', true, 42),
('HOUSEHOLD_ID', 'Deep clean: Fridge — take out ingredients, throw away expired food, wipe clean and arrange', null, 'Afternoon', '{3}', true, 43),
('HOUSEHOLD_ID', 'Deep clean: Cutlery drawers — take out cutlery, wipe clear and arrange', null, 'Afternoon', '{3}', true, 44),
('HOUSEHOLD_ID', 'Deep clean: Washing machine — clean out filter', null, 'Afternoon', '{3}', true, 45),
('HOUSEHOLD_ID', 'Deep clean: Dishwasher — clean out filter', null, 'Afternoon', '{3}', true, 46),
-- THURSDAY
('HOUSEHOLD_ID', 'Kitchen: Wipe Microwave, fridge, cabinets', null, 'Afternoon', '{4}', false, 50),
('HOUSEHOLD_ID', 'Clean and wipe service yard', null, 'Afternoon', '{4}', false, 51),
-- FRIDAY
('HOUSEHOLD_ID', 'Wash two toilets', null, 'Afternoon', '{5}', false, 60),
('HOUSEHOLD_ID', 'Clean windows', null, 'Afternoon', '{5}', false, 61),
-- SATURDAY
('HOUSEHOLD_ID', 'Clean office', null, 'Afternoon', '{6}', false, 70),
('HOUSEHOLD_ID', 'Plan meals for following week and send to group chat', null, 'Afternoon', '{6}', false, 71),
('HOUSEHOLD_ID', 'Wash cars', null, 'Afternoon', '{6}', false, 72);
*/
