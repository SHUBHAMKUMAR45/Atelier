"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOrchestrator = void 0;
const circuit_breaker_1 = require("../circuit-breaker");
const gemini_provider_1 = require("../providers/gemini.provider");
const openai_provider_1 = require("../providers/openai.provider");
const schemas_1 = require("../../../shared/src/schemas");
const utils_1 = require("../../../shared/src/utils");
// ─────────────────────────────────────────────────────────────────
// IN-FLIGHT DEDUPLICATION
// ─────────────────────────────────────────────────────────────────
const inFlight = new Map();
async function deduplicate(key, fn) {
    const existing = inFlight.get(key);
    if (existing)
        return existing;
    const promise = fn().finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
}
// ─────────────────────────────────────────────────────────────────
// ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────
class AIOrchestrator {
    gemini;
    openai;
    cbGemini;
    cbOpenAI;
    constructor(config) {
        this.gemini = new gemini_provider_1.GeminiProvider({ apiKey: config.geminiApiKey, ...(config.geminiModel ? { model: config.geminiModel } : {}) });
        this.openai = new openai_provider_1.OpenAIProvider({ apiKey: config.openaiApiKey, ...(config.openaiModel ? { model: config.openaiModel } : {}) });
        this.cbGemini = new circuit_breaker_1.CircuitBreaker('gemini', { failureThreshold: 5, cooldownMs: 120_000, requestTimeout: 25_000 });
        this.cbOpenAI = new circuit_breaker_1.CircuitBreaker('openai', { failureThreshold: 5, cooldownMs: 120_000, requestTimeout: 25_000 });
    }
    async generateOutfit(input, cacheKey, getCached, setCached) {
        const result = await deduplicate(cacheKey, () => this._generateOutfit(input, cacheKey, getCached, setCached));
        return result;
    }
    async _generateOutfit(input, cacheKey, getCached, setCached) {
        const start = Date.now();
        const cached = await getCached();
        if (cached)
            return { data: cached, provider: 'cached', latencyMs: Date.now() - start };
        const prompt = buildOutfitPrompt(input);
        if (this.cbGemini.isAvailable()) {
            try {
                const raw = await (0, circuit_breaker_1.withRetry)(() => this.cbGemini.execute(() => this.gemini.generateOutfit(prompt)), { maxAttempts: 3, baseDelayMs: 1000 });
                const data = schemas_1.AIOutfitOutputSchema.parse(raw); // re-validate at orchestrator level
                await setCached(data);
                return { data, provider: 'gemini', latencyMs: Date.now() - start };
            }
            catch { /* fallthrough */ }
        }
        if (this.cbOpenAI.isAvailable()) {
            try {
                const raw = await (0, circuit_breaker_1.withRetry)(() => this.cbOpenAI.execute(() => this.openai.generateOutfit(prompt)), { maxAttempts: 3, baseDelayMs: 1000 });
                const data = schemas_1.AIOutfitOutputSchema.parse(raw); // re-validate at orchestrator level
                await setCached(data);
                return { data, provider: 'openai', latencyMs: Date.now() - start };
            }
            catch { /* fallthrough */ }
        }
        const fallback = await getCached();
        if (fallback)
            return { data: fallback, provider: 'cached', latencyMs: Date.now() - start };
        return { data: buildDegradedOutfitResponse(input), provider: 'cached', latencyMs: Date.now() - start };
    }
    async generateTrends(input, cacheKey, getCached, setCached) {
        const result = await deduplicate(cacheKey, () => this._generateTrends(input, cacheKey, getCached, setCached));
        return result;
    }
    async _generateTrends(input, cacheKey, getCached, setCached) {
        const start = Date.now();
        const cached = await getCached();
        if (cached)
            return { data: cached, provider: 'cached', latencyMs: Date.now() - start };
        const prompt = buildTrendPrompt(input);
        if (this.cbGemini.isAvailable()) {
            try {
                const raw = await (0, circuit_breaker_1.withRetry)(() => this.cbGemini.execute(() => this.gemini.generateTrends(prompt)), { maxAttempts: 2 });
                const data = schemas_1.AITrendOutputSchema.parse(raw);
                await setCached(data);
                return { data, provider: 'gemini', latencyMs: Date.now() - start };
            }
            catch { /* fallthrough */ }
        }
        if (this.cbOpenAI.isAvailable()) {
            try {
                const raw = await (0, circuit_breaker_1.withRetry)(() => this.cbOpenAI.execute(() => this.openai.generateTrends(prompt)), { maxAttempts: 2 });
                const data = schemas_1.AITrendOutputSchema.parse(raw);
                await setCached(data);
                return { data, provider: 'openai', latencyMs: Date.now() - start };
            }
            catch { /* fallthrough */ }
        }
        return { data: buildDegradedTrendResponse(input), provider: 'cached', latencyMs: Date.now() - start };
    }
    getCircuitStats() {
        return { gemini: this.cbGemini.getStats(), openai: this.cbOpenAI.getStats() };
    }
}
exports.AIOrchestrator = AIOrchestrator;
// ─────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────
function buildOutfitPrompt(input) {
    const safe = (0, utils_1.sanitizeUserInput)({
        occasion: input.occasion,
        description: input.description ?? '',
        location: input.location,
    });
    const mStr = input.measurements
        ? `Height: ${input.measurements.height}cm, Weight: ${input.measurements.weight}kg`
        : 'not provided';
    return `Generate a complete outfit recommendation.
Occasion: ${safe.occasion}
Notes: ${safe.description || 'none'}
Location: ${safe.location}
Weather: ${input.weather.temp}°C, ${input.weather.condition}, Humidity ${input.weather.humidity}%
Gender: ${input.preferences.gender}
Body: ${mStr}
Budget: ${input.preferences.budget}
Styles: ${input.preferences.styles.join(', ')}
Colors liked: ${input.preferences.colors.join(', ') || 'any'}
Colors to avoid: ${input.preferences.avoidColors.join(', ') || 'none'}
Return ONLY valid JSON.`.trim();
}
function buildTrendPrompt(input) {
    const safe = (0, utils_1.sanitizeUserInput)({ location: input.location });
    return `Fashion trends for: ${safe.location}\nSeason: ${input.season}\nReturn ONLY valid JSON.`;
}
// ─────────────────────────────────────────────────────────────────
// DEGRADED RESPONSES
// ─────────────────────────────────────────────────────────────────
function buildDegradedOutfitResponse(input) {
    const budget = input.preferences.budget;
    return {
        title: 'Classic Everyday Outfit',
        description: 'A timeless, versatile outfit suitable for your occasion.',
        items: [
            { category: 'top', name: 'Classic Crew Neck T-Shirt', description: 'A comfortable basic.', color: 'White', material: 'Cotton', style: 'casual', priceRange: budget, searchTerms: ['white crew neck t-shirt'] },
            { category: 'bottom', name: 'Well-Fitted Jeans', description: 'Classic straight-fit.', color: 'Indigo Blue', material: 'Denim', style: 'casual', priceRange: budget, searchTerms: ['straight fit jeans'] },
            { category: 'shoes', name: 'White Sneakers', description: 'Clean minimal sneakers.', color: 'White', material: 'Leather', style: 'casual', priceRange: budget, searchTerms: ['white leather sneakers'] },
        ],
        stylingTips: ['Keep accessories minimal for a clean look'],
        colorPalette: ['#FFFFFF', '#1a237e', '#f5f5f5'],
        confidenceScore: 0.5,
    };
}
function buildDegradedTrendResponse(input) {
    return {
        trends: [
            { trend: 'Minimalist Basics', description: 'Clean simple pieces easy to mix and match.', relevance: 0.8 },
            { trend: 'Earth Tones', description: 'Warm browns, tans, and olive greens.', relevance: 0.7 },
        ],
        location: input.location,
        season: input.season,
        updatedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=index.js.map