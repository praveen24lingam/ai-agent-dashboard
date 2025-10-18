'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { 
  CogIcon,
  UserIcon,
  KeyIcon,
  BellIcon,
  ShieldIcon
} from 'lucide-react'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      emailAlerts: true,
      dailyDigest: true,
      performanceAlerts: true
    },
    defaults: {
      run_policy: 'always',
      sample_rate_pct: 100,
      obfuscate_pii: false,
      max_eval_per_day: 1000
    }
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
      setFormData(prev => ({
        ...prev,
        email: user.email
      }))
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Password updated successfully')
        setFormData(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: ''
        }))
      }
    } catch (error) {
      setMessage('Failed to update password')
    }
    setSaving(false)
  }

  const handleNotificationUpdate = async () => {
    setSaving(true)
    // Since this is a demo, we'll just simulate saving preferences
    setTimeout(() => {
      setMessage('Notification preferences updated')
      setSaving(false)
    }, 1000)
  }

  const handleDefaultsUpdate = async () => {
    setSaving(true)
    // Since this is a demo, we'll just simulate saving defaults
    setTimeout(() => {
      setMessage('Default settings updated')
      setSaving(false)
    }, 1000)
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'defaults', name: 'Agent Defaults', icon: CogIcon },
  ]

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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account and application preferences
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            {/* Sidebar */}
            <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full text-left ${
                        activeTab === tab.id
                          ? 'bg-gray-50 text-indigo-700'
                          : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                        activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Main content */}
            <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
              {message && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{message}</div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="bg-white py-6 px-4 sm:p-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Basic information about your account
                      </p>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Email address
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Email changes are not currently supported. Contact support if needed.
                        </p>
                      </div>
                      
                      <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">
                          User ID
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={user.id}
                            disabled
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 font-mono text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">
                          Account created
                        </label>
                        <div className="mt-1 text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <form onSubmit={handlePasswordUpdate}>
                    <div className="bg-white py-6 px-4 sm:p-6">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Security Settings</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Update your password and security preferences
                        </p>
                      </div>
                      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">
                            New Password
                          </label>
                          <div className="mt-1">
                            <input
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        
                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Confirm Password
                          </label>
                          <div className="mt-1">
                            <input
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                      <button
                        type="submit"
                        disabled={saving || !formData.newPassword}
                        className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="bg-white py-6 px-4 sm:p-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Notification Preferences</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Choose what notifications you want to receive
                      </p>
                    </div>
                    <div className="mt-6 space-y-6">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={formData.notifications.emailAlerts}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                emailAlerts: e.target.checked
                              }
                            })}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label className="font-medium text-gray-700">Email alerts</label>
                          <p className="text-gray-500">Get notified about critical evaluation failures</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={formData.notifications.dailyDigest}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                dailyDigest: e.target.checked
                              }
                            })}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label className="font-medium text-gray-700">Daily digest</label>
                          <p className="text-gray-500">Receive a summary of daily evaluation metrics</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={formData.notifications.performanceAlerts}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                performanceAlerts: e.target.checked
                              }
                            })}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label className="font-medium text-gray-700">Performance alerts</label>
                          <p className="text-gray-500">Get alerted when performance drops below thresholds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={handleNotificationUpdate}
                      disabled={saving}
                      className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {/* Defaults Tab */}
              {activeTab === 'defaults' && (
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="bg-white py-6 px-4 sm:p-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Default Agent Settings</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Set default values for new agents
                      </p>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Run Policy</label>
                        <select
                          value={formData.defaults.run_policy}
                          onChange={(e) => setFormData({
                            ...formData,
                            defaults: {
                              ...formData.defaults,
                              run_policy: e.target.value
                            }
                          })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="always">Always</option>
                          <option value="sampled">Sampled</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Sample Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.defaults.sample_rate_pct}
                          onChange={(e) => setFormData({
                            ...formData,
                            defaults: {
                              ...formData.defaults,
                              sample_rate_pct: parseInt(e.target.value)
                            }
                          })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Max Evals/Day</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.defaults.max_eval_per_day}
                          onChange={(e) => setFormData({
                            ...formData,
                            defaults: {
                              ...formData.defaults,
                              max_eval_per_day: parseInt(e.target.value)
                            }
                          })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              checked={formData.defaults.obfuscate_pii}
                              onChange={(e) => setFormData({
                                ...formData,
                                defaults: {
                                  ...formData.defaults,
                                  obfuscate_pii: e.target.checked
                                }
                              })}
                              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label className="font-medium text-gray-700">Default PII Obfuscation</label>
                            <p className="text-gray-500">Enable PII obfuscation by default for new agents</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={handleDefaultsUpdate}
                      disabled={saving}
                      className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Defaults'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}