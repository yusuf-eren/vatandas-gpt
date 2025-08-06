import { z } from 'zod';

export const SLIDER_MAIN_SIZE = '580x435';
export const SLIDER_CHILD_SIZE = '120x90';

export const BASE_URL = 'https://www.arabam.com/ikinci-el/otomobil-istanbul';

export const BodyTypeEnum = z.enum([
  'Cabriolet',
  'Coupe',
  'Mpv',
  'Pickup',
  'Roadster',
  'Sedan',
  'Station wagon',
  'SUV',
]);
export type BodyType = z.infer<typeof BodyTypeEnum>;

export const FuelTypeEnum = z.enum([
  'Benzin',
  'Dizel',
  'Elektrik',
  'Hibrit',
  'LPG',
]);
export type FuelType = z.infer<typeof FuelTypeEnum>;

export const ColorEnum = z.enum([
  'Beyaz',
  'Bordo',
  'Gri',
  'Gri (Gümüş)',
  'Gri (metalik)',
  'Kırmızı',
  'Siyah',
  'Yeşil (metalik)',
]);
export type Color = z.infer<typeof ColorEnum>;

export const ArabamcomFilterSchema = z.object({
  bodyTypes: z
    .array(BodyTypeEnum)
    .nullable()
    .default(null)
    .describe('Car body types to filter by'),
  fuelTypes: z
    .array(FuelTypeEnum)
    .nullable()
    .default(null)
    .describe('Fuel types to filter by'),
  colors: z
    .array(ColorEnum)
    .nullable()
    .default(null)
    .describe('Car colors to filter by'),
  minKm: z
    .number()
    .min(0)
    .nullable()
    .default(null)
    .describe('Minimum kilometers'),
  maxKm: z
    .number()
    .min(0)
    .nullable()
    .default(null)
    .describe('Maximum kilometers'),
  minYear: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .nullable()
    .default(null)
    .describe('Minimum year'),
  maxYear: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .nullable()
    .default(null)
    .describe('Maximum year'),
  minPrice: z
    .number()
    .min(0)
    .nullable()
    .default(null)
    .describe('Minimum price in TL'),
  maxPrice: z
    .number()
    .min(0)
    .nullable()
    .default(null)
    .describe('Maximum price in TL'),
  cities: z
    .array(z.string())
    .nullable()
    .default(null)
    .describe('Cities to search in'),
});

export type ArabamcomFilter = z.infer<typeof ArabamcomFilterSchema>;

export interface DamageInfo {
  code: string;
  name: string;
  value: string;
  valueDescription: string;
  valueText: string;
}

export interface CarSpecs {
  year?: string;
  mileage?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  engineSize?: string;
  power?: string;
  torque?: string;
  consumption?: string;
  [key: string]: string | undefined;
}

export interface CarListing {
  id: string;
  name: string;
  title: string;
  price: string;
  year: string;
  location: string;
  date: string;
  images: string[];
  url: string;
  brand?: string;
  model?: string;
  description?: string;
  damageInfo?: DamageInfo[];
  tramerAmount?: string;
  specs?: CarSpecs;
  equipment?: string[];
}

export interface Brand {
  name: string;
  url: string;
  count: string;
}

export interface Model {
  name: string;
  url: string;
  count: string;
}

export interface DetailedCarInfo {
  description?: string;
  damageInfo?: any[];
  tramerAmount?: string;
  specs?: any;
  equipment?: string[];
}
