-- Atomic view counts and anonymous-session merge.

CREATE OR REPLACE FUNCTION increment_view_count(p_pack_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE sticker_packs
  SET view_count = view_count + 1
  WHERE id = p_pack_id;
$$;

CREATE OR REPLACE FUNCTION merge_anonymous_session(p_session_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_session_id uuid;
  v_generation_count int;
BEGIN
  SELECT id
  INTO v_existing_session_id
  FROM sessions
  WHERE user_id = p_user_id
  ORDER BY last_active_at DESC
  LIMIT 1;

  IF v_existing_session_id IS NULL THEN
    UPDATE sessions
    SET user_id = p_user_id,
        last_active_at = now()
    WHERE id = p_session_id
      AND user_id IS NULL
    RETURNING id INTO v_existing_session_id;

    IF v_existing_session_id IS NULL THEN
      RETURN NULL;
    END IF;

    UPDATE generations
    SET user_id = p_user_id
    WHERE session_id = p_session_id;

    RETURN v_existing_session_id;
  END IF;

  IF v_existing_session_id = p_session_id THEN
    RETURN v_existing_session_id;
  END IF;

  UPDATE generations
  SET session_id = v_existing_session_id,
      user_id = p_user_id
  WHERE session_id = p_session_id;

  UPDATE uploads
  SET session_id = v_existing_session_id
  WHERE session_id = p_session_id;

  SELECT count(*)::int
  INTO v_generation_count
  FROM generations
  WHERE session_id = v_existing_session_id;

  UPDATE sessions
  SET generation_count = v_generation_count,
      last_active_at = now()
  WHERE id = v_existing_session_id;

  DELETE FROM sessions
  WHERE id = p_session_id
    AND user_id IS NULL;

  RETURN v_existing_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_view_count(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION merge_anonymous_session(uuid, uuid) FROM anon, authenticated;
