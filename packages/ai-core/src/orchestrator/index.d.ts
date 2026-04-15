import type { AIOutfitOutput, AITrendOutput, WeatherContext, UserPreferences } from '../../../shared/src/schemas';
export interface OrchestratorConfig {
    geminiApiKey: string;
    openaiApiKey: string;
    geminiModel?: string;
    openaiModel?: string;
}
export interface OutfitGenerationInput {
    occasion: string;
    description: string | undefined;
    weather: WeatherContext;
    preferences: UserPreferences;
    measurements: {
        height: number;
        weight: number;
        chest?: number;
        waist?: number;
        hips?: number;
    } | undefined;
    location: string;
    traceId: string;
}
export interface TrendGenerationInput {
    location: string;
    season: string;
    traceId: string;
}
export type AIProvider = 'gemini' | 'openai' | 'cached';
export interface OrchestratorResult<T> {
    data: T;
    provider: AIProvider;
    latencyMs: number;
}
export declare class AIOrchestrator {
    private readonly gemini;
    private readonly openai;
    private readonly cbGemini;
    private readonly cbOpenAI;
    constructor(config: OrchestratorConfig);
    generateOutfit(input: OutfitGenerationInput, cacheKey: string, getCached: () => Promise<AIOutfitOutput | null>, setCached: (data: AIOutfitOutput) => Promise<void>): Promise<OrchestratorResult<AIOutfitOutput>>;
    private _generateOutfit;
    generateTrends(input: TrendGenerationInput, cacheKey: string, getCached: () => Promise<AITrendOutput | null>, setCached: (data: AITrendOutput) => Promise<void>): Promise<OrchestratorResult<AITrendOutput>>;
    private _generateTrends;
    getCircuitStats(): {
        gemini: import("../circuit-breaker").CircuitBreakerStats;
        openai: import("../circuit-breaker").CircuitBreakerStats;
    };
}
//# sourceMappingURL=index.d.ts.map