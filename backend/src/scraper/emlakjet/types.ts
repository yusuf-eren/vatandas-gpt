import { z } from 'zod';

export const RoomTypeEnum = z.enum([
  '1+0',
  '1+1',
  '2+1',
  '3+1',
  '4+1',
  '4+2',
  '5+1',
]);
export type RoomType = z.infer<typeof RoomTypeEnum>;

export const BuildingAgeEnum = z.enum([
  '0',
  '1',
  '2',
  '3',
  '4',
  '5-10',
  '11-15',
  '16-20',
  '21+',
]);
export type BuildingAge = z.infer<typeof BuildingAgeEnum>;

export const DistrictEnum = z.enum([
  'adalar',
  'arnavutkoy',
  'atasehir',
  'avcilar',
  'bagcilar',
  'bahcelievler',
  'bakirkoy',
  'basaksehir',
  'bayrampasa',
  'besiktas',
  'beykoz',
  'beylikduzu',
  'beyoglu',
  'buyukcekmece',
  'catalca',
  'cekmekoy',
  'esenler',
  'esenyurt',
  'eyupsultan',
  'fatih',
  'gaziosmanpasa',
  'gungoren',
  'kadikoy',
  'kagithane',
  'kartal',
  'kucukcekmece',
  'maltepe',
  'pendik',
  'sancaktepe',
  'sariyer',
  'silivri',
  'sultanbeyli',
  'sultangazi',
  'sile',
  'sisli',
  'tuzla',
  'umraniye',
  'uskudar',
  'zeytinburnu',
]);

export const ALL_DISTRICTS = DistrictEnum.options;

export type District = z.infer<typeof DistrictEnum>;

export const EmlakjetTypeEnum = z.enum(['buy', 'rent']);
export type EmlakjetType = z.infer<typeof EmlakjetTypeEnum>;

export const EmlakjetPropertyTypeEnum = z.enum(['kiralik', 'satilik']);
export type EmlakjetPropertyType = z.infer<typeof EmlakjetPropertyTypeEnum>;

// Filter schema
export const EmlakjetFilterSchema = z.object({
  type: EmlakjetTypeEnum.nullable().default('buy').describe('buy or rent'),
  min_price: z
    .number()
    .min(1)
    .nullable()
    .default(null)
    .describe('Null is no limit'),
  max_price: z
    .number()
    .min(1)
    .nullable()
    .default(null)
    .describe('Null is no limit'),
  min_m2: z
    .number()
    .min(1)
    .nullable()
    .default(null)
    .describe('Null is no limit'),
  max_m2: z
    .number()
    .min(1)
    .nullable()
    .default(null)
    .describe('Null is no limit'),
  rooms: z
    .array(RoomTypeEnum)
    .nullable()
    .default(null)
    .describe('Null is no limit'),
  building_age: z
    .array(BuildingAgeEnum)
    .nullable()
    .default(null)
    .describe('Null is no limit'),
  district: DistrictEnum.nullable().default(null).describe('Null is no limit'),
});
export type EmlakjetFilter = z.infer<typeof EmlakjetFilterSchema>;

export type EmlakjetSearchResponse = {
  selectionResponse: {
    allListings: Array<{
      id: number;
      categoryTypeName: string;
      tradeTypeName: string;
      estateTypeName: string;
      title: string;
      url: string;
      imagesFullPath: string[];
      quickInfos: Array<{
        key: string;
        name: string;
        value: string;
      }>;
      location: {
        coordinate: {
          lat: number;
          lon: number;
        };
      };
      roomCountName: string;
      floorName: string;
      squareMeter?: number;
      badges: string[];
      phoneNumber?: string;
      priceDetail: {
        currency: string;
        price: number;
        opportunity: boolean;
      };
      type: string;
    }>;
  };
};

export interface EmlakjetPropertyDetailsResponse {
  title: string;
  description: string;
  uiBoxContent: {
    mainHeading?: string;
    paragraphs: string[];
    lists: Array<{
      title?: string;
      items: string[];
    }>;
    highlights: string[];
  };
  // Add other fields as needed
}

export interface EmlakjetNearbyPlacesResponse {
  status: string;
  result: Array<{
    categoryId: number;
    categoryKey: string;
    categoryName: string;
    poies: Array<{
      id: number;
      name: string;
      distance: string;
      coordinates: {
        lat: number;
        lon: number;
      };
    }>;
  }>;
}
