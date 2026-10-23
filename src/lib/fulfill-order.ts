import mongoose, { Schema } from 'mongoose';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { getStripe } from '@/lib/stripe';

// The built-in unique _id serializes webhook and return-page requests for a session.
const Receipt = mongoose.models.CheckoutReceipt || mongoose.model('CheckoutReceipt', new Schema({ _id: String }));

export async function fulfillOrder(checkout: Stripe.Checkout.Session) {
  const uid = checkout.metadata?.firebaseUid;
  if (!['paid', 'no_payment_required'].includes(checkout.payment_status) || !uid) throw new Error('A paid checkout with a customer is required.');
  const lineItems = await getStripe().checkout.sessions.listLineItems(checkout.id, {
    limit: 100, expand: ['data.price.product'],
  });
  if (!lineItems.data.length || lineItems.has_more) throw new Error('Invalid checkout items.');
  await dbConnect();
  const existing = await Order.findOne({ stripeSessionId: checkout.id });
  if (existing) {
    if (existing.firebaseUid !== uid) throw new Error('Checkout ownership mismatch.');
    return existing;
  }

  let order;
  try {
    order = await mongoose.connection.transaction(async (transaction) => {
      await Receipt.create([{ _id: checkout.id }], { session: transaction });
      const items = [];
      let needsReview = false;
      for (const item of lineItems.data) {
        const stripeProduct = item.price?.product as Stripe.Product;
        const productId = stripeProduct?.metadata?.productId;
        const quantity = item.quantity || 1;
        const product = productId && mongoose.isValidObjectId(productId)
          ? await Product.findById(productId).session(transaction)
          : await Product.findOne({ name: item.description }).session(transaction);
        if (product) {
          // Record genuine payments even if stock changed while the customer was paying.
          if (product.stock < quantity) needsReview = true;
          product.stock = Math.max(0, product.stock - quantity);
          if (!product.stock) product.status = 'out_of_stock';
          await product.save({ session: transaction });
        } else needsReview = true;
        items.push({ product: product?._id, name: item.description || 'Coffee selection', quantity,
          priceAtPurchase: (item.price?.unit_amount ?? Math.round((item.amount_subtotal || 0) / quantity)) / 100 });
      }
      const deliveryStatus = needsReview ? 'Pending' : 'Packaging';
      const [created] = await Order.create([{
        firebaseUid: uid, items,
        subtotal: (checkout.amount_subtotal || 0) / 100,
        discountTotal: (checkout.total_details?.amount_discount || 0) / 100,
        finalTotal: (checkout.amount_total || 0) / 100,
        status: 'Paid', deliveryStatus,
        fulfillmentNeedsReview: needsReview,
        timeline: [{ status: deliveryStatus, timestamp: new Date() }], stripeSessionId: checkout.id,
      }], { session: transaction });
      return created;
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const completed = await Order.findOne({ stripeSessionId: checkout.id });
      if (completed) return completed;
    }
    throw error;
  }
  if (!order) throw new Error('Order was not saved.');
  try {
    const { syncOrderStatus, syncNewOrderEvent } = await import('@/lib/firebase/sync');
    await syncOrderStatus(order._id.toString(), uid, order.deliveryStatus);
    await syncNewOrderEvent();
  } catch (error) { console.error('Order notification sync failed:', error); }
  return order;
}
