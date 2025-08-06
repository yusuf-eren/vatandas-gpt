import { model, Schema } from 'mongoose';

// TODO: Adjust required fields
const DamageInfoSchema = new Schema(
  {
    Code: { type: String, required: false },
    Name: { type: String, required: false },
    Value: { type: String, required: false },
    ImagePath: { type: String, default: null },
    Order: { type: Number, required: false },
    ValueDescription: { type: String, required: false },
    ValueText: { type: String, required: false },
    PartNumber: { type: Number, required: false },
  },
  { _id: false }
);

// TODO: Adjust required fields
const AutomobileSchema = new Schema(
  {
    name: { type: String, required: false },
    title: { type: String, required: false },
    price: { type: String, required: false },
    year: { type: String, required: false },
    location: { type: String, required: false },
    date: { type: String, required: false },
    images: [{ type: String, required: false }],
    url: { type: String, required: false },
    description: { type: String, required: false },
    damageInfo: [DamageInfoSchema],
    tramerAmount: { type: String, required: false },
    specs: { type: Schema.Types.Mixed, required: false },
    brand: { type: String, required: false },
    model: { type: String, required: false },
    embedding: { type: [Number], required: false },
  },
  { timestamps: true }
);

export const AutomobileModel = model('Automobile', AutomobileSchema);
