'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { StripeProduct } from '@/src/stripe-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface ProductCardProps {
  product: StripeProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleCheckout = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/auth/login'
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{product.name}</CardTitle>
          <Badge variant="secondary">{product.mode}</Badge>
        </div>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">$100.00</div>
        <p className="text-sm text-gray-600 mt-1">
          {product.mode === 'subscription' ? 'per month' : 'one-time payment'}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
        <Button 
          onClick={handleCheckout} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product.mode === 'subscription' ? 'Subscribe' : 'Buy Now'}
        </Button>
      </CardFooter>
    </Card>
  )
}