import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Category } from '@/lib/models/Category';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

// GET /api/categories — public
export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Get Categories Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, slug, imageUrl } = await request.json();
    if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });

    const existing = await Category.findOne({ slug });
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });

    const category = new Category({ name, slug, imageUrl: imageUrl || '', isActive: true });
    await category.save();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Create Category Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/categories
export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { categoryId, ...updates } = await request.json();
    if (!categoryId) return NextResponse.json({ error: 'categoryId required' }, { status: 400 });

    const category = await Category.findByIdAndUpdate(categoryId, { $set: updates }, { new: true }).lean();
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Update Category Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/categories?categoryId=...
export async function DELETE(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const categoryId = new URL(request.url).searchParams.get('categoryId');
    if (!categoryId) return NextResponse.json({ error: 'categoryId required' }, { status: 400 });

    await Category.findByIdAndDelete(categoryId);
    return NextResponse.json({ message: 'Category deleted' });
  } catch (error: any) {
    console.error('Delete Category Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
