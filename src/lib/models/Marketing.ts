import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBanner extends Document {
  imageUrl: string;
  targetUrl?: string;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  isActive: boolean;
}

const BannerSchema: Schema = new Schema({
  imageUrl: { type: String, required: true },
  targetUrl: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  priority: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Banner: Model<IBanner> = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export interface IDiscount extends Document {
  name: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  appliesTo: {
    type: 'all' | 'category' | 'product';
    targetId?: mongoose.Types.ObjectId;
  };
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  repeatWeekly: boolean;
}

const DiscountSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed', 'bogo'], required: true },
  value: { type: Number, required: true },
  appliesTo: {
    type: { type: String, enum: ['all', 'category', 'product'], required: true },
    targetId: { type: Schema.Types.ObjectId },
  },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  repeatWeekly: { type: Boolean, default: false },
}, { timestamps: true });


export const Discount: Model<IDiscount> = mongoose.models.Discount || mongoose.model<IDiscount>('Discount', DiscountSchema);
