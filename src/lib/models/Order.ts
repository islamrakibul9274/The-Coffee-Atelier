import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  product?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface IOrderTimeline {
  status: 'Pending' | 'Packaging' | 'Delivering' | 'Delivered' | 'Cancelled';
  timestamp: Date;
}

export interface IOrder extends Document {
  firebaseUid: string;
  items: IOrderItem[];
  subtotal: number;
  discountTotal: number;
  finalTotal: number;
  status: 'Pending' | 'Paid' | 'Failed';
  deliveryStatus: 'Pending' | 'Packaging' | 'Delivering' | 'Delivered' | 'Cancelled';
  timeline: IOrderTimeline[];
  stripeSessionId?: string;
  fulfillmentNeedsReview: boolean;
  createdAt: Date;
}

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
});

const OrderTimelineSchema = new Schema({
  status: { type: String, enum: ['Pending', 'Packaging', 'Delivering', 'Delivered', 'Cancelled'], required: true },
  timestamp: { type: Date, default: Date.now },
});

const OrderSchema: Schema = new Schema({
  firebaseUid: { type: String, required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  finalTotal: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  deliveryStatus: { type: String, enum: ['Pending', 'Packaging', 'Delivering', 'Delivered', 'Cancelled'], default: 'Pending' },
  timeline: [OrderTimelineSchema],
  stripeSessionId: { type: String },
  fulfillmentNeedsReview: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
