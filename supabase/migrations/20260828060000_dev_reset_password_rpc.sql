-- RPC for development password recovery without SMS provider
CREATE OR REPLACE FUNCTION public.dev_reset_password(
  p_phone text,
  p_code text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id uuid;
  v_normalized_phone text;
  v_clean text;
BEGIN
  -- 1. Validate Development Master Recovery Code
  IF p_code IS NULL OR trim(p_code) NOT IN ('AGT7799', 'AGT-RECOVER-2026') THEN
    RETURN jsonb_build_object('success', false, 'error', 'अमान्य रिकवरी कोड। कृपया सही कोड (AGT7799) दर्ज करें।');
  END IF;

  -- 2. Validate Password Length
  IF length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
  END IF;

  -- 3. Normalize Phone Number
  v_clean := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_clean) = 10 THEN
    v_normalized_phone := '+91' || v_clean;
  ELSIF length(v_clean) = 12 AND v_clean LIKE '91%' THEN
    v_normalized_phone := '+' || v_clean;
  ELSE
    v_normalized_phone := '+' || v_clean;
  END IF;

  -- 4. Find matching user in auth.users
  SELECT id INTO v_user_id FROM auth.users
  WHERE phone = v_normalized_phone OR phone = v_clean OR phone = ('91' || right(v_clean, 10))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'इस मोबाइल नंबर से कोई पंजीकृत खाता नहीं मिला। कृपया पहले नया खाता बनाएं।');
  END IF;

  -- 5. Update auth.users password using standard pgcrypto bcrypt hash
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'पासवर्ड सफलतापूर्वक बदल गया! कृपया नए पासवर्ड के साथ लॉगिन करें।'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dev_reset_password(text, text, text) TO anon, authenticated;
