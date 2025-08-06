import mongoose, { Schema, Document } from 'mongoose';

export interface IQuickInfo {
  key: string;
  name: string;
  value: string;
}

export interface ILocation {
  coordinate: {
    lat: number;
    lon: number;
  };
}

export interface IPriceDetail {
  currency: string;
  price: number;
  opportunity: boolean;
}

export interface INearbyPlace {
  id: number;
  name: string;
  distance: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface INearbyCategory {
  categoryId: number;
  categoryKey: string;
  categoryName: string;
  poies: INearbyPlace[];
}

export interface IProperty extends Document {
  id: number;
  categoryTypeName: string;
  tradeTypeName: string;
  estateTypeName: string;
  title: string;
  url: string;
  imagesFullPath: string[];
  quickInfos: IQuickInfo[];
  location: ILocation;
  roomCountName: string;
  floorName: string;
  squareMeter: number;
  badges: string[];
  phoneNumber: string;
  priceDetail: IPriceDetail;
  type: string;
  city: string;
  district: string;
  description?: string;
  nearbyPlaces?: INearbyCategory[];
  embedding?: number[];
}

const QuickInfoSchema = new Schema<IQuickInfo>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const LocationSchema = new Schema<ILocation>(
  {
    coordinate: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
  },
  { _id: false }
);

const PriceDetailSchema = new Schema<IPriceDetail>(
  {
    currency: { type: String, required: true },
    price: { type: Number, required: true },
    opportunity: { type: Boolean, required: true },
  },
  { _id: false }
);

const NearbyPlaceSchema = new Schema<INearbyPlace>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    distance: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
  },
  { _id: false }
);

const NearbyCategorySchema = new Schema<INearbyCategory>(
  {
    categoryId: { type: Number, required: true },
    categoryKey: { type: String, required: true },
    categoryName: { type: String, required: true },
    poies: { type: [NearbyPlaceSchema], required: true },
  },
  { _id: false }
);

const PropertySchema = new Schema<IProperty>({
  id: { type: Number, required: true, unique: true },
  categoryTypeName: { type: String, required: true },
  tradeTypeName: { type: String, required: true },
  estateTypeName: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  imagesFullPath: [{ type: String, required: false }],
  quickInfos: { type: [QuickInfoSchema], required: false },
  location: { type: LocationSchema, required: false },
  roomCountName: { type: String, required: false },
  floorName: { type: String, required: false },
  squareMeter: { type: Number, required: false },
  badges: [{ type: String, required: false }],
  phoneNumber: { type: String, required: false },
  priceDetail: { type: PriceDetailSchema, required: false },
  type: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  description: { type: String, required: false },
  nearbyPlaces: { type: [NearbyCategorySchema], required: false },
  embedding: { type: [Number], required: false },
});

export const PropertyModel =
  mongoose.models.Property ||
  mongoose.model<IProperty>('Property', PropertySchema, 'properties');
