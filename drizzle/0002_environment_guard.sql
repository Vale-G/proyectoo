-- No production data is changed. New databases default to production-safe refusal in Preview.
CREATE TABLE IF NOT EXISTS public.omnifix_environment (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  kind text NOT NULL DEFAULT 'production' CHECK (kind IN ('production','preview'))
);
INSERT INTO public.omnifix_environment(id,kind) VALUES(true,'production') ON CONFLICT DO NOTHING;
ALTER TABLE public.omnifix_environment ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.omnifix_environment FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.omnifix_environment FROM authenticated; END IF;
END $$;
