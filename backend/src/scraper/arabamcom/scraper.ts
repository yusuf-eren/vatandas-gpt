import * as axios from 'axios';
import { CarListing, Brand, Model } from './types';
import { createHttpClient, delay } from './utils';
import { processBatch } from './helpers';
import { scrapeListings } from './listing-scraper';
import { collectBrands, collectModelsForBrand } from './brand-scraper';

/**
 * Scrapes listings for a specific model of a brand
 */
async function scrapeModel(
  brand: Brand,
  model: Model,
  httpClient: axios.AxiosInstance
): Promise<CarListing[]> {
  try {
    const listings = await scrapeListings(model.url + '-istanbul', httpClient);

    return listings.map((listing) => ({
      ...listing,
      brand: brand.name,
      model: model.name,
    }));
  } catch (error) {
    console.error(`Error scraping model ${brand.name} ${model.name}:`, error);
    return [];
  }
}

/**
 * Main function to scrape car listings from a specific URL
 */
export async function scrape(targetUrl: string): Promise<CarListing[]> {
  const httpClient = createHttpClient();
  return scrapeListings(targetUrl, httpClient);
}

/**
 * Comprehensive scraper that collects all brands and their models
 */
export async function scrapeBrands(): Promise<CarListing[]> {
  const httpClient = createHttpClient();

  console.log('Collecting brands...');
  const brands = await collectBrands(httpClient);

  const allListings: CarListing[] = [];

  // Currently limited to first brand for testing - adjust slice as needed
  for (const brand of brands) {
    try {
      console.log(`\n--- Processing brand: ${brand.name} ---`);
      const models = await collectModelsForBrand(
        brand.url + '-istanbul', // pilot: istanbul
        httpClient
      );

      console.log('models are here', models);

      const brandListings = await processBatch(
        models,
        (model) => scrapeModel(brand, model, httpClient),
        2, // batch size
        1500 // delay in ms
      );

      const flattenedListings = brandListings.flat();
      allListings.push(...flattenedListings);

      await delay(2000);
    } catch (error) {
      console.error(`Error processing brand ${brand.name}:`, error);
    }
  }

  return allListings;
}
