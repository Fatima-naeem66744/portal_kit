import 'server-only'

import Stripe from 'stripe'

let  stripeinstance: Stripe | null = null

export function getStripe() {
    if (!stripeinstance) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
        }
        stripeinstance = new Stripe(stripeSecretKey)
    }
    return stripeinstance
}