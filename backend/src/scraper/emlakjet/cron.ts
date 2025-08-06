import { CronJob } from 'cron';
import { PropertyModel } from '../../models/property.model';
import { EmlakjetAPI } from './api';
import { EmlakjetScraper } from './scraper';
import { ALL_DISTRICTS } from './types';

const api = new EmlakjetAPI();
const scraper = new EmlakjetScraper();

// Helper function to extract slug from URL
const extractSlugFromUrl = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 1] || '';
};

// Helper function to create description from property details
const createDescription = (
  title: string,
  uiBoxContent: {
    mainHeading?: string;
    paragraphs: string[];
    lists: Array<{ title?: string; items: string[] }>;
    highlights: string[];
  }
): string => {
  let description = title;

  if (uiBoxContent.mainHeading) {
    description += ` - ${uiBoxContent.mainHeading}`;
  }

  if (uiBoxContent.paragraphs?.length > 0) {
    description += ` ${uiBoxContent.paragraphs.join(' ')}`;
  }

  if (uiBoxContent.lists?.length > 0) {
    for (const list of uiBoxContent.lists) {
      if (list.title) {
        description += ` ${list.title}`;
      }
      if (list.items?.length > 0) {
        description += ` ${list.items.join(' ')}`;
      }
    }
  }

  if (uiBoxContent.highlights?.length > 0) {
    description += ` ${uiBoxContent.highlights.join(' ')}`;
  }

  return description.trim();
};

// Every day once at 00:00
export const emlakjetScraperJob = new CronJob(
  '0 0 * * *',
  async () => {
    console.log('Starting emlakjetScraperJob');
    for (const district of ALL_DISTRICTS) {
      const promises = await Promise.all([
        api.search('kiralik', district),
        api.search('satilik', district),
      ]);

      const listings = [
        ...promises[0].selectionResponse.allListings,
        ...promises[1].selectionResponse.allListings,
      ];

      // Get existing properties for this district
      const existingProperties = await PropertyModel.find({ district });

      // Create composite key for property comparison
      const createPropertyKey = (item: {
        title: string;
        tradeTypeName: string;
        estateTypeName: string;
        categoryTypeName: string;
      }) =>
        `${item.title}-${item.tradeTypeName}-${item.estateTypeName}-${item.categoryTypeName}`;

      // Create maps for efficient lookup
      const existingMap = new Map();
      existingProperties.forEach((prop) => {
        const key = createPropertyKey(prop);
        existingMap.set(key, prop);
      });

      const newMap = new Map();
      listings.forEach((listing) => {
        const key = createPropertyKey(listing);
        newMap.set(key, listing);
      });

      // Find properties to delete (exist in old but not in new)
      const toDelete = [];
      for (const [key, existingProp] of existingMap) {
        if (!newMap.has(key)) {
          toDelete.push(existingProp._id);
        }
      }

      // Find properties to update or insert
      const toUpdate = [];
      const toInsert = [];

      for (const [key, newListing] of newMap) {
        if (existingMap.has(key)) {
          // Property exists, check if data has changed
          const existingProp = existingMap.get(key);

          // Check if data has changed
          const hasChanges =
            existingProp.id !== newListing.id ||
            existingProp.url !== newListing.url ||
            JSON.stringify(existingProp.imagesFullPath?.sort()) !==
              JSON.stringify(newListing.imagesFullPath?.sort()) ||
            JSON.stringify(existingProp.quickInfos) !==
              JSON.stringify(newListing.quickInfos) ||
            JSON.stringify(existingProp.location) !==
              JSON.stringify(newListing.location) ||
            existingProp.roomCountName !== newListing.roomCountName ||
            existingProp.floorName !== newListing.floorName ||
            existingProp.squareMeter !== newListing.squareMeter ||
            JSON.stringify(existingProp.badges?.sort()) !==
              JSON.stringify(newListing.badges?.sort()) ||
            existingProp.phoneNumber !== newListing.phoneNumber ||
            JSON.stringify(existingProp.priceDetail) !==
              JSON.stringify(newListing.priceDetail) ||
            existingProp.type !== newListing.type;

          if (hasChanges) {
            // Update existing property
            toUpdate.push({
              existing: existingProp,
              new: newListing,
            });
          }
          // If no changes at all, do nothing (as requested)
        } else {
          // New listing
          toInsert.push(newListing);
        }
      }

      let totalOperations = 0;

      // Delete properties that no longer exist
      if (toDelete.length > 0) {
        await PropertyModel.deleteMany({ _id: { $in: toDelete } });
        totalOperations += toDelete.length;
        console.log(`Deleted ${toDelete.length} properties for ${district}`);
      }

      // Update existing properties (keep existing embeddings)
      if (toUpdate.length > 0) {
        for (const { existing, new: newListing } of toUpdate) {
          await PropertyModel.updateOne(
            { _id: existing._id },
            {
              ...newListing,
              city: 'Istanbul',
              district,
            }
          );
        }
        totalOperations += toUpdate.length;
        console.log(`Updated ${toUpdate.length} properties for ${district}`);
      }

      // Insert new properties with description and nearby places
      if (toInsert.length > 0) {
        console.log(
          `Processing ${toInsert.length} new properties for ${district}...`
        );

        const enrichedListings = [];

        for (let i = 0; i < toInsert.length; i++) {
          const listing = toInsert[i];
          console.log(
            `Processing ${i + 1}/${toInsert.length}: ${listing.title}`
          );

          try {
            const slug = extractSlugFromUrl(listing.url);

            // Fetch property details (nearby places API currently not working)
            const propertyDetails = await scraper
              .scrapePropertyDetails(slug)
              .catch((err) => {
                console.error(
                  `Failed to fetch details for ${slug}:`,
                  err.message
                );
                return null;
              });

            let description = listing.title;

            if (propertyDetails) {
              description = createDescription(
                listing.title,
                propertyDetails.uiBoxContent
              );
            }

            // Note: Nearby places API is currently not working, leaving empty for now
            const nearbyPlaces = await api.getNearbyPlaces(listing.id);
            // Future enhancement: When API is fixed, fetch nearby places here

            enrichedListings.push({
              ...listing,
              city: 'Istanbul',
              district,
              description,
              nearbyPlaces: nearbyPlaces.result,
            });
          } catch (error) {
            console.error(`Error processing ${listing.title}:`, error);
            // Add without enriched data if processing fails
            enrichedListings.push({
              ...listing,
              city: 'Istanbul',
              district,
              description: listing.title,
              nearbyPlaces: [],
            });
          }
        }

        await PropertyModel.insertMany(enrichedListings);

        totalOperations += toInsert.length;
        console.log(
          `Inserted ${toInsert.length} new properties for ${district} with enriched data`
        );
      }

      if (totalOperations === 0) {
        console.log(`No changes needed for ${district}`);
      } else {
        console.log(`Total operations for ${district}: ${totalOperations}`);
      }
    }
  },
  undefined,
  true,
  'Europe/Istanbul',
  undefined
  // true
);

// emlakjetScraperJob.start();
