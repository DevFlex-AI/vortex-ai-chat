export interface StripeProduct {
  id: string
  priceId: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SFJtODXo47trxn',
    priceId: 'price_1RKpFmFo9Nuy6V7lfvyY2mS7',
    name: 'apper',
    description: 'Premium subscription plan',
    mode: 'subscription'
  },
  {
    id: 'prod_SAmB4WcZrElFkg',
    priceId: 'price_1RGQdFFo9Nuy6V7lhkQILbMu',
    name: 'app',
    description: 'Standard subscription plan',
    mode: 'subscription'
  }
]

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId)
}

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id)
}