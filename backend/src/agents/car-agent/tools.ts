import 'dotenv/config';
import { setTracingDisabled, tool } from '@openai/agents';
import { z } from 'zod';

import { AutomobileModel } from '../../models/automobile.model';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

setTracingDisabled(true);

const userPromptSchema = z.object({
  rawSearchText: z.string(),
});

export const getCarsTool = tool({
  name: 'get_cars',
  description:
    'Search for cars in the database using MongoDB vector search for semantic matching',
  parameters: userPromptSchema,
  execute: async (filter: z.infer<typeof userPromptSchema>) => {
    console.log('car_filter:', filter);

    const pipeline: any[] = [];

    if (filter.rawSearchText && filter.rawSearchText.length > 0) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: filter.rawSearchText,
        encoding_format: 'float',
      });
      const queryEmbedding = embedding?.data?.[0]?.embedding;

      if (queryEmbedding) {
        pipeline.push({
          $vectorSearch: {
            queryVector: queryEmbedding,
            path: 'embedding',
            numCandidates: 100,
            limit: 50,
            index: 'vector_index',
          },
        });
      }
    } else {
      pipeline.push({
        $addFields: {
          numericPrice: {
            $toDouble: {
              $replaceAll: {
                input: { $ifNull: ['$price', '0'] },
                find: '.',
                replacement: '',
              },
            },
          },
        },
      });
      pipeline.push({ $sort: { numericPrice: 1 } });
      pipeline.push({ $limit: 50 });
    }

    console.log('car_pipeline:', JSON.stringify(pipeline, null, 2));

    const results = await AutomobileModel.aggregate(pipeline).exec();
    return results;
  },
});
