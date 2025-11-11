import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShopAsset extends Document {
  name: string;
  description: string;
  link: string;
  category: 'Enemy' | 'Interactable Object' | 'Player Action' | 'Player Extension';
  subCategory?: string; // For subcategories like "Close Range Enemy"
  price: number; // Price in HamsterCoin
  createdBy: string; // Discord ID of creator
  createdAt: Date;
  updatedAt: Date;
}

const ShopAssetSchema = new Schema<IShopAsset>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Enemy', 'Interactable Object', 'Player Action', 'Player Extension'],
      required: true,
    },
    subCategory: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ShopAsset: Model<IShopAsset> =
  mongoose.models.ShopAsset ||
  mongoose.model<IShopAsset>('ShopAsset', ShopAssetSchema);

export default ShopAsset;

