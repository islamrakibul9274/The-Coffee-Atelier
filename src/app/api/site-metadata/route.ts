import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Banner } from '@/lib/models/Marketing';
import { Announcement } from '@/lib/models/Engagement';

export async function GET() {
  try {
    await dbConnect();
    const now = new Date();
    
    // Get latest active banner (time-aware)
    const bannerData = await Banner.findOne({ 
      isActive: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }, { endDate: null }] }
      ]
    }).sort({ priority: -1, createdAt: -1, _id: -1 }).lean();

    // Get latest active announcement
    const announcementData = await Announcement.findOne({ isActive: true })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const banner = bannerData ? {
      _id: bannerData._id,
      imageUrl: bannerData.imageUrl,
      targetUrl: bannerData.targetUrl,
      priority: bannerData.priority
    } : null;

    const announcement = announcementData ? {
      _id: announcementData._id,
      title: announcementData.title,
      message: announcementData.message,
      timestamp: new Date(announcementData.createdAt).getTime()
    } : null;

    return NextResponse.json({ banner, announcement });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
