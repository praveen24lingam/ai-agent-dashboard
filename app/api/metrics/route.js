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
    const period = searchParams.get('period') || '7' // days
    const agentId = searchParams.get('agent_id')

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Base query for the period
    let baseQuery = supabase
      .from('evaluations')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (agentId) {
      baseQuery = baseQuery.eq('agent_id', agentId)
    }

    const { data: evaluations, error: evalError } = await baseQuery

    if (evalError) {
      console.error('Metrics fetch error:', evalError)
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    // Calculate metrics
    const totalEvaluations = evaluations.length
    const avgLatency = evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + e.latency_ms, 0) / evaluations.length
      : 0

    const validScores = evaluations.filter(e => e.score !== null)
    const avgScore = validScores.length > 0
      ? validScores.reduce((sum, e) => sum + parseFloat(e.score), 0) / validScores.length
      : 0

    const successRate = evaluations.length > 0
      ? (validScores.filter(e => parseFloat(e.score) >= 70).length / validScores.length) * 100
      : 0

    const totalPiiRedacted = evaluations.reduce((sum, e) => sum + (e.pii_tokens_redacted || 0), 0)

    // Generate daily trends
    const dailyTrends = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayEvals = evaluations.filter(e => 
        e.created_at.startsWith(dateStr)
      )

      dailyTrends.push({
        date: dateStr,
        evaluations: dayEvals.length,
        avgLatency: dayEvals.length > 0 
          ? dayEvals.reduce((sum, e) => sum + e.latency_ms, 0) / dayEvals.length
          : 0,
        avgScore: dayEvals.filter(e => e.score !== null).length > 0
          ? dayEvals.filter(e => e.score !== null).reduce((sum, e) => sum + parseFloat(e.score), 0) / dayEvals.filter(e => e.score !== null).length
          : 0,
        piiRedacted: dayEvals.reduce((sum, e) => sum + (e.pii_tokens_redacted || 0), 0)
      })
    }

    return NextResponse.json({
      period: periodDays,
      summary: {
        totalEvaluations,
        avgLatency: Math.round(avgLatency),
        avgScore: Math.round(avgScore * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        totalPiiRedacted
      },
      trends: dailyTrends
    })

  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}