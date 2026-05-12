import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Upsert user in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Create new user
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || email.split('@')[0],
        profileImage: picture || '',
        role: 'customer',
      });
    } else {
      // Update existing user BUT DO NOT overwrite profileImage if it already exists 
      // unless we want to sync from Firebase (which we don't if they have a custom one)
      const updates: any = {};
      if (!user.name) updates.name = name || email.split('@')[0];
      // Only sync picture if the user has NO profile image yet
      if (!user.profileImage && picture) updates.profileImage = picture;
      
      if (Object.keys(updates).length > 0) {
        user = await User.findOneAndUpdate(
          { firebaseUid: uid },
          { $set: updates },
          { new: true }
        );
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to create/sync user' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'User synced successfully',
      user: {
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        loyaltyPoints: user.loyaltyPoints,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Auth Sync Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
