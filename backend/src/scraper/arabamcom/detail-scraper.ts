import * as axios from 'axios';
import * as cheerio from 'cheerio';
import { DetailedCarInfo } from './types';

/**
 * Scrapes detailed car information from a listing page
 */
export async function getDetailedCarInfo(
  url: string,
  httpClient: axios.AxiosInstance
): Promise<DetailedCarInfo> {
  try {
    const response = await httpClient.get(url);
    const $ = cheerio.load(response.data);

    const description = $('#tab-description div').first().text().trim();

    let damageInfo: any[] = [];
    let tramerAmount = '';

    const scriptContent = $('script').text();
    const damageMatch = scriptContent.match(/window\.damage\s*=\s*(\[.*?\]);/s);
    if (damageMatch) {
      try {
        damageInfo = JSON.parse(damageMatch[1]);
      } catch (e) {
        console.error('Error parsing damage info:', e);
      }
    }

    const tramerElement = $('.tramer-info .property-value');
    if (tramerElement.length > 0) {
      tramerAmount = tramerElement.text().trim();
    }

    const specs: any = {};
    $('#tab-car-information .tab-content-car-information li').each(
      (_, element) => {
        const $item = $(element);
        const key = $item.find('.property-key').text().trim();
        const value = $item.find('.property-value').text().trim();
        if (key && value) {
          specs[key] = value;
        }
      }
    );

    const equipment: string[] = [];
    $('#tab-equipment-information .equipment-list li').each((_, element) => {
      const equipmentItem = $(element).text().trim();
      if (equipmentItem) {
        equipment.push(equipmentItem);
      }
    });

    return {
      description: description || undefined,
      damageInfo: damageInfo.length > 0 ? damageInfo : undefined,
      tramerAmount: tramerAmount || undefined,
      specs: Object.keys(specs).length > 0 ? specs : undefined,
      equipment: equipment.length > 0 ? equipment : undefined,
    };
  } catch (error) {
    console.error(`Error fetching detailed info from ${url}:`, error);
    return {};
  }
}
