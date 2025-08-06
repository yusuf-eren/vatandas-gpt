import { SLIDER_CHILD_SIZE, SLIDER_MAIN_SIZE } from './types';

/**
 * Converts thumbnail image URL to main size image URL
 */
export function convertToMainSize(imageUrl: string): string {
  if (!imageUrl) return imageUrl;
  return imageUrl.replace(
    `_${SLIDER_CHILD_SIZE}.jpg`,
    `_${SLIDER_MAIN_SIZE}.jpg`
  );
}

/**
 * Processes items in batches with delay between batches
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
  delayMs: number = 1000
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)}`
    );

    const batchPromises = batch.map(async (item) => {
      try {
        return await processor(item);
      } catch (error) {
        console.error('Error processing item in batch:', error);
        return null;
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    const successfulResults = batchResults
      .filter(
        (result): result is PromiseFulfilledResult<Awaited<R> | null> =>
          result.status === 'fulfilled' && result.value !== null
      )
      .map((result) => result.value as R);

    results.push(...successfulResults);

    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
