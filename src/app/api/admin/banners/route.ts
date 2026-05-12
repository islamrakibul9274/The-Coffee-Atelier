import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Banner } from '@/lib/models/Marketing';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';
import { syncActiveBanner } from '@/lib/firebase/sync';

async function requireAdminOrManager(request: NextRequest) {
  const decoded = await verifyAuthToken(request);
  if (!decoded) return null;
  await dbConnect();
  const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;
  return decoded;
}

// GET /api/admin/banners
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const banners = await Banner.find().sort({ priority: -1, _id: -1 }).lean();
  return NextResponse.json({ banners });
}

// POST /api/admin/banners — create banner + sync RTDB
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { imageUrl, targetUrl, startDate, endDate, priority, isActive } = body;

  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
  }

  const banner = new Banner({
    imageUrl,
    targetUrl: targetUrl || '',
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    priority: priority || 0,
    isActive: isActive !== undefined ? isActive : true,
  });
  await banner.save();

  // Push to Firebase Realtime DB
  try { await syncActiveBanner(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ banner }, { status: 201 });
}

// PUT /api/admin/banners — update banner + sync RTDB
export async function PUT(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { bannerId, ...updates } = await request.json();
  if (!bannerId) return NextResponse.json({ error: 'bannerId required' }, { status: 400 });

  // Sanitize date fields
  if (updates.startDate) updates.startDate = new Date(updates.startDate);
  if (updates.endDate) updates.endDate = new Date(updates.endDate);

  const banner = await Banner.findByIdAndUpdate(bannerId, { $set: updates }, { new: true }).lean();
  if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

  try { await syncActiveBanner(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ banner });
}

// DELETE /api/admin/banners?bannerId=...
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminOrManager(request);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const bannerId = new URL(request.url).searchParams.get('bannerId');
  if (!bannerId) return NextResponse.json({ error: 'bannerId required' }, { status: 400 });

  await Banner.findByIdAndDelete(bannerId);

  try { await syncActiveBanner(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ message: 'Banner deleted' });
}
