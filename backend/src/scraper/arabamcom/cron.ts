import 'dotenv/config';
import OpenAI from 'openai';

import { scrapeBrands } from './scraper';
import { AutomobileModel } from '../../models/automobile.model';

import db from '../../db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const arabamcomScraperJob = async () => {
  await db();
  console.log('Connected to MongoDB, starting scraper...');
  const listings = await scrapeBrands();

  console.log(JSON.stringify(listings, null, 2));
  const batchSize = 1000;
  const processedDocuments = [];

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    try {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: `${listing.name} - ${listing.title} - ${listing.brand} - ${listing.model} - ${listing.year} - ${listing.price} - ${listing.description} - ${JSON.stringify(listing.damageInfo)} - ${listing.tramerAmount} - ${JSON.stringify(listing.specs)}`,
        encoding_format: 'float',
      });

      processedDocuments.push({
        ...listing,
        embedding: embedding.data[0].embedding,
      });

      console.log(
        `Prepared embedding for listing ${i + 1} of ${listings.length}`
      );

      if (
        processedDocuments.length === batchSize ||
        i === listings.length - 1
      ) {
        await AutomobileModel.insertMany(processedDocuments);
        console.log(`Inserted batch of ${processedDocuments.length} documents`);
        processedDocuments.length = 0;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing listing ${i + 1}:`, error);
    }
  }

  console.log(`Total listings processed: ${listings.length}`);
};

arabamcomScraperJob();
