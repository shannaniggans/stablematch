import Stripe from 'stripe';
import { env } from '@/lib/env';

const stripeClient = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

interface CheckoutOptions {
  invoiceId: string;
  amountCents: number;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}

export async function createInvoiceCheckoutSession(options: CheckoutOptions) {
  if (!stripeClient) {
    return {
      url: options.successUrl + '?stubInvoice=' + options.invoiceId,
      stub: true,
    } as const;
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    customer_email: options.customerEmail ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Invoice ' + options.invoiceId,
          },
          unit_amount: options.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: options.invoiceId,
    },
  });

  return { url: session.url ?? options.successUrl, stub: false } as const;
}

export function stripe() {
  if (!stripeClient) {
    throw new Error('Stripe secret key not configured');
  }
  return stripeClient;
}
