import type { AIOutfitOutput, AITrendOutput } from '../../../shared/src/schemas';
export interface OpenAIProviderConfig {
    apiKey: string;
    model?: string;
}
export declare class OpenAIProvider {
    private readonly client;
    private readonly model;
    constructor(config: OpenAIProviderConfig);
    generateOutfit(prompt: string): Promise<AIOutfitOutput>;
    generateTrends(prompt: string): Promise<AITrendOutput>;
}
//# sourceMappingURL=openai.provider.d.ts.map