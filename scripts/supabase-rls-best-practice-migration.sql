-- Supabase RLS Policy Optimierung: Best Practice Migration
-- Siehe: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- INGREDIENTS
ALTER POLICY "Users can view own ingredients" ON public.ingredients
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can insert own ingredients" ON public.ingredients
WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can update own ingredients" ON public.ingredients
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can delete own ingredients" ON public.ingredients
USING (user_id = (SELECT auth.uid()));

-- PRODUCTS
ALTER POLICY "Users can view own products" ON public.products
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can insert own products" ON public.products
WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can update own products" ON public.products
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can delete own products" ON public.products
USING (user_id = (SELECT auth.uid()));

-- RECIPES
ALTER POLICY "Users can view own recipes" ON public.recipes
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can insert own recipes" ON public.recipes
WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can update own recipes" ON public.recipes
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can delete own recipes" ON public.recipes
USING (user_id = (SELECT auth.uid()));

-- POSTS_TABLE
ALTER POLICY "Users can view own posts" ON public.posts_table
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can insert own posts" ON public.posts_table
WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can update own posts" ON public.posts_table
USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users can delete own posts" ON public.posts_table
USING (user_id = (SELECT auth.uid()));

-- USERS (Profile)
ALTER POLICY "Users can view own profile" ON public.users
USING (id = (SELECT auth.uid()));

ALTER POLICY "Users can insert own profile" ON public.users
WITH CHECK (id = (SELECT auth.uid()));

ALTER POLICY "Users can update own profile" ON public.users
USING (id = (SELECT auth.uid()));
