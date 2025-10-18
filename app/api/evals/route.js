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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const agentId = searchParams.get('agent_id')
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('evaluations')
      .select(`
        *,
        agents(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data: evaluations, error: evalError } = await query

    if (evalError) {
      console.error('Evaluations fetch error:', evalError)
      return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (agentId) {
      countQuery = countQuery.eq('agent_id', agentId)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
      return NextResponse.json({ error: 'Failed to get evaluation count' }, { status: 500 })
    }

    return NextResponse.json({
      evaluations,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })

  } catch (error) {
    console.error('Evaluations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}