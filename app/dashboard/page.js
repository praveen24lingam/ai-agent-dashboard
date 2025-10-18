'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

// Simple avatar generator for agents
function AgentAvatar({ name }) {
  const colors = [
    'bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow ${color}`}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import Link from 'next/link'
import {
  ChartBar,
  Clock,
  CheckCircle,
  EyeOff,
  Plus,
  Bot
} from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [agents, setAgents] = useState([])
  const [recentEvaluations, setRecentEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  // 🧭 Check Auth + Load Data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      loadDashboardData()
    }
    checkAuth()
  }, [router, supabase])

  // 📊 Fetch Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load metrics
      const metricsRes = await fetch('/api/metrics?period=7')
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      // Load agents
      const agentsRes = await fetch('/api/agents')
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents)
      }

      // Load recent evaluations
      const evalsRes = await fetch('/api/evals?limit=10')
      if (evalsRes.ok) {
        const evalsData = await evalsRes.json()
        setRecentEvaluations(evalsData.evaluations)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
    setLoading(false)
  }

  // 📡 Realtime subscription for evaluations
  useEffect(() => {
    if (!user) return;
    // Subscribe to new evaluations for this user (RLS ensures only own data)
    const channel = supabase
      .channel('realtime-evaluations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evaluations',
        },
        (payload) => {
          // Add new evaluation to recentEvaluations
          setRecentEvaluations((prev) => [payload.new, ...prev].slice(0, 10));
          // Optionally, reload metrics/trends if needed
          loadDashboardData();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ⏳ Loading Screen
  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // 📦 Stat Card Component
  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => (
    <div className={`relative overflow-hidden rounded-xl shadow-lg transition-transform transform hover:scale-105 group bg-gradient-to-br from-${color}-50 to-white`}> 
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 bg-${color}-100 rounded-full p-2 shadow-inner group-hover:scale-110 transition-transform`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-bold text-gray-900">{value}</dd>
              {subtitle && <dd className="text-sm text-gray-400">{subtitle}</dd>}
            </dl>
          </div>
        </div>
      </div>
      <div className={`absolute right-0 bottom-0 opacity-10 text-${color}-400 text-7xl pointer-events-none select-none`}>★</div>
    </div>
  )

  // 🧠 Dashboard UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
      {/* Branded Header */}
      <header className="w-full bg-white/80 backdrop-blur border-b border-gray-200 py-4 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-indigo-700 tracking-tight">AI Agent Evaluation</span>
          <span className="ml-2 px-2 py-1 rounded bg-indigo-100 text-xs text-indigo-700 font-semibold">Assignment A</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">by Divya</span>
        </div>
      </header>
      <Navigation />
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Title */}
          <div className="mb-8 flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-indigo-900 drop-shadow">Dashboard</h1>
            <p className="mt-1 text-base text-gray-500">Overview of your AI agent evaluation metrics</p>
          </div>

          {/* 📊 Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Evaluations"
              value={metrics?.summary?.totalEvaluations || 0}
              subtitle="Last 7 days"
              icon={ChartBar}
            />
            <StatCard
              title="Avg Latency"
              value={`${metrics?.summary?.avgLatency || 0}ms`}
              subtitle="Response time"
              icon={Clock}
            />
            <StatCard
              title="Success Rate"
              value={`${metrics?.summary?.successRate || 0}%`}
              subtitle="Score ≥ 70%"
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="PII Tokens Redacted"
              value={metrics?.summary?.totalPiiRedacted || 0}
              subtitle="Privacy protection"
              icon={EyeOff}
              color="orange"
            />
          </div>

          {/* 📈 Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fadein">
            {/* Evaluations Trend */}
            <div className="bg-gradient-to-br from-indigo-100 to-white shadow-lg rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluations Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="evaluations" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Latency Trend */}
            <div className="bg-gradient-to-br from-green-100 to-white shadow-lg rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Average Latency</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgLatency" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ⚙️ Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Your Agents */}
            <div className="bg-white/90 shadow-lg rounded-xl">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Agents</h3>
                  <Link
                    href="/agents"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Manage
                  </Link>
                </div>
                <div className="space-y-3">
                  {agents.slice(0, 3).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-white rounded-lg shadow-sm hover:shadow-md transition group">
                      <div className="flex items-center gap-3">
                        <AgentAvatar name={agent.name} />
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.description || 'No description'}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow">Active</span>
                    </div>
                  ))}
                  {agents.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No agents created yet.{' '}
                      <Link href="/agents" className="text-indigo-600 hover:text-indigo-500">
                        Create your first agent
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 🧾 Recent Evaluations */}
            <div className="bg-white/90 shadow-lg rounded-xl">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Evaluations</h3>
                  <Link href="/analytics" className="text-sm text-indigo-600 hover:text-indigo-500">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentEvaluations.slice(0, 5).map((evaluation) => (
                    <div key={evaluation.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-indigo-50 rounded-lg shadow-sm hover:shadow-md transition group">
                      <div className="flex items-center gap-3">
                        <AgentAvatar name={evaluation.agents?.name} />
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition">{evaluation.agents?.name || 'Unknown Agent'}</p>
                          <p className="text-xs text-gray-500">{new Date(evaluation.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition">{evaluation.score ? `${evaluation.score}%` : 'N/A'}</p>
                        <p className="text-xs text-gray-500">{evaluation.latency_ms}ms</p>
                      </div>
                    </div>
                  ))}
                  {recentEvaluations.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No evaluations yet
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    {/* Footer */}
    <footer className="w-full py-4 px-6 bg-white/80 border-t border-gray-200 text-center text-sm text-gray-500 mt-8">
      {`© ${new Date().getFullYear()} Divya Sonla — AI Agent Evaluation Assignment`}
    </footer>
  </div>
  )
}
