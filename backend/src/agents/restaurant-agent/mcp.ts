import { MCPServerStdio } from '@openai/agents';

export const trendyolYemekMCPServer = new MCPServerStdio({
  command: 'npx',
  args: ['-y', 'trendyol-yemek-mcp'],
});

trendyolYemekMCPServer.connect();
