import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Discount } from '@/lib/models/Marketing';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';
import { syncActiveDiscounts } from '@/lib/firebase/sync';

async function requireAdminOrManager(request: NextRequest) {
  const decoded = await verifyAuthToken(request);
  if (!decoded) return null;
  await dbConnect();
  const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;
  return decoded;
}

// GET /api/admin/discounts
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const discounts = await Discount.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ discounts });
}

// POST /api/admin/discounts — create + sync
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, type, value, appliesTo, startDate, endDate, isActive, repeatWeekly } = body;

  if (!name || !type || value === undefined) {
    return NextResponse.json({ error: 'name, type, and value are required' }, { status: 400 });
  }

  const discount = new Discount({
    name,
    type,
    value,
    appliesTo: appliesTo || { type: 'all' },
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    isActive: isActive !== undefined ? isActive : true,
    repeatWeekly: repeatWeekly || false,
  });
  await discount.save();

  try { await syncActiveDiscounts(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ discount }, { status: 201 });
}

// PUT /api/admin/discounts — update + sync
export async function PUT(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { discountId, ...updates } = await request.json();
  if (!discountId) return NextResponse.json({ error: 'discountId required' }, { status: 400 });

  if (updates.startDate) updates.startDate = new Date(updates.startDate);
  if (updates.endDate) updates.endDate = new Date(updates.endDate);

  const discount = await Discount.findByIdAndUpdate(discountId, { $set: updates }, { new: true }).lean();
  if (!discount) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });

  try { await syncActiveDiscounts(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ discount });
}

// DELETE /api/admin/discounts?discountId=...
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const discountId = new URL(request.url).searchParams.get('discountId');
  if (!discountId) return NextResponse.json({ error: 'discountId required' }, { status: 400 });

  await Discount.findByIdAndDelete(discountId);

  try { await syncActiveDiscounts(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ message: 'Discount deleted' });
}
