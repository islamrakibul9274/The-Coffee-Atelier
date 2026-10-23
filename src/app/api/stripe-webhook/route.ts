import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { fulfillOrder } from '@/lib/fulfill-order';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret === '[SENSITIVE]') {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Signature required.' }, { status: 400 });
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(await request.text(), signature, secret); }
  catch { return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 }); }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const checkout = event.data.object as Stripe.Checkout.Session;
      if (['paid', 'no_payment_required'].includes(checkout.payment_status)) await fulfillOrder(checkout);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe fulfillment failed:', error);
    return NextResponse.json({ error: 'Fulfillment failed; please retry.' }, { status: 500 });
  }
}
