import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { Product } from '@/lib/models/Product';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

// GET /api/orders — fetch orders for the authenticated user (or all for admin/manager)
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log(`[Orders API] Fetching for UID: ${decoded.uid}`);

    let dbUser = await User.findOne({ firebaseUid: decoded.uid }).lean();
    
    if (!dbUser) {
      console.warn(`[Orders API] User ${decoded.uid} not found in DB. Defaulting to customer view.`);
      dbUser = { role: 'customer' } as any;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const view = searchParams.get('view'); // 'global' or 'personal'
    const skip = (page - 1) * limit;

    let filter: any = {};
    const isAdminOrManager = dbUser && (dbUser.role === 'admin' || dbUser.role === 'manager');
    
    console.log(`[Orders API] GET Request - Decoded UID: ${decoded.uid}, DB User Found: ${!!dbUser}, Role: ${dbUser?.role}`);

    // Default behavior: filter by user's own UID
    // Special behavior: if admin/manager AND view=global, show everything
    if (isAdminOrManager && view === 'global') {
      console.log(`[Orders API] Global view AUTHORIZED for ${dbUser?.role}`);
    } else {
      filter.firebaseUid = decoded.uid;
      console.log(`[Orders API] Personal view FILTER applied: firebaseUid = ${decoded.uid}`);
    }

    if (status) {
      filter.deliveryStatus = status;
      console.log(`[Orders API] Status FILTER applied: ${status}`);
    }

    console.log(`[Orders API] Final Mongoose Filter: ${JSON.stringify(filter)}`);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    console.log(`[Orders API] Response: Found ${orders.length} orders in DB for this query.`);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/orders — create a new order (used by Demo and potentially Webhooks)
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { items, subtotal, discountTotal, finalTotal, stripeSessionId } = await request.json();

    // 1. Stock Check
    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 404 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }
    }

    // Map items to the schema
    const orderItems = items.map((item: any) => ({
      product: item.id,
      name: item.name, // Fixed: Added missing name field
      quantity: item.quantity,
      priceAtPurchase: item.price
    }));

    const order = new Order({
      firebaseUid: decoded.uid,
      items: orderItems,
      subtotal,
      discountTotal: discountTotal || 0,
      finalTotal,
      status: 'Paid', // Assuming paid for demo/webhook
      deliveryStatus: 'Pending',
      timeline: [{ status: 'Pending', timestamp: new Date() }],
      stripeSessionId: stripeSessionId || `demo_${Date.now()}`
    });

    await order.save();
    
    // 2. Reduce Inventory after successful save
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.id, 
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (updatedProduct && updatedProduct.stock <= 0) {
        await Product.findByIdAndUpdate(item.id, { $set: { status: 'out_of_stock', stock: 0 } });
      }
    }

    console.log(`[Orders API] Order created successfully: ${order._id} for UID: ${decoded.uid}`);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/orders — update delivery status (manager/admin only)
export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const dbUser = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId, deliveryStatus } = await request.json();

    if (!orderId || !deliveryStatus) {
      return NextResponse.json({ error: 'orderId and deliveryStatus required' }, { status: 400 });
    }

    const validStatuses = ['Pending', 'Packaging', 'Delivering', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(deliveryStatus)) {
      return NextResponse.json({ error: 'Invalid delivery status' }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryStatus,
        $push: { timeline: { status: deliveryStatus, timestamp: new Date() } },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Real-time sync to Firebase
    try {
      const { syncOrderStatus } = await import('@/lib/firebase/sync');
      await syncOrderStatus(orderId, order.firebaseUid, deliveryStatus);
    } catch (err) {
      console.error('[Orders API] Firebase sync failed:', err);
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Update Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
