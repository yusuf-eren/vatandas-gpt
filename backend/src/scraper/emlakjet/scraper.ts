import axios from 'axios';
import * as cheerio from 'cheerio';
import { EmlakjetURLBuilder } from './builder';
import { EmlakjetFilter, EmlakjetPropertyDetailsResponse } from './types';

export interface EmlakjetListing {
  title: string;
  url: string;
  image: string | null;
  type: string | null;
  room: string | null;
  floor: string | null;
  area: string | null;
}

export class EmlakjetScraper {
  constructor(private urlBuilder?: EmlakjetURLBuilder) {}

  async scrape(filters: EmlakjetFilter): Promise<EmlakjetListing[]> {
    if (!this.urlBuilder) {
      throw new Error('URL builder is not set');
    }

    const url = this.urlBuilder
      .setPrice(filters.min_price, filters.max_price)
      .setSize(filters.min_m2, filters.max_m2)
      .setRooms(filters.rooms)
      .setBuildingAge(filters.building_age)
      .setDistrict(filters.district)
      .setType(filters.type)
      .build();

    return await this.#scrapeEmlakjetLinks(url);
  }

  async #scrapeEmlakjetLinks(url: string): Promise<EmlakjetListing[]> {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(res.data);
    const wrapper = $('div.styles_wrapper__aHXTR');
    if (!wrapper.length) return [];

    const listings: EmlakjetListing[] = [];

    wrapper.find('a.styles_wrapper__H_QG2').each((_, el) => {
      const anchor = $(el);
      const href = anchor.attr('href');
      const title =
        anchor.find('h3.styles_title__CN_n3').text().trim() || 'No title';
      const image =
        anchor.find('img.styles_imageClass__Hobyr').attr('src') || null;
      const infoText = anchor
        .find('div.styles_quickinfoWrapper__F5BBD')
        .text()
        .trim();
      const parts = infoText.split('|').map((s: string) => s.trim());
      const [type, room, floor, area] = parts;

      if (href) {
        listings.push({
          title,
          url: `https://www.emlakjet.com${href}`,
          image,
          type: type || null,
          room: room || null,
          floor: floor || null,
          area: area || null,
        });
      }
    });

    return listings;
  }

  async scrapePropertyDetails(
    slug: string
  ): Promise<EmlakjetPropertyDetailsResponse> {
    const baseUrl = 'https://www.emlakjet.com/ilan/';
    const res = await axios.get(`${baseUrl}${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(res.data);

    // Extract title
    const title = $('h1').first().text().trim() || 'No title';

    // Extract description
    const description = $('.property-description').text().trim() || '';

    // Extract and parse uiBoxContainer HTML content to structured JSON
    const uiBoxContainer = $('.uiBoxContainer');
    const uiBoxContent = {
      mainHeading: '',
      paragraphs: [] as string[],
      lists: [] as Array<{ title?: string; items: string[] }>,
      highlights: [] as string[],
    };

    if (uiBoxContainer.length > 0) {
      // Extract main heading (strong/bold text at the beginning)
      const mainHeadingEl = uiBoxContainer
        .find('span[style*="font-weight: bold"] strong, strong')
        .first();
      if (mainHeadingEl.length > 0) {
        uiBoxContent.mainHeading = mainHeadingEl.text().trim();
      }

      // Keep track of processed list titles to avoid duplication
      const processedListTitles = new Set<string>();

      // Extract lists first to identify their titles
      uiBoxContainer.find('ul').each((_, ul) => {
        const listItems: string[] = [];
        const prevElement = $(ul).prev();
        let listTitle = '';

        // Check if there's a paragraph before this list that might be its title
        if (prevElement.is('p')) {
          const prevText = prevElement.text().trim();
          if (
            prevText.endsWith(':') ||
            prevText.includes('Avantaj') ||
            prevText.includes('Özellik')
          ) {
            listTitle = prevText;
            processedListTitles.add(prevText);
          }
        }

        $(ul)
          .find('li')
          .each((_, li) => {
            const itemText = $(li).text().trim();
            if (itemText && itemText !== '') {
              listItems.push(itemText);
            }
          });

        if (listItems.length > 0) {
          uiBoxContent.lists.push({
            title: listTitle || undefined,
            items: listItems,
          });
        }
      });

      // Extract paragraphs (excluding empty ones and list titles)
      uiBoxContainer.find('p').each((_, el) => {
        const text = $(el).text().trim();
        if (
          text &&
          text !== '' &&
          !text.match(/^\s*$/) &&
          !processedListTitles.has(text) &&
          text !== uiBoxContent.mainHeading
        ) {
          uiBoxContent.paragraphs.push(text);
        }
      });

      // Extract highlights (text with special formatting like ✨ or strong tags)
      uiBoxContainer.find('p, span').each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes('✨') || text.includes('⭐') || text.includes('💫')) {
          const cleanText = text.replace(/[✨⭐💫]/gu, '').trim();
          if (cleanText && !uiBoxContent.highlights.includes(cleanText)) {
            uiBoxContent.highlights.push(cleanText);
          }
        }
      });
    }

    return {
      title,
      description,
      uiBoxContent,
    };
  }
}

// Example usage:
// new EmlakjetScraper()
//   .scrapePropertyDetails('arnavutkoy-merkeze-yakin-sifir-dublex-17761134')
//   .then(result => console.log(JSON.stringify(result, null, 2)));
