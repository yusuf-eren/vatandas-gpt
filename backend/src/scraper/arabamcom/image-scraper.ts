import * as axios from 'axios';
import * as cheerio from 'cheerio';
import { convertToMainSize } from './helpers';

/**
 * Scrapes images from a car listing page
 */
export async function getListingImages(
  url: string,
  httpClient: axios.AxiosInstance
): Promise<string[]> {
  try {
    const response = await httpClient.get(url);
    const $ = cheerio.load(response.data);
    const images: string[] = [];

    $('#thumbnail .swiper-wrapper .swiper-slide img').each((index, element) => {
      if (index >= 3) return false;
      const $img = $(element);
      const imageUrl = $img.attr('src') || $img.attr('data-src') || '';
      if (imageUrl && !imageUrl.includes('noImage')) {
        images.push(convertToMainSize(imageUrl));
      }
    });

    return images;
  } catch (error) {
    console.error(`Error fetching images from ${url}:`, error);
    return [];
  }
}
