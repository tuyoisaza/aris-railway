/* Missing Translations Insertion */

INSERT INTO public.translations (lang, key, value)
VALUES
  -- Spanish
  ('es', 'nav_home', 'Inicio'),
  ('es', 'nav_pricing', 'Precios'),
  ('es', 'btn_login', 'Entrar'),
  
  -- English
  ('en', 'nav_home', 'Home'),
  ('en', 'nav_pricing', 'Pricing'),
  ('en', 'btn_login', 'Login'),

  -- Portuguese
  ('pt', 'nav_home', 'Início'),
  ('pt', 'nav_pricing', 'Preços'),
  ('pt', 'btn_login', 'Entrar')
ON CONFLICT (lang, key) DO UPDATE SET value = EXCLUDED.value;
