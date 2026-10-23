import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

// GET /api/orders — fetch orders for the authenticated user (or all for admin/manager)
export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let dbUser = await User.findOne({ firebaseUid: decoded.uid }).lean();
    
    if (!dbUser) {
      console.warn(`[Orders API] User ${decoded.uid} not found in DB. Defaulting to customer view.`);
      dbUser = { role: 'customer' } as any;
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Math.min(10000, Math.floor(Number(searchParams.get('page'))) || 1));
    const limit = Math.max(1, Math.min(100, Math.floor(Number(searchParams.get('limit'))) || 10));
    const status = searchParams.get('status');
    const view = searchParams.get('view'); // 'global' or 'personal'
    const skip = (page - 1) * limit;

    let filter: any = {};
    const isAdminOrManager = dbUser && (dbUser.role === 'admin' || dbUser.role === 'manager');
    

    // Default behavior: filter by user's own UID
    // Special behavior: if admin/manager AND view=global, show everything
    if (!(isAdminOrManager && view === 'global')) filter.firebaseUid = decoded.uid;

    if (status) {
      filter.deliveryStatus = status;
    }


    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);


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

// Paid orders are created only from a verified Stripe session.
export async function POST() {
  return NextResponse.json({ error: 'Please use secure checkout to place an order.' }, { status: 405 });
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
        ...(deliveryStatus !== 'Pending' ? { fulfillmentNeedsReview: false } : {}),
        $push: { timeline: { status: deliveryStatus, timestamp: new Date() } },
      },
      { new: true, runValidators: true }
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
