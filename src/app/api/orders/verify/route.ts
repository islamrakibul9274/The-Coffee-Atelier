import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/admin-actions';
import { getStripe } from '@/lib/stripe';
import { fulfillOrder } from '@/lib/fulfill-order';

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) return NextResponse.json({ error: 'Please sign in to view your order.' }, { status: 401 });
    const { sessionId } = await request.json();
    if (typeof sessionId !== 'string' || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      return NextResponse.json({ error: 'A valid checkout session is required.' }, { status: 400 });
    }
    const checkout = await getStripe().checkout.sessions.retrieve(sessionId);
    if (checkout.metadata?.firebaseUid !== decoded.uid) {
      return NextResponse.json({ error: 'This checkout belongs to another account.' }, { status: 403 });
    }
    if (!['paid', 'no_payment_required'].includes(checkout.payment_status)) return NextResponse.json({ error: 'Payment has not been confirmed yet.' }, { status: 409 });
    return NextResponse.json({ order: await fulfillOrder(checkout) });
  } catch (error) {
    console.error('Verify Order Error:', error);
    return NextResponse.json({ error: 'We could not confirm your order yet. Please retry or check your order history before paying again.' }, { status: 503 });
  }
}
