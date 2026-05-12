import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

async function requireAdmin(request: NextRequest) {
  const decoded = await verifyAuthToken(request);
  if (!decoded) return null;
  await dbConnect();
  const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
  if (!user || user.role !== 'admin') return null;
  return decoded;
}

// GET /api/admin/users — paginated user list with search
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return NextResponse.json({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// PUT /api/admin/users — update user role
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, role, name } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const updateFields: any = {};
  if (role && ['customer', 'manager', 'admin'].includes(role)) updateFields.role = role;
  if (name) updateFields.name = name;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user });
}

// DELETE /api/admin/users — delete a user
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const user = await User.findById(userId).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent self-deletion
  if (user.firebaseUid === admin.uid) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  await User.findByIdAndDelete(userId);
  return NextResponse.json({ message: 'User deleted' });
}
