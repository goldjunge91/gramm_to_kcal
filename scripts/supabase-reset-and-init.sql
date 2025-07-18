
-- Drop Tables und Typen
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS posts_table CASCADE;
DROP TYPE IF EXISTS sync_status CASCADE;

-- Optional: Entferne weitere benutzerdefinierte Typen, Tabellen nach Bedarf

-- Automatische Neuerstellung mit RLS und Policies
-- Beispiel: Initialisierung nach Löschung

-- Enum neu anlegen
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');

-- Tabellen neu anlegen
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone VARCHAR(256),
  email VARCHAR(256) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
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
CREATE TABLE posts_table (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- RLS aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_table ENABLE ROW LEVEL SECURITY;

-- Policies setzen
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own ingredients" ON ingredients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ingredients" ON ingredients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ingredients" ON ingredients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ingredients" ON ingredients FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own posts" ON posts_table FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts_table FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts_table FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts_table FOR DELETE USING (auth.uid() = user_id);
