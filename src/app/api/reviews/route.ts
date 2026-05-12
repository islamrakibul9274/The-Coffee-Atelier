import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/lib/models/Engagement';
import { User } from '@/lib/models/User';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';

// GET /api/reviews — fetch reviews (by product or by user)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const firebaseUid = searchParams.get('firebaseUid');

    let filter: any = {};
    if (productId) filter.productId = productId;
    if (firebaseUid) filter.firebaseUid = firebaseUid;

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate('productId', 'name imageUrl')
      .lean();

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Get Reviews Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/reviews — create a new review (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { productId, rating, comment } = await request.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'productId and rating (1-5) are required' }, { status: 400 });
    }

    // Check if user already reviewed this product
    const existing = await Review.findOne({ productId, firebaseUid: decoded.uid });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }

    const review = new Review({
      productId,
      firebaseUid: decoded.uid,
      rating,
      comment: comment || '',
    });
    await review.save();

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error('Create Review Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/reviews — update a review (owner only)
export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { reviewId, rating, comment } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only owner can edit
    if (review.firebaseUid !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: any = {};
    if (rating !== undefined && rating >= 1 && rating <= 5) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updates },
      { new: true }
    ).lean();

    return NextResponse.json({ review: updatedReview });
  } catch (error: any) {
    console.error('Update Review Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/reviews?reviewId=... — delete a review (owner, admin, or manager)
export async function DELETE(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only review owner, admin, or manager can delete
    const dbUser = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (review.firebaseUid !== decoded.uid && dbUser.role !== 'admin' && dbUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Review.findByIdAndDelete(reviewId);
    return NextResponse.json({ message: 'Review deleted' });
  } catch (error: any) {
    console.error('Delete Review Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
