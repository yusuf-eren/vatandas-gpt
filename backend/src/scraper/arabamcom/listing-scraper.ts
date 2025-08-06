import * as axios from 'axios';
import * as cheerio from 'cheerio';
import { CarListing } from './types';
import { convertToMainSize, processBatch } from './helpers';
import { getListingImages } from './image-scraper';
import { getDetailedCarInfo } from './detail-scraper';

/**
 * Enriches a basic listing with detailed information and images
 */
async function enrichListing(
  listing: CarListing,
  httpClient: axios.AxiosInstance
): Promise<CarListing> {
  try {
    const [images, detailInfo] = await Promise.all([
      getListingImages(listing.url, httpClient),
      getDetailedCarInfo(listing.url, httpClient),
    ]);

    const enrichedListing: CarListing = {
      ...listing,
      images,
      description: detailInfo.description,
      damageInfo: detailInfo.damageInfo,
      tramerAmount: detailInfo.tramerAmount,
      specs: detailInfo.specs,
      equipment: detailInfo.equipment,
    };

    return enrichedListing;
  } catch (error) {
    console.error(`Failed to enrich listing ${listing.id}:`, error);
    return listing;
  }
}

/**
 * Scrapes car listings from a given URL
 */
export async function scrapeListings(
  targetUrl: string,
  httpClient: axios.AxiosInstance,
  concurrentRequests: number = 3
): Promise<CarListing[]> {
  try {
    const response = await httpClient.get(targetUrl);
    const $ = cheerio.load(response.data);
    const listings: CarListing[] = [];

    $(
      '.listing-table-wrapper .table.listing-table.w100 tbody tr.listing-list-item'
    ).each((_, element) => {
      const $listing = $(element);

      const id = $listing.attr('id')?.replace('listing', '') || '';

      const name = $listing
        .find('.listing-modelname .listing-text-new')
        .text()
        .trim();

      const title = $listing.find('.listing-title-lines').text().trim();

      const price = $listing.find('.listing-price').text().trim();

      const year = $listing
        .find('td.listing-text')
        .first()
        .find('a')
        .text()
        .trim();

      const date = $listing.find('td.listing-text.tac a').text().trim();

      const locationSpans = $listing
        .find('td.listing-text')
        .last()
        .find('span[title]');

      const location = locationSpans
        .map((_, el) => $(el).attr('title'))
        .get()
        .join(', ');

      const url = $listing.find('a.link-overlay').attr('href') || '';

      const mainImage = $listing.find('img').first().attr('src') || '';

      const images = mainImage ? [convertToMainSize(mainImage)] : [];

      if (id && name && price) {
        const fullUrl = url.startsWith('/')
          ? `https://www.arabam.com${url}`
          : url;
        listings.push({
          id,
          name,
          title,
          price,
          year,
          location,
          date,
          images,
          url: fullUrl,
        });
      }
    });

    if (listings.length > 0) {
      console.log(
        `Found ${listings.length} listings, enriching with detailed info...`
      );
      const enrichedListings = await processBatch(
        listings,
        (listing) => enrichListing(listing, httpClient),
        concurrentRequests,
        1000
      );
      return enrichedListings;
    }

    console.log(listings);
    return listings;
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    throw error;
  }
}
