import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch agents without relational select (works even if relationships aren't defined)
    const { data: baseAgents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (agentsError) {
      console.error('Agents fetch error:', agentsError)
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }

    // Try to attach configs per agent; degrade gracefully if table/relationship missing
    const agents = []
    for (const agent of baseAgents || []) {
      let configs = []
      try {
        const { data: cfgs, error: cfgErr } = await supabase
          .from('agent_configs')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (!cfgErr && cfgs) configs = cfgs
      } catch (e) {
        // ignore; leave configs empty
      }
      agents.push({ ...agent, agent_configs: configs })
    }

    return NextResponse.json({ agents })

  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, webhook_url, config } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Insert agent with graceful fallback for schemas requiring a non-null "model"
    const baseInsert = {
      user_id: user.id,
      name,
      description: description || '',
      webhook_url: webhook_url || null
    }

    let agent = null
    let agentError = null

    // First attempt: insert with base fields
    {
      const res = await supabase
        .from('agents')
        .insert(baseInsert)
        .select()
        .single()
      agent = res.data
      agentError = res.error
    }

    // If failure due to NOT NULL on model, retry with a sensible default
    if (agentError && agentError.code === '23502' && (agentError.message || '').includes('"model"')) {
      const retryInsert = { ...baseInsert, model: 'gpt-4o-mini' }
      const res2 = await supabase
        .from('agents')
        .insert(retryInsert)
        .select()
        .single()
      agent = res2.data
      agentError = res2.error
    }

    if (agentError) {
      console.error('Agent insert error:', agentError)
      return NextResponse.json({ error: agentError.message || 'Failed to create agent' }, { status: 500 })
    }

    // Insert default config (best-effort)
    let agentConfig = null
    try {
      const { data: cfg, error: configError } = await supabase
        .from('agent_configs')
        .insert({
          agent_id: agent.id,
          user_id: user.id,
          run_policy: config?.run_policy || 'always',
          sample_rate_pct: config?.sample_rate_pct || 100,
          obfuscate_pii: config?.obfuscate_pii || false,
          max_eval_per_day: config?.max_eval_per_day || 1000
        })
        .select()
        .single()
      if (!configError) agentConfig = cfg
      else console.warn('Config insert error:', configError)
    } catch (e) {
      console.warn('Config insert skipped (table may be missing):', e)
    }

    return NextResponse.json({ 
      message: 'Agent created successfully',
      agent: { ...agent, agent_configs: agentConfig ? [agentConfig] : [] }
    })

  } catch (error) {
    console.error('Agent creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}