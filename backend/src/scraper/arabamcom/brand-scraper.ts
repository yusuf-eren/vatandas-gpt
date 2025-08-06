import * as axios from 'axios';
import * as cheerio from 'cheerio';
import { Brand, Model, BASE_URL } from './types';

/**
 * Collects all available car brands from arabam.com
 */
export async function collectBrands(
  httpClient: axios.AxiosInstance
): Promise<Brand[]> {
  const response = await httpClient.get(BASE_URL);
  const $ = cheerio.load(response.data);

  const brands: Brand[] = [];

  const selectors = [
    '.scrollable-category .category-list-wrapper .inner-list li a.list-item',
    '.category-list-wrapper .inner-list li a.list-item',
    '.inner-list li a.list-item',
    'a.list-item',
    '.list-item',
  ];

  for (const selector of selectors) {
    const elements = $(selector);

    if (elements.length > 0) {
      elements.each((_, element) => {
        const $brand = $(element);

        let brandName = $brand.find('.list-name').text().trim();
        if (!brandName) {
          brandName = $brand.find('span.list-name').text().trim();
        }
        if (!brandName) {
          brandName = $brand.find('.mr4').text().trim();
        }
        if (!brandName) {
          const url = $brand.attr('href') || '';
          const match = url.match(/\/otomobil\/([^-]+)/);
          if (match) {
            brandName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          }
        }

        const brandCount = $brand.find('.count').text().trim();
        const brandUrl = $brand.attr('href') || '';

        if (brandName && brandUrl && brandUrl.includes('/otomobil/')) {
          const fullUrl = brandUrl.startsWith('/')
            ? `https://www.arabam.com${brandUrl}`
            : brandUrl;
          brands.push({
            name: brandName,
            url: fullUrl,
            count: brandCount,
          });
        }
      });
      break;
    }
  }

  return brands;
}

/**
 * Collects all models for a specific brand
 */
export async function collectModelsForBrand(
  brandUrl: string,
  httpClient: axios.AxiosInstance
): Promise<Model[]> {
  try {
    console.log(`Collecting models for brand: ${brandUrl}`);
    const response = await httpClient.get(brandUrl);
    const $ = cheerio.load(response.data);

    const models: Model[] = [];

    const selectors = [
      '.scrollable-category .category-list-wrapper .inner-list li a.list-item',
      '.category-list-wrapper .inner-list li a.list-item',
      '.inner-list li a.list-item',
      'a.list-item',
    ];

    for (const selector of selectors) {
      const elements = $(selector);

      if (elements.length > 0) {
        elements.each((_, element) => {
          const $model = $(element);

          let modelName = $model.find('.list-name').text().trim();
          if (!modelName) {
            modelName = $model.find('span.list-name').text().trim();
          }
          if (!modelName) {
            modelName = $model.find('.mr4').text().trim();
          }

          if (!modelName) {
            const url = $model.attr('href') || '';
            const match = url.match(/\/otomobil\/[^-]+-(.+)$/);
            if (match) {
              modelName = match[1].replace(/-/g, ' ').toUpperCase();
            }
          }

          const modelCount = $model.find('.count').text().trim();
          const modelUrl = $model.attr('href') || '';

          if (modelUrl && modelUrl.length > 0 && modelName.length > 0) {
            const fullUrl = modelUrl.startsWith('/')
              ? `https://www.arabam.com${modelUrl}`
              : modelUrl;
            models.push({
              name: modelName,
              url: fullUrl,
              count: modelCount,
            });
          }
        });
        break;
      }
    }

    return models;
  } catch (error) {
    console.error(`Error collecting models for brand ${brandUrl}:`, error);
    return [];
  }
}
