-- Align Supabase schema to match the app expectations (idempotent/safe)
-- Run this in Supabase SQL Editor

-- 0) Extensions (uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Agents table: ensure required columns exist
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed without them
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure FK to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='agents' AND constraint_type='FOREIGN KEY' AND constraint_name='agents_user_id_fkey'
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 2) Agent configurations table
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  run_policy VARCHAR(20) NOT NULL DEFAULT 'always',
  sample_rate_pct INTEGER NOT NULL DEFAULT 100 CHECK (sample_rate_pct >= 0 AND sample_rate_pct <= 100),
  obfuscate_pii BOOLEAN NOT NULL DEFAULT false,
  max_eval_per_day INTEGER NOT NULL DEFAULT 1000 CHECK (max_eval_per_day >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns (if pre-existing)
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.agent_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='agent_configs' AND constraint_type='FOREIGN KEY' AND constraint_name='agent_configs_agent_id_fkey'
  ) THEN
    ALTER TABLE public.agent_configs
      ADD CONSTRAINT agent_configs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='agent_configs' AND constraint_type='FOREIGN KEY' AND constraint_name='agent_configs_user_id_fkey'
  ) THEN
    ALTER TABLE public.agent_configs
      ADD CONSTRAINT agent_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 3) Evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  interaction_id VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  flags JSONB,
  pii_tokens_redacted INTEGER DEFAULT 0 CHECK (pii_tokens_redacted >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='evaluations' AND constraint_type='FOREIGN KEY' AND constraint_name='evaluations_agent_id_fkey'
  ) THEN
    ALTER TABLE public.evaluations
      ADD CONSTRAINT evaluations_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='evaluations' AND constraint_type='FOREIGN KEY' AND constraint_name='evaluations_user_id_fkey'
  ) THEN
    ALTER TABLE public.evaluations
      ADD CONSTRAINT evaluations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 4) Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_id ON public.agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_agent_id ON public.agent_configs(agent_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON public.evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_agent_id ON public.evaluations(agent_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON public.evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_created ON public.evaluations(user_id, created_at DESC);

-- 5) RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid duplicates
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agents' AND policyname='Users can view their own agents') THEN
    DROP POLICY "Users can view their own agents" ON public.agents;
  END IF;
END $$;
CREATE POLICY "Users can view their own agents" ON public.agents FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agents' AND policyname='Users can insert their own agents') THEN
    DROP POLICY "Users can insert their own agents" ON public.agents;
  END IF;
END $$;
CREATE POLICY "Users can insert their own agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agents' AND policyname='Users can update their own agents') THEN
    DROP POLICY "Users can update their own agents" ON public.agents;
  END IF;
END $$;
CREATE POLICY "Users can update their own agents" ON public.agents FOR UPDATE USING (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agents' AND policyname='Users can delete their own agents') THEN
    DROP POLICY "Users can delete their own agents" ON public.agents;
  END IF;
END $$;
CREATE POLICY "Users can delete their own agents" ON public.agents FOR DELETE USING (auth.uid() = user_id);

-- agent_configs
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_configs' AND policyname='Users can view their own agent configs') THEN
    DROP POLICY "Users can view their own agent configs" ON public.agent_configs;
  END IF;
END $$;
CREATE POLICY "Users can view their own agent configs" ON public.agent_configs FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_configs' AND policyname='Users can insert their own agent configs') THEN
    DROP POLICY "Users can insert their own agent configs" ON public.agent_configs;
  END IF;
END $$;
CREATE POLICY "Users can insert their own agent configs" ON public.agent_configs FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_configs' AND policyname='Users can update their own agent configs') THEN
    DROP POLICY "Users can update their own agent configs" ON public.agent_configs;
  END IF;
END $$;
CREATE POLICY "Users can update their own agent configs" ON public.agent_configs FOR UPDATE USING (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_configs' AND policyname='Users can delete their own agent configs') THEN
    DROP POLICY "Users can delete their own agent configs" ON public.agent_configs;
  END IF;
END $$;
CREATE POLICY "Users can delete their own agent configs" ON public.agent_configs FOR DELETE USING (auth.uid() = user_id);

-- evaluations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='evaluations' AND policyname='Users can view their own evaluations') THEN
    DROP POLICY "Users can view their own evaluations" ON public.evaluations;
  END IF;
END $$;
CREATE POLICY "Users can view their own evaluations" ON public.evaluations FOR SELECT USING (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='evaluations' AND policyname='Users can insert their own evaluations') THEN
    DROP POLICY "Users can insert their own evaluations" ON public.evaluations;
  END IF;
END $$;
CREATE POLICY "Users can insert their own evaluations" ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='evaluations' AND policyname='Users can update their own evaluations') THEN
    DROP POLICY "Users can update their own evaluations" ON public.evaluations;
  END IF;
END $$;
CREATE POLICY "Users can update their own evaluations" ON public.evaluations FOR UPDATE USING (auth.uid() = user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='evaluations' AND policyname='Users can delete their own evaluations') THEN
    DROP POLICY "Users can delete their own evaluations" ON public.evaluations;
  END IF;
END $$;
CREATE POLICY "Users can delete their own evaluations" ON public.evaluations FOR DELETE USING (auth.uid() = user_id);

-- 6) Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers (drop-if-exists to avoid duplicates)
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_configs_updated_at ON public.agent_configs;
CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON public.agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Optional cleanup: If you previously created legacy tables not used by this app, you may drop them after confirming no data is needed.
-- DROP TABLE IF EXISTS public.eval_results CASCADE;
-- DROP TABLE IF EXISTS public.evals CASCADE;
-- DROP TABLE IF EXISTS public.ai_agents CASCADE;
