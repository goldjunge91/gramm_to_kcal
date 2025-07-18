-- Run this SQL in your Supabase SQL Editor
-- This will update your database schema to work with the new UUID-based user system

-- Step 1: Drop existing tables (this will remove all data - only do this in development!)
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Drop and recreate sync_status enum
DROP TYPE IF EXISTS sync_status CASCADE;
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');

-- Step 3: Create users table with UUID primary key (matching Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone VARCHAR(256),
  email VARCHAR(256) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 4: Create recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  sync_status sync_status DEFAULT 'synced' NOT NULL,
  last_sync_at TIMESTAMP,
  version INTEGER DEFAULT 1 NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  name TEXT NOT NULL,
  original_portions INTEGER NOT NULL,
  description TEXT
);

-- Step 5: Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  sync_status sync_status DEFAULT 'synced' NOT NULL,
  last_sync_at TIMESTAMP,
  version INTEGER DEFAULT 1 NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  kcal REAL NOT NULL
);

-- Step 6: Create ingredients table
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  sync_status sync_status DEFAULT 'synced' NOT NULL,
  last_sync_at TIMESTAMP,
  version INTEGER DEFAULT 1 NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL
);

-- Step 7: Create indexes for better performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_ingredients_user_id ON ingredients(user_id);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_sync_status ON products(sync_status);
CREATE INDEX idx_recipes_sync_status ON recipes(sync_status);
CREATE INDEX idx_ingredients_sync_status ON ingredients(sync_status);

-- Step 8: Enable Row Level Security (RLS) for multi-user support
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Ingredients policies
CREATE POLICY "Users can view own ingredients" ON ingredients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ingredients" ON ingredients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ingredients" ON ingredients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ingredients" ON ingredients FOR DELETE USING (auth.uid() = user_id);
