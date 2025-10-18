-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent configurations table
CREATE TABLE agent_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_policy VARCHAR(20) NOT NULL DEFAULT 'always' CHECK (run_policy IN ('always', 'sampled')),
  sample_rate_pct INTEGER NOT NULL DEFAULT 100 CHECK (sample_rate_pct >= 0 AND sample_rate_pct <= 100),
  obfuscate_pii BOOLEAN NOT NULL DEFAULT false,
  max_eval_per_day INTEGER NOT NULL DEFAULT 1000 CHECK (max_eval_per_day >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_id VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  flags JSONB,
  pii_tokens_redacted INTEGER DEFAULT 0 CHECK (pii_tokens_redacted >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agent_configs_user_id ON agent_configs(user_id);
CREATE INDEX idx_agent_configs_agent_id ON agent_configs(agent_id);
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_agent_id ON evaluations(agent_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX idx_evaluations_user_created ON evaluations(user_id, created_at DESC);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Agents RLS policies
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Agent configs RLS policies
CREATE POLICY "Users can view their own agent configs" ON agent_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent configs" ON agent_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent configs" ON agent_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent configs" ON agent_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Evaluations RLS policies
CREATE POLICY "Users can view their own evaluations" ON evaluations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evaluations" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations" ON evaluations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evaluations" ON evaluations
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();