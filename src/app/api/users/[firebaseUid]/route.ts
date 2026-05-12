import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

// GET /api/users/[firebaseUid] — retrieve a user by firebaseUid
export async function GET(
  request: NextRequest,
  { params }: { params: { firebaseUid: string } }
) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Only allow users to view their own profile, or admins to view any
    const requestingUser = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (requestingUser.role !== 'admin' && decoded.uid !== params.firebaseUid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUser = await User.findOne({ firebaseUid: params.firebaseUid }).lean();
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: targetUser });
  } catch (error: any) {
    console.error('Get User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/users/[firebaseUid] — update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { firebaseUid: string } }
) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const requestingUser = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow self-update or admin update
    if (requestingUser.role !== 'admin' && decoded.uid !== params.firebaseUid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields: Record<string, any> = {};

    // Regular users can update name and profileImage
    if (body.name) allowedFields.name = body.name;
    if (body.profileImage !== undefined) allowedFields.profileImage = body.profileImage;

    // Only admins can update role
    if (body.role && requestingUser.role === 'admin') {
      allowedFields.role = body.role;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: params.firebaseUid },
      { $set: allowedFields },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
