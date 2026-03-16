-- WS1: Authentication & Session Migration
-- Adds user_id to sessions/generations, creates profiles table, adds RLS policies

-- 1. Add user_id column to sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);

-- 2. Add user_id column to generations
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);

-- 3. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Enable RLS on all relevant tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 7. RLS policies for sessions
-- Authenticated users can see their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. RLS policies for generations
CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

-- 9. RLS policies for uploads
CREATE POLICY "Users can view own uploads"
  ON public.uploads FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
  );

-- 10. RLS policies for sticker_packs
CREATE POLICY "Users can view own sticker_packs"
  ON public.sticker_packs FOR SELECT
  USING (
    generation_id IN (
      SELECT id FROM public.generations WHERE user_id = auth.uid()
    )
  );

-- 11. RLS policies for stickers
CREATE POLICY "Users can view own stickers"
  ON public.stickers FOR SELECT
  USING (
    pack_id IN (
      SELECT sp.id FROM public.sticker_packs sp
      JOIN public.generations g ON sp.generation_id = g.id
      WHERE g.user_id = auth.uid()
    )
  );

-- Note: The admin client (service role key) bypasses RLS,
-- so existing server-side code using createAdminClient() continues to work.
-- These policies protect direct client-side access via the anon key.
