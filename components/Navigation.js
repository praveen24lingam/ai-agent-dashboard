'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { 
  ChartBarIcon, 
  CogIcon, 
  HomeIcon, 
  LogOutIcon,
  BotIcon,
  User,
  ChevronDown
} from 'lucide-react'

// Profile Avatar Component
function ProfileAvatar({ email }) {
  const colors = [
    'bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'
  ];
  const initial = email ? email[0].toUpperCase() : '?';
  const color = colors[(email?.charCodeAt(0) || 0) % colors.length];
  
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${color}`}>
      {initial}
    </div>
  );
}

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Agents', href: '/agents', icon: BotIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">AI Agent Eval</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center relative">
            <div className="flex-shrink-0">
              {/* Profile Dropdown Button */}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
              >
                <ProfileAvatar email={user.email} />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">My Profile</div>
                  <div className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileOpen(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar email={user.email} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user.user_metadata?.name || 'User'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                      >
                        <CogIcon className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          handleSignOut()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOutIcon className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}