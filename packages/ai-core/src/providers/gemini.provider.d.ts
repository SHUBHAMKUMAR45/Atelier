import type { AIOutfitOutput, AITrendOutput } from '../../../shared/src/schemas';
export interface GeminiProviderConfig {
    apiKey: string;
    model?: string;
}
export declare class GeminiProvider {
    private readonly client;
    private readonly modelName;
    constructor(config: GeminiProviderConfig);
    generateOutfit(prompt: string): Promise<AIOutfitOutput>;
    generateTrends(prompt: string): Promise<AITrendOutput>;
}
//# sourceMappingURL=gemini.provider.d.ts.map