import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import { Product } from '@/lib/models/Product';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';
import { getStripe } from '@/lib/stripe';
import { Discount } from '@/lib/models/Marketing';
import { offerSavings } from '@/lib/offers';
import { normalizeCart } from '@/lib/checkout';

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Please sign in to check out.' }, { status: 401 });
    let items;
    try { items = normalizeCart(await request.json()); }
    catch { return NextResponse.json({ error: 'Your cart contains invalid quantities or products.' }, { status: 400 }); }

    await dbConnect();
    const products = await Product.find({ _id: { $in: items.map(item => item.id) } }).lean();
    const offers = await Discount.find({ isActive: true }).lean();
    let savings = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.id);
      if (!product || product.status !== 'active' || product.stock < item.quantity) {
        return NextResponse.json({ error: `${product?.name || 'An item'} is no longer available in that quantity. Please update your cart.` }, { status: 409 });
      }
      const cents = Math.round(product.basePrice * 100);
      if (!Number.isSafeInteger(cents) || cents < 50) {
        return NextResponse.json({ error: 'An item is unavailable for checkout. Please contact the shop.' }, { status: 409 });
      }
      savings += offerSavings(cents, item.quantity, item.id, product.category.toString(), offers);
      lineItems.push({
        price_data: { currency: 'usd', unit_amount: cents, product_data: {
          name: product.name,
          metadata: { productId: product._id.toString() },
          ...(product.imageUrl && /^https:\/\//.test(product.imageUrl) && product.imageUrl.length < 2000 ? { images: [product.imageUrl] } : {}),
        } },
        quantity: item.quantity,
      });
    }
    const origin = request.nextUrl.origin;
    const stripe = getStripe();
    const coupon = savings ? await stripe.coupons.create({ amount_off: savings, currency: 'usd', duration: 'once', name: 'Coffee Atelier offer' }) : null;
    const session = await stripe.checkout.sessions.create({
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      payment_method_types: ['card'], mode: 'payment', line_items: lineItems,
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: { firebaseUid: decoded.uid },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Your cart has been saved; please try again.' }, { status: 503 });
  }
}
