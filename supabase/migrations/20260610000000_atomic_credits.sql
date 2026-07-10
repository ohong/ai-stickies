-- Atomic credit mutations and purchase completion.

CREATE OR REPLACE FUNCTION add_credits(p_user_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance int;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_CREDIT_AMOUNT';
  END IF;

  UPDATE profiles
  SET credit_balance = credit_balance + p_amount
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance int;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_CREDIT_AMOUNT';
  END IF;

  UPDATE profiles
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_user_id
    AND credit_balance >= p_amount
  RETURNING credit_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION complete_purchase(p_purchase_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase purchases%ROWTYPE;
  v_balance int;
BEGIN
  SELECT *
  INTO v_purchase
  FROM purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PURCHASE_NOT_FOUND';
  END IF;

  IF v_purchase.status = 'completed' THEN
    SELECT credit_balance INTO v_balance
    FROM profiles
    WHERE id = v_purchase.user_id;

    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;

    RETURN v_balance;
  END IF;

  UPDATE profiles
  SET credit_balance = credit_balance + v_purchase.credits_purchased
  WHERE id = v_purchase.user_id
  RETURNING credit_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  UPDATE purchases
  SET status = 'completed'
  WHERE id = p_purchase_id;

  RETURN v_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION add_credits(uuid, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION deduct_credits(uuid, int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION complete_purchase(uuid) FROM anon, authenticated;
