-- Supabase also grants EXECUTE directly to API roles through default privileges.
REVOKE EXECUTE ON FUNCTION reserve_session_generations(uuid, integer), refund_session_generations(uuid, integer), start_pack_generation(uuid, uuid, uuid, integer), refund_pack_generation(uuid, integer) FROM PUBLIC, anon, authenticated;
-- Private data is served by authorized API routes, not anonymous table queries.
REVOKE SELECT ON public.profiles, public.purchases, public.sessions, public.generations, public.uploads, public.style_previews, public.stickers FROM anon;
