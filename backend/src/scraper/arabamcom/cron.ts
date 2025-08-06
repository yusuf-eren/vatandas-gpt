import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { scrapeBrands } from './scraper';
import { AutomobileModel } from '../../models/automobile.model';
import { CronJob } from 'cron';
import db from '../../db';
import { CarListing } from './types';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// TODO: make cron / add data removal
const arabamcomScraperJob = async () => {
  await db();
  console.log('Connected to MongoDB, starting scraper...');
  const listings = await scrapeBrands();

  console.log(JSON.stringify(listings, null, 2));

  for (let i = 0; i < listings.length; i += 100) {
    const batch = listings.slice(i, i + 100);
    try {
      const embeddings = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: batch.map(
          (listing: CarListing) =>
            `${listing.name} - ${listing.title} - ${listing.brand} - ${listing.model} - ${listing.year} - ${listing.price} - ${listing.description} - ${JSON.stringify(listing.damageInfo)} - ${listing.tramerAmount} - ${JSON.stringify(listing.specs)}`
        ),
      });

      await AutomobileModel.insertMany(
        batch.map((listing: CarListing, index: number) => ({
          ...listing,
          embedding: embeddings.embeddings?.[index]?.values,
        }))
      );
      console.log(
        `Inserted batch ${Math.floor(i / 100) + 1} of ${Math.ceil(listings.length / 100)}`
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error inserting batch ${Math.floor(i / 100) + 1}:`, error);
    }
  }

  console.log(`Total listings processed: ${listings.length}`);
};

arabamcomScraperJob();
