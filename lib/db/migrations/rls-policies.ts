// drizzle migration: rls-policies.ts
import { sql } from "drizzle-orm";

export default async function setRlsPolicies(db: any) {
  // RLS aktivieren
  await db.execute(sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);
  await db.execute(sql`ALTER TABLE products ENABLE ROW LEVEL SECURITY;`);
  await db.execute(sql`ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;`);
  await db.execute(sql`ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;`);
  await db.execute(sql`ALTER TABLE posts_table ENABLE ROW LEVEL SECURITY;`);

  // Policies setzen
  await db.execute(
    sql`CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);`,
  );

  await db.execute(
    sql`CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);`,
  );

  await db.execute(
    sql`CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);`,
  );

  await db.execute(
    sql`CREATE POLICY "Users can view own ingredients" ON ingredients FOR SELECT USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can insert own ingredients" ON ingredients FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can update own ingredients" ON ingredients FOR UPDATE USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can delete own ingredients" ON ingredients FOR DELETE USING (auth.uid() = user_id);`,
  );

  await db.execute(
    sql`CREATE POLICY "Users can view own posts" ON posts_table FOR SELECT USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can insert own posts" ON posts_table FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can update own posts" ON posts_table FOR UPDATE USING (auth.uid() = user_id);`,
  );
  await db.execute(
    sql`CREATE POLICY "Users can delete own posts" ON posts_table FOR DELETE USING (auth.uid() = user_id);`,
  );
}
