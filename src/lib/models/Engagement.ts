import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  firebaseUid: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  firebaseUid: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  createdAt: Date;
  isActive: boolean;
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export const Announcement: Model<IAnnouncement> = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export interface INotifyRequest extends Document {
  productId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
}

const NotifyRequestSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const NotifyRequest: Model<INotifyRequest> = mongoose.models.NotifyRequest || mongoose.model<INotifyRequest>('NotifyRequest', NotifyRequestSchema);
