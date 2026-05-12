import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  basePrice: number;
  status: 'active' | 'coming_soon' | 'out_of_stock';
  comingSoonLaunchDate?: Date;
  imageUrl?: string;
  stock: number;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  basePrice: { type: Number, required: true },
  status: { type: String, enum: ['active', 'coming_soon', 'out_of_stock'], default: 'active' },
  comingSoonLaunchDate: { type: Date },
  imageUrl: { type: String },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
