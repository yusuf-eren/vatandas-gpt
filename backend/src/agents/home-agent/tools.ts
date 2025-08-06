import { setTracingDisabled, tool } from '@openai/agents';
import { z } from 'zod';

import { PropertyModel } from '../../models/property.model';
import { DistrictEnum, RoomTypeEnum } from '../../scraper/emlakjet';

setTracingDisabled(true);

const PropertyFilterSchema = z.object({
  city: z.enum(['Istanbul']).default('Istanbul'),

  districts: z
    .array(DistrictEnum)
    .describe('List of districts to filter properties by')
    .default([]),

  roomCounts: z
    .array(RoomTypeEnum)
    .describe('List of room configurations, e.g., 1+1, 2+1')
    .default([]),

  minPrice: z
    .number()
    .nullable()
    .optional()
    .default(null)
    .describe('Minimum price of the property. If not mentioned, set it null'),
  maxPrice: z
    .number()
    .nullish()
    .default(null)
    .describe('Maximum price of the property. If not mentioned, set it null'),

  minArea: z
    .number()
    .nullish()
    .default(null)
    .describe('Minimum area of the property. If not mentioned, set it null'),
  maxArea: z
    .number()
    .nullish()
    .default(null)
    .describe('Maximum area of the property. If not mentioned, set it null'),

  tradeType: z.enum(['Kiralık', 'Satılık']).default('Satılık'),
  estateType: z.enum(['Daire', 'Arsa']).default('Daire'),
});

export type PropertyFilter = z.infer<typeof PropertyFilterSchema>;

export const getPropertiesTool = tool({
  name: 'get_properties',
  description: 'Get properties from the database with the given filters',
  parameters: PropertyFilterSchema,
  execute: async (filter: PropertyFilter) => {
    console.log('Property filter:', filter);

    // Build the query object
    const query: Record<string, any> = {};

    // Basic filters
    if (filter.city) query.city = filter.city;
    if (filter.tradeType) query.tradeTypeName = filter.tradeType;
    if (filter.estateType) query.estateTypeName = filter.estateType;

    // Array filters
    if (filter.districts?.length) {
      query.district = { $in: filter.districts };
    }
    if (filter.roomCounts?.length) {
      query.roomCountName = { $in: filter.roomCounts };
    }

    // Price range filter
    if (filter.minPrice || filter.maxPrice) {
      query['priceDetail.price'] = {};
      if (filter.minPrice) query['priceDetail.price'].$gte = filter.minPrice;
      if (filter.maxPrice) query['priceDetail.price'].$lte = filter.maxPrice;
    }

    // Area range filter
    if (filter.minArea || filter.maxArea) {
      query.squareMeter = {};
      if (filter.minArea) query.squareMeter.$gte = filter.minArea;
      if (filter.maxArea) query.squareMeter.$lte = filter.maxArea;
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // Execute the query with find()
    const results = await PropertyModel.find(query)
      .select({
        _id: 0,
        title: 1,
        url: 1,
        price: '$priceDetail',
        area: '$squareMeter',
        roomCount: '$roomCountName',
        floor: '$floorName',
        images: 1, // We'll limit this in code since $slice is aggregation-only
        district: 1,
        city: 1,
        priceDetail: 1,
        squareMeter: 1,
        roomCountName: 1,
        floorName: 1,
        imagesFullPath: 1,
      })
      .sort({ 'priceDetail.price': 1 })
      .limit(100)
      .lean()
      .exec();

    // Format the results to match the expected structure
    const formattedResults = results.map((property: any) => ({
      title: property.title,
      url: property.url,
      price: property.priceDetail,
      area: property.squareMeter,
      roomCount: property.roomCountName,
      floor: property.floorName,
      images: property.imagesFullPath?.slice(0, 3) || [],
      district: property.district,
      city: property.city,
    }));

    return formattedResults;
  },
});
