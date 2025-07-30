'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getProductByPriceId } from '@/src/stripe-config'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface SubscriptionData {
  subscription_status: string
  price_id: string | null
  current_period_end: number | null
  cancel_at_period_end: boolean
}

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Not authenticated')
          return
        }

        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
          .maybeSingle()

        if (error) {
          setError('Failed to fetch subscription')
          return
        }

        setSubscription(data)
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [supabase])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>You don't have an active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">No Active Subscription</Badge>
        </CardContent>
      </Card>
    )
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null
  const isActive = subscription.subscription_status === 'active'
  const endDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
        <CardDescription>Your current subscription details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Plan:</span>
          <span>{product?.name || 'Unknown Plan'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-medium">Status:</span>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {subscription.subscription_status}
          </Badge>
        </div>

        {endDate && (
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {subscription.cancel_at_period_end ? 'Ends on:' : 'Renews on:'}
            </span>
            <span>{endDate}</span>
          </div>
        )}

        {subscription.cancel_at_period_end && (
          <div className="text-sm text-orange-600">
            Your subscription will not renew and will end on {endDate}
          </div>
        )}
      </CardContent>
    </Card>
  )
}