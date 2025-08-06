import 'dotenv/config';
import { z } from 'zod';
import { tool } from '@openai/agents';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

const NewsSearchSchema = z.object({
  query: z.string().describe('The query to search the web for the latest news'),
  numberOfResults: z
    .number()
    .min(3)
    .max(10)
    .default(5)
    .describe(
      'The number of results to return. Keep it between 3 and 10. If the context is small do not go over 5'
    ),
});

type NewsSearch = z.infer<typeof NewsSearchSchema>;

export const searchNewsTool = tool({
  name: 'search_news',
  description: 'Search the web for the latest news',
  parameters: NewsSearchSchema,
  execute: async ({ query, numberOfResults }: NewsSearch) => {
    const result = await exa.searchAndContents(query, {
      text: true,
      type: 'auto',
      category: 'news',
      userLocation: 'TR',
      numberOfResults: numberOfResults,
    });

    return result.results;
  },
});
