import { adminDatabase } from './admin';
import { Banner, IBanner } from '@/lib/models/Marketing';
import { Discount, IDiscount } from '@/lib/models/Marketing';
import { Announcement, IAnnouncement } from '@/lib/models/Engagement';
import dbConnect from '../mongodb';

export async function syncActiveBanner() {
  try {
    await dbConnect();
    const now = new Date();
    // Find the active banner that is currently within its scheduled time window
    const activeBanner = await Banner.findOne({ 
      isActive: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }, { endDate: null }] }
      ]
    })
      .sort({ priority: -1, createdAt: -1, _id: -1 })
      .lean() as any as IBanner | null;

    if (activeBanner) {
      console.log('Syncing Active Banner:', activeBanner._id);
      await adminDatabase.ref('activeBanner').set({
        imageUrl: activeBanner.imageUrl,
        targetUrl: activeBanner.targetUrl || null,
        priority: activeBanner.priority,
        updatedAt: new Date().toISOString(),
      });
    } else {
      console.log('Removing Active Banner (None Active)');
      await adminDatabase.ref('activeBanner').remove();
    }
  } catch (error) {
    console.error('CRITICAL: syncActiveBanner Failed:', error);
    throw error;
  }
}

export async function syncActiveDiscounts() {
  await dbConnect();
  const discounts = await Discount.find({ isActive: true }).lean() as any as IDiscount[];
  
  // Convert to an object format suitable for RTDB
  const discountData = discounts.reduce((acc, discount) => {
    acc[discount._id.toString()] = {
      name: discount.name,
      type: discount.type,
      value: discount.value,
      appliesTo: discount.appliesTo,
      endDate: discount.endDate ? discount.endDate.toISOString() : null,
    };
    return acc;
  }, {} as Record<string, any>);

  await adminDatabase.ref('activeDiscounts').set(discountData);
}

export async function syncAnnouncements() {
  try {
    await dbConnect();
    // Find the latest active announcement
    const latestAnnouncement = await Announcement.findOne({ isActive: true })
      .sort({ createdAt: -1, _id: -1 })
      .lean() as any as IAnnouncement | null;

    if (latestAnnouncement) {
      console.log('Syncing Latest Announcement:', latestAnnouncement._id);
      await adminDatabase.ref('announcements/latest').set({
        title: latestAnnouncement.title,
        message: latestAnnouncement.message,
        timestamp: new Date(latestAnnouncement.createdAt).getTime(),
      });
    } else {
      console.log('Removing Latest Announcement (None Active)');
      await adminDatabase.ref('announcements/latest').remove();
    }
  } catch (error) {
    console.error('CRITICAL: syncAnnouncements Failed:', error);
    throw error;
  }
}

export async function syncOrderStatus(orderId: string, firebaseUid: string, status: string) {
  try {
    console.log(`Syncing Order Status to Firebase: ${orderId} -> ${status}`);
    await adminDatabase.ref(`orders/${firebaseUid}/${orderId}`).update({
      deliveryStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to sync order status to Firebase:', error);
  }
}

export async function syncNewOrderEvent() {
  try {
    await adminDatabase.ref('events/new_order').set(Date.now());
  } catch (error) {
    console.error('Failed to sync new order event:', error);
  }
}
