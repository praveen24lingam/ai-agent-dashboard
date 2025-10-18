'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts'
import { 
  FilterIcon,
  EyeIcon,
  ChevronDownIcon,
  ClockIcon,
  CheckCircleIcon
} from 'lucide-react'

export default function Analytics() {
  const [user, setUser] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [agents, setAgents] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('7')
  const [selectedEval, setSelectedEval] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      loadData()
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase])

  useEffect(() => {
    if (user) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent, selectedPeriod, currentPage])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load agents
      const agentsRes = await fetch('/api/agents')
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents)
      }

      // Load metrics
      const metricsRes = await fetch(`/api/metrics?period=${selectedPeriod}${selectedAgent ? `&agent_id=${selectedAgent}` : ''}`)
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      // Load evaluations
      const evalsRes = await fetch(`/api/evals?page=${currentPage}&limit=20${selectedAgent ? `&agent_id=${selectedAgent}` : ''}`)
      if (evalsRes.ok) {
        const evalsData = await evalsRes.json()
        setEvaluations(evalsData.evaluations)
        setPagination(evalsData.pagination)
      }
    } catch (error) {
      console.error('Error loading analytics data:', error)
    }
    setLoading(false)
  }

  const formatPromptResponse = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const EvaluationModal = ({ evaluation, onClose }) => {
    if (!evaluation) return null

    const config = evaluation.agents?.agent_configs?.[0] || {}
    
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Evaluation Details</h3>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Agent</dt>
                <dd className="mt-1 text-sm text-gray-900">{evaluation.agents?.name || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(evaluation.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Score</dt>
                <dd className="mt-1 text-sm text-gray-900">{evaluation.score ? `${evaluation.score}%` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Latency</dt>
                <dd className="mt-1 text-sm text-gray-900">{evaluation.latency_ms}ms</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Interaction ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{evaluation.interaction_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">PII Tokens Redacted</dt>
                <dd className="mt-1 text-sm text-gray-900">{evaluation.pii_tokens_redacted || 0}</dd>
              </div>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Prompt</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                {config.obfuscate_pii && evaluation.pii_tokens_redacted > 0 
                  ? evaluation.prompt.replace(/\[PII\]/g, '***') 
                  : evaluation.prompt}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Response</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                {config.obfuscate_pii && evaluation.pii_tokens_redacted > 0 
                  ? evaluation.response.replace(/\[PII\]/g, '***') 
                  : evaluation.response}
              </dd>
            </div>

            {evaluation.flags && Object.keys(evaluation.flags).length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Flags</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs">
                    {JSON.stringify(evaluation.flags, null, 2)}
                  </pre>
                </dd>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Detailed analysis of your AI agent evaluations
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Filter
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Agents</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Score vs Latency Scatter */}
            <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Score vs Latency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={evaluations.filter(e => e.score !== null)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="latency_ms" name="Latency (ms)" />
                  <YAxis dataKey="score" name="Score (%)" />
                  <Tooltip />
                  <Scatter dataKey="score" fill="#4f46e5" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Evaluations</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {metrics?.summary?.totalEvaluations || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Average Score</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {metrics?.summary?.avgScore || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Success Rate</span>
                  <span className="text-lg font-semibold text-green-600">
                    {metrics?.summary?.successRate || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Avg Latency</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {metrics?.summary?.avgLatency || 0}ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Score Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">PII Redaction Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="piiRedacted" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evaluations Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Evaluations</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Latency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prompt Preview
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {evaluations.map((evaluation) => (
                          <tr key={evaluation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {evaluation.agents?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {evaluation.score ? (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  evaluation.score >= 80 
                                    ? 'bg-green-100 text-green-800'
                                    : evaluation.score >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {evaluation.score}%
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                {evaluation.latency_ms}ms
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(evaluation.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              <div className="truncate">
                                {formatPromptResponse(evaluation.prompt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => setSelectedEval(evaluation)}
                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                          disabled={currentPage === pagination.totalPages}
                          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * pagination.limit, pagination.total)}
                            </span> of{' '}
                            <span className="font-medium">{pagination.total}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                              const page = i + 1
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                    currentPage === page
                                      ? 'bg-indigo-600 text-white focus:z-20'
                                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            })}
                            <button
                              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                              disabled={currentPage === pagination.totalPages}
                              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Evaluation Detail Modal */}
          <EvaluationModal
            evaluation={selectedEval}
            onClose={() => setSelectedEval(null)}
          />
        </div>
      </div>
    </div>
  )
}