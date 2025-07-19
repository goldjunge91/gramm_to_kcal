-- Entfernt alle relevanten Tabellen, Typen, Indizes und Policies aus der Datenbank
-- ACHTUNG: Dieses Skript löscht alle Daten unwiderruflich!

-- Drop Policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can view own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can insert own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can update own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can delete own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can view own posts" ON posts_table;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts_table;
DROP POLICY IF EXISTS "Users can update own posts" ON posts_table;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts_table;

-- Drop Indexes
DROP INDEX IF EXISTS idx_products_user_id;
DROP INDEX IF EXISTS idx_recipes_user_id;
DROP INDEX IF EXISTS idx_ingredients_user_id;
DROP INDEX IF EXISTS idx_ingredients_recipe_id;
DROP INDEX IF EXISTS idx_sync_status;
DROP INDEX IF EXISTS idx_recipes_sync_status;
DROP INDEX IF EXISTS idx_ingredients_sync_status;

-- Drop Tables
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS posts_table CASCADE;

-- Drop Types
DROP TYPE IF EXISTS sync_status CASCADE;

-- Optional: Entferne weitere benutzerdefinierte Typen, Tabellen oder Policies nach Bedarf

-- Hinweis: Policies werden automatisch mit den Tabellen gelöscht, aber explizites Entfernen ist sicherer.
