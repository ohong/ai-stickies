-- Production readiness fixes for quota reservation, pack locks, and refunds.

ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS pack_generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS pack_credit_cost integer NOT NULL DEFAULT 0 CHECK (pack_credit_cost >= 0),
  ADD COLUMN IF NOT EXISTS pack_credits_refunded integer NOT NULL DEFAULT 0 CHECK (pack_credits_refunded >= 0);

UPDATE credit_packs
SET is_active = false
WHERE stripe_price_id ILIKE '%placeholder%';

CREATE OR REPLACE FUNCTION reserve_session_generations(
  p_session_id uuid,
  p_amount integer DEFAULT 1
)
RETURNS TABLE(generation_count integer, max_generations integer, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_count integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_GENERATION_AMOUNT';
  END IF;

  RETURN QUERY
  UPDATE sessions AS s
  SET generation_count = s.generation_count + p_amount,
      last_active_at = now()
  WHERE s.id = p_session_id
    AND s.generation_count + p_amount <= s.max_generations
  RETURNING
    s.generation_count,
    s.max_generations,
    s.max_generations - s.generation_count;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION refund_session_generations(
  p_session_id uuid,
  p_amount integer DEFAULT 1
)
RETURNS TABLE(generation_count integer, max_generations integer, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_count integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_GENERATION_AMOUNT';
  END IF;

  RETURN QUERY
  UPDATE sessions AS s
  SET generation_count = greatest(s.generation_count - p_amount, 0),
      last_active_at = now()
  WHERE s.id = p_session_id
  RETURNING
    s.generation_count,
    s.max_generations,
    s.max_generations - s.generation_count;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION start_pack_generation(
  p_generation_id uuid,
  p_session_id uuid,
  p_user_id uuid,
  p_pack_count integer
)
RETURNS generations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_generation generations%ROWTYPE;
  v_balance integer;
  v_reserved record;
BEGIN
  IF p_pack_count <= 0 THEN
    RAISE EXCEPTION 'INVALID_PACK_COUNT';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT *
  INTO v_generation
  FROM generations
  WHERE id = p_generation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GENERATION_NOT_FOUND';
  END IF;

  IF v_generation.status = 'processing' THEN
    RAISE EXCEPTION 'GENERATION_ALREADY_PROCESSING';
  END IF;

  IF NOT (
    v_generation.user_id = p_user_id
    OR (p_session_id IS NOT NULL AND v_generation.session_id = p_session_id)
  ) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT *
  INTO v_reserved
  FROM reserve_session_generations(v_generation.session_id, p_pack_count);

  UPDATE profiles
  SET credit_balance = credit_balance - p_pack_count
  WHERE id = p_user_id
    AND credit_balance >= p_pack_count
  RETURNING credit_balance INTO v_balance;

  IF v_balance IS NULL THEN
    PERFORM refund_session_generations(v_generation.session_id, p_pack_count);
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  UPDATE generations
  SET status = 'processing',
      user_id = coalesce(user_id, p_user_id),
      completed_at = NULL,
      pack_generation_started_at = now(),
      pack_credit_cost = p_pack_count,
      pack_credits_refunded = 0
  WHERE id = p_generation_id
  RETURNING * INTO v_generation;

  RETURN v_generation;
END;
$$;

CREATE OR REPLACE FUNCTION refund_pack_generation(
  p_generation_id uuid,
  p_amount integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_generation generations%ROWTYPE;
  v_refund integer;
BEGIN
  IF p_amount <= 0 THEN
    RETURN 0;
  END IF;

  SELECT *
  INTO v_generation
  FROM generations
  WHERE id = p_generation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GENERATION_NOT_FOUND';
  END IF;

  v_refund := least(
    p_amount,
    greatest(v_generation.pack_credit_cost - v_generation.pack_credits_refunded, 0)
  );

  IF v_refund <= 0 THEN
    RETURN 0;
  END IF;

  IF v_generation.user_id IS NOT NULL THEN
    UPDATE profiles
    SET credit_balance = credit_balance + v_refund
    WHERE id = v_generation.user_id;
  END IF;

  UPDATE sessions
  SET generation_count = greatest(generation_count - v_refund, 0),
      last_active_at = now()
  WHERE id = v_generation.session_id;

  UPDATE generations
  SET pack_credits_refunded = pack_credits_refunded + v_refund
  WHERE id = p_generation_id;

  RETURN v_refund;
END;
$$;

REVOKE EXECUTE ON FUNCTION reserve_session_generations(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION refund_session_generations(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION start_pack_generation(uuid, uuid, uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION refund_pack_generation(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION reserve_session_generations(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION refund_session_generations(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION start_pack_generation(uuid, uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION refund_pack_generation(uuid, integer) TO service_role;
