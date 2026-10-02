-- Credit and quota mutations are server-only. Revoking named roles alone leaves
-- PostgreSQL's default PUBLIC execute grant in place.
REVOKE EXECUTE ON FUNCTION add_credits(uuid, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION deduct_credits(uuid, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION complete_purchase(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_view_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION merge_anonymous_session(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION add_credits(uuid, int), deduct_credits(uuid, int), complete_purchase(uuid), increment_view_count(uuid), merge_anonymous_session(uuid, uuid) TO service_role;

ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Profile owners may edit display fields, never their own balance or billing ID.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles, public.credit_packs, public.purchases TO service_role;
GRANT SELECT ON public.credit_packs TO anon, authenticated;
GRANT SELECT ON public.purchases TO authenticated;
ALTER POLICY "Users can update own profile" ON public.profiles TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
ALTER POLICY "Users can update own sessions" ON public.sessions TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
REVOKE UPDATE ON public.sessions FROM anon, authenticated;

-- Backfill accounts created before profile provisioning was installed.
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
