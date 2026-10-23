import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Product } from '@/lib/models/Product';
import { User } from '@/lib/models/User';
import { Category } from '@/lib/models/Category';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const productInput = z.object({
  name: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(5000),
  category: objectId, basePrice: z.number().finite().min(0).max(100000),
  stock: z.number().int().min(0).max(1000000).optional(),
  status: z.enum(['active', 'coming_soon', 'out_of_stock']).optional(),
  imageUrl: z.string().max(2000000).optional(),
  comingSoonLaunchDate: z.string().refine(value => value === '' || Number.isFinite(Date.parse(value))).nullable().optional(),
});

// GET /api/products — public listing with filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const limit = Math.max(1, Math.min(500, Math.floor(Number(searchParams.get('limit')) || 50)));
    if ((productId && !objectId.safeParse(productId).success) || (category && !objectId.safeParse(category).success)) {
      return NextResponse.json({ error: 'Invalid product or category.' }, { status: 400 });
    }

    const filter: any = {};
    if (productId) filter._id = productId;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    let query = Product.find(filter).populate('category', 'name slug').limit(limit);

    if (sort === 'price_asc') query = query.sort({ basePrice: 1 });
    else if (sort === 'price_desc') query = query.sort({ basePrice: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query.lean();
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Get Products Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/products — create (admin/manager only)
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = productInput.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid product fields." }, { status: 400 });
    const body = parsed.data;
    const { name, description, category, basePrice, status, comingSoonLaunchDate, imageUrl, stock } = body;

    if (!name || !description || !category || basePrice === undefined) {
      return NextResponse.json({ error: 'name, description, category, basePrice required' }, { status: 400 });
    }

    const product = new Product({
      name, description, category, basePrice,
      status: status || 'active',
      comingSoonLaunchDate: comingSoonLaunchDate ? new Date(comingSoonLaunchDate) : undefined,
      imageUrl: imageUrl || '',
      stock: stock || 0,
    });
    await product.save();

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/products — update (admin/manager only)
export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { productId, ...body } = await request.json();
    if (!objectId.safeParse(productId).success) return NextResponse.json({ error: 'Valid productId required' }, { status: 400 });
    const parsed = productInput.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid product fields.' }, { status: 400 });
    const updates: any = parsed.data;

    if (updates.comingSoonLaunchDate) updates.comingSoonLaunchDate = new Date(updates.comingSoonLaunchDate);
    else if (updates.comingSoonLaunchDate !== undefined) updates.comingSoonLaunchDate = null;

    const product = await Product.findByIdAndUpdate(productId, { $set: updates }, { new: true, runValidators: true }).lean();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/products?productId=...
export async function DELETE(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = new URL(request.url).searchParams.get('productId');
    if (!objectId.safeParse(productId).success) return NextResponse.json({ error: 'Valid productId required' }, { status: 400 });

    await Product.findByIdAndDelete(productId);
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error: any) {
    console.error('Delete Product Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
