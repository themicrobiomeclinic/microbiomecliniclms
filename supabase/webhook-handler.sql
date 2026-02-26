-- ============================================================
-- SHOPIFY WEBHOOK HANDLER
-- Run this in Supabase SQL Editor AFTER the main schema
-- 
-- This creates a database function that can be called via 
-- Supabase's REST API when Shopify sends a purchase webhook.
-- ============================================================

-- Function to grant course access after Shopify purchase
CREATE OR REPLACE FUNCTION public.grant_course_access(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_shopify_order_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Check if user already exists in profiles
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = LOWER(p_email);

  IF v_user_id IS NOT NULL THEN
    -- User exists — just grant access
    UPDATE profiles
    SET 
      has_course_access = TRUE,
      shopify_order_id = COALESCE(p_shopify_order_id, shopify_order_id),
      full_name = COALESCE(p_full_name, full_name),
      updated_at = NOW()
    WHERE id = v_user_id;

    v_result := jsonb_build_object(
      'status', 'updated',
      'user_id', v_user_id,
      'message', 'Existing user granted course access'
    );
  ELSE
    -- New user — they'll need to sign up via the app
    -- We create a placeholder profile that will be linked on signup
    -- For now, return instructions
    v_result := jsonb_build_object(
      'status', 'new_user',
      'email', LOWER(p_email),
      'message', 'User does not have an account yet. Welcome email should prompt signup.'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the service role (for webhook calls)
GRANT EXECUTE ON FUNCTION public.grant_course_access TO service_role;
