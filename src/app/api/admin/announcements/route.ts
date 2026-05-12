import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Announcement } from '@/lib/models/Engagement';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';
import { syncAnnouncements } from '@/lib/firebase/sync';

async function requireAdmin(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return null;
    
    await dbConnect();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    
    if (!user) {
      console.warn(`Auth Sync: No user found in MongoDB for Firebase UID: ${decoded.uid}`);
      return null;
    }
    
    if (user.role !== 'admin' && user.role !== 'manager') {
      console.warn(`Auth Access: User ${user.email} has insufficient role: ${user.role}`);
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('requireAdmin Error:', error);
    return null;
  }
}

// GET /api/admin/announcements
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      console.warn('Admin Access Denied to Announcements');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Announcements GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/announcements — create + sync
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, message, isActive } = await request.json();
  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  // If this is set active, deactivate all others first
  if (isActive !== false) {
    await Announcement.updateMany({}, { isActive: false });
  }

  const announcement = new Announcement({
    title,
    message,
    isActive: isActive !== false,
  });
  await announcement.save();

  try { await syncAnnouncements(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ announcement }, { status: 201 });
}

// PUT /api/admin/announcements
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { announcementId, ...updates } = await request.json();
  if (!announcementId) return NextResponse.json({ error: 'announcementId required' }, { status: 400 });

  // If activating this one, deactivate all others
  if (updates.isActive === true) {
    await Announcement.updateMany({ _id: { $ne: announcementId } }, { isActive: false });
  }

  const announcement = await Announcement.findByIdAndUpdate(
    announcementId, { $set: updates }, { new: true }
  ).lean();
  if (!announcement) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });

  try { await syncAnnouncements(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ announcement });
}

// DELETE /api/admin/announcements?announcementId=...
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const announcementId = new URL(request.url).searchParams.get('announcementId');
  if (!announcementId) return NextResponse.json({ error: 'announcementId required' }, { status: 400 });

  await Announcement.findByIdAndDelete(announcementId);

  try { await syncAnnouncements(); } catch (e) { console.error('RTDB sync error:', e); }

  return NextResponse.json({ message: 'Announcement deleted' });
}
