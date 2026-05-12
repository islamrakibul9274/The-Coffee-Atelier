import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find({}).lean();
    return NextResponse.json({ count: orders.length, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}
