import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: agentRow, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agentRow) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // fetch configs separately (best-effort)
    let agent_configs = []
    try {
      const { data: cfgs } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('agent_id', params.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      agent_configs = cfgs || []
    } catch {}

    return NextResponse.json({ agent: { ...agentRow, agent_configs } })

  } catch (error) {
    console.error('Agent fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, config } = body

    // Update agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Failed to update agent or agent not found' }, { status: 404 })
    }

    // Update config if provided
    if (config) {
      const { error: configError } = await supabase
        .from('agent_configs')
        .update({
          run_policy: config.run_policy || undefined,
          sample_rate_pct: config.sample_rate_pct !== undefined ? config.sample_rate_pct : undefined,
          obfuscate_pii: config.obfuscate_pii !== undefined ? config.obfuscate_pii : undefined,
          max_eval_per_day: config.max_eval_per_day !== undefined ? config.max_eval_per_day : undefined
        })
        .eq('agent_id', params.id)
        .eq('user_id', user.id)

      if (configError) {
        console.error('Config update error:', configError)
      }
    }

    return NextResponse.json({ 
      message: 'Agent updated successfully',
      agent 
    })

  } catch (error) {
    console.error('Agent update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete agent (cascading deletes will handle configs and evaluations)
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Agent delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Agent deleted successfully' })

  } catch (error) {
    console.error('Agent deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}