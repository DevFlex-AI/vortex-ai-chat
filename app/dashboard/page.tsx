import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionStatus from '@/components/SubscriptionStatus'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SubscriptionStatus />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a 
                href="/pricing" 
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">View Plans</h3>
                <p className="text-sm text-gray-600">Explore our subscription options</p>
              </a>
              <a 
                href="/" 
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Start Chatting</h3>
                <p className="text-sm text-gray-600">Begin a conversation with Vortex AI</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}