'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { 
  Plus, 
  Pencil, 
  Trash2,
  Bot,
  Settings
} from 'lucide-react'

export default function Agents() {
  const [user, setUser] = useState(null)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    run_policy: 'always',
    sample_rate_pct: 100,
    obfuscate_pii: false,
    max_eval_per_day: 1000,
    webhook_url: '' // <-- add this
  })
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
      loadAgents()
    }
    checkAuth()
  }, [router, supabase])

  const loadAgents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
      setError('')
      setSuccess('')
    setLoading(true)

    const payload = {
      name: formData.name,
      description: formData.description,
      webhook_url: formData.webhook_url, // <-- add this
      config: {
        run_policy: formData.run_policy,
        sample_rate_pct: parseInt(formData.sample_rate_pct),
        obfuscate_pii: formData.obfuscate_pii,
        max_eval_per_day: parseInt(formData.max_eval_per_day)
      }
    }

    try {
      const url = editingAgent ? `/api/agents/${editingAgent.id}` : '/api/agents'
      const method = editingAgent ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
          setSuccess(editingAgent ? 'Agent updated successfully!' : 'Agent created successfully!')
        resetForm()
        loadAgents()
          setTimeout(() => setSuccess(''), 3000)
      } else {
        const error = await response.json()
          setError(error.error || 'Operation failed. Please try again.')
      }
    } catch (error) {
      console.error('Error saving agent:', error)
        setError('Network error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const handleDelete = async (agentId) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadAgents()
        setDeleteConfirm(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
      alert('Network error')
    }
    setLoading(false)
  }

  const resetForm = () => {
      setError('')
      setSuccess('')
    setFormData({
      name: '',
      description: '',
      run_policy: 'always',
      sample_rate_pct: 100,
      obfuscate_pii: false,
      max_eval_per_day: 1000,
      webhook_url: '' // <-- add this
    })
    setIsCreating(false)
    setEditingAgent(null)
  }

  const startEdit = (agent) => {
    const config = agent.agent_configs?.[0] || {}
    setFormData({
      name: agent.name,
      description: agent.description || '',
      run_policy: config.run_policy || 'always',
      sample_rate_pct: config.sample_rate_pct || 100,
      obfuscate_pii: config.obfuscate_pii || false,
      max_eval_per_day: config.max_eval_per_day || 1000,
      webhook_url: agent.webhook_url || '' // <-- add this
    })
    setEditingAgent(agent)
    setIsCreating(true)
  }

  if (!user || loading) {
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your AI agents and their evaluation configurations
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </button>
          </div>

          {/* Agent Creation/Edit Form */}
          {isCreating && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                    <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              
                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">{success}</span>
                  </div>
                )}
              
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {editingAgent ? 'Edit Agent' : 'Create New Agent'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., ChatBot Assistant"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="e.g., General purpose AI assistant"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                {/* Webhook URL field */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://your-agent.com/webhook"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional: URL to fetch agent activity data</p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Configuration Settings</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Run Policy
                      </label>
                      <select
                        value={formData.run_policy}
                        onChange={(e) => setFormData({...formData, run_policy: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="always">Always Evaluate</option>
                        <option value="sampled">Sampled Evaluation</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">How often to run evaluations</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sample Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.sample_rate_pct}
                        onChange={(e) => setFormData({...formData, sample_rate_pct: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Percentage of requests to evaluate</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Evaluations/Day
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.max_eval_per_day}
                        onChange={(e) => setFormData({...formData, max_eval_per_day: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Daily evaluation limit</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="obfuscate_pii"
                          type="checkbox"
                          checked={formData.obfuscate_pii}
                          onChange={(e) => setFormData({...formData, obfuscate_pii: e.target.checked})}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="obfuscate_pii" className="text-sm font-medium text-gray-900">
                          Obfuscate PII (Personally Identifiable Information)
                        </label>
                        <p className="text-xs text-gray-500">Enable to mask sensitive data in evaluations</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingAgent ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingAgent ? 'Update Agent' : 'Create Agent'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Agents List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {agents.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No agents</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first AI agent.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map((agent) => {
                    const config = agent.agent_configs?.[0] || {}
                    return (
                      <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Bot className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                              <p className="text-sm text-gray-500">{agent.description || 'No description'}</p>
                              {agent.webhook_url && (
                                <p className="text-xs text-blue-500 break-all">Webhook: {agent.webhook_url}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEdit(agent)}
                              className="p-2 text-gray-400 hover:text-gray-500"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(agent.id)}
                              className="p-2 text-red-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Run Policy</dt>
                            <dd className="mt-1 text-sm text-gray-900 capitalize">{config.run_policy || 'always'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Sample Rate</dt>
                            <dd className="mt-1 text-sm text-gray-900">{config.sample_rate_pct || 100}%</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Max Evals/Day</dt>
                            <dd className="mt-1 text-sm text-gray-900">{config.max_eval_per_day || 1000}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">PII Obfuscation</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {config.obfuscate_pii ? 'Enabled' : 'Disabled'}
                            </dd>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Agent</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this agent? This action cannot be undone and will also delete all associated evaluations.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}