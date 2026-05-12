import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    console.log(`[Verify API] Auth Header received: ${authHeader ? 'Present' : 'MISSING'}`);
    
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Check if order already exists
    const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
    if (existingOrder) {
      return NextResponse.json({ order: existingOrder, status: 'already_exists' });
    }

    // 2. Fetch session from Stripe
    console.log(`[Verify API] Retrieving Stripe Session: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    if (!session || session.payment_status !== 'paid') {
      console.error(`[Verify API] Session not paid or invalid: ${session?.payment_status}`);
      return NextResponse.json({ error: 'Session not paid or invalid' }, { status: 400 });
    }

    const lineItems = session.line_items?.data || [];
    console.log(`[Verify API] Found ${lineItems.length} line items in session`);
    const orderItems = [];

    for (const item of lineItems) {
      // Try to get productId from expanded product metadata
      const stripeProduct = item.price?.product as Stripe.Product;
      const productId = stripeProduct?.metadata?.productId;
      const productName = item.description?.trim() || 'Unknown Product';
      
      console.log(`[Verify API] Processing item: "${productName}", ID from metadata: ${productId}`);

      let product = null;
      if (productId) {
        product = await Product.findById(productId);
      }
      
      // Fallback to name search if metadata is missing (for older sessions)
      if (!product) {
        console.warn(`[Verify API] Product ID missing in metadata for "${productName}", falling back to name search.`);
        product = await Product.findOne({ 
          name: { $regex: new RegExp(`^${productName}$`, 'i') } 
        });
      }
      
      if (product) {
        // Reduce inventory
        console.log(`[Verify API] Reducing stock for ${product.name}. Current: ${product.stock}, Quantity: ${item.quantity}`);
        product.stock = Math.max(0, product.stock - (item.quantity || 1));
        if (product.stock === 0) product.status = 'out_of_stock';
        await product.save();
      } else {
        console.warn(`[Verify API] Product not found in DB: "${productName}"`);
      }
      
      orderItems.push({
        product: product ? product._id : undefined,
        name: productName,
        quantity: item.quantity || 1,
        priceAtPurchase: (item.amount_total || 0) / 100,
      });
    }

    const newOrder = new Order({
      firebaseUid: decoded.uid,
      items: orderItems,
      subtotal: (session.amount_total || 0) / 100,
      finalTotal: (session.amount_total || 0) / 100,
      status: 'Paid',
      deliveryStatus: 'Packaging',
      timeline: [{ status: 'Packaging', timestamp: new Date() }],
      stripeSessionId: sessionId
    });

    await newOrder.save();
    console.log(`[Verify API] Order ${newOrder._id} saved for UID: ${decoded.uid}`);

    // Real-time sync to Firebase
    try {
      const { syncOrderStatus, syncNewOrderEvent } = await import('@/lib/firebase/sync');
      await syncOrderStatus(newOrder._id.toString(), decoded.uid, 'Packaging');
      await syncNewOrderEvent();
    } catch (err) {
      console.error('[Verify API] Firebase sync failed:', err);
    }

    return NextResponse.json({ order: newOrder, status: 'created' });
  } catch (error: any) {
    console.error('Verify Order Error:', error);
    return NextResponse.json({ error: 'Verification failed', details: error.message }, { status: 500 });
  }
}
