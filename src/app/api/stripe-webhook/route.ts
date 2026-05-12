import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

// Route Handlers in App Router handle the request body manually (e.g. request.text() or request.json()),
// so the deprecated 'config' export is not needed and causes build errors.

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // If we have a webhook secret, verify the signature
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (endpointSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // In development without webhook secret, parse directly
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const firebaseUid = session.metadata?.firebaseUid;

      if (!firebaseUid) {
        console.error('No firebaseUid in session metadata');
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
      }

      await dbConnect();

      // 1. Prevent duplicate orders (webhook vs verify API)
      const existingOrder = await Order.findOne({ stripeSessionId: session.id });
      if (existingOrder) {
        console.log('Order already exists, skipping webhook creation:', session.id);
        return NextResponse.json({ received: true });
      }

      // 2. Retrieve session line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      // 3. Build order items with name fallback
      const { Product } = await import('@/lib/models/Product'); // Dynamic import to avoid cycles
      
      const orderItems = await Promise.all(lineItems.data.map(async (item) => {
        const productName = item.description?.trim() || 'Unknown Product';
        const product = await Product.findOne({ 
          name: { $regex: new RegExp(`^${productName}$`, 'i') } 
        });

        return {
          product: product ? product._id : undefined,
          name: productName,
          quantity: item.quantity || 1,
          priceAtPurchase: (item.amount_total || 0) / 100,
        };
      }));

      const order = new Order({
        firebaseUid,
        items: orderItems,
        subtotal: (session.amount_total || 0) / 100,
        finalTotal: (session.amount_total || 0) / 100,
        status: 'Paid',
        deliveryStatus: 'Packaging',
        stripeSessionId: session.id,
        timeline: [{ status: 'Packaging', timestamp: new Date() }],
      });

      await order.save();
      console.log('Order created via Webhook:', order._id);

      // Real-time sync to Firebase
      try {
        const { syncOrderStatus, syncNewOrderEvent } = await import('@/lib/firebase/sync');
        await syncOrderStatus(order._id.toString(), firebaseUid, 'Packaging');
        await syncNewOrderEvent();
      } catch (err) {
        console.error('[Webhook] Firebase sync failed:', err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
