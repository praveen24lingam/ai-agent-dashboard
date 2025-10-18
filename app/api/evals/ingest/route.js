import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      agent_id,
      interaction_id,
      prompt,
      response,
      score,
      latency_ms,
      flags,
      pii_tokens_redacted
    } = body

    // Validate required fields
    if (!agent_id || !interaction_id || !prompt || !response || latency_ms === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, interaction_id, prompt, response, latency_ms' },
        { status: 400 }
      )
    }

    // Verify the agent belongs to the user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 404 })
    }

    // Insert evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        agent_id,
        user_id: user.id,
        interaction_id,
        prompt,
        response,
        score: score || null,
        latency_ms,
        flags: flags || null,
        pii_tokens_redacted: pii_tokens_redacted || 0
      })
      .select()
      .single()

    if (evalError) {
      console.error('Evaluation insert error:', evalError)
      return NextResponse.json({ error: 'Failed to insert evaluation' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Evaluation ingested successfully',
      evaluation_id: evaluation.id 
    })

  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}