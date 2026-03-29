import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    imagesPerMonth: 100,
    pricePerImage: 0.40,
    features: [
      '100 images/month included',
      'Background removal',
      'Headless crop',
      'Body-aware crop',
      '2 output sizes (eBay + portrait)',
      'Email support',
    ]
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    imagesPerMonth: 500,
    pricePerImage: 0.25,
    features: [
      '500 images/month included',
      'Everything in Starter',
      'Priority processing',
      'Bulk upload (1000 images)',
      'Custom output sizes',
      'Priority support',
    ]
  }
}
