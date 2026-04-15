"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const schemas_1 = require("../../../shared/src/schemas");
const utils_1 = require("../../../shared/src/utils");
class GeminiProvider {
    client;
    modelName;
    constructor(config) {
        this.client = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
        this.modelName = config.model ?? 'gemini-1.5-flash';
    }
    async generateOutfit(prompt) {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            generationConfig: { temperature: 0.7, topP: 0.8, topK: 40, maxOutputTokens: 2048 },
        });
        const result = await model.generateContent(`${OUTFIT_SYSTEM_PROMPT}\n\n${prompt}`);
        const rawText = result.response.text();
        const parsed = (0, utils_1.extractJSON)(rawText);
        if (!parsed)
            throw new Error('Gemini: failed to extract JSON');
        const validated = schemas_1.AIOutfitOutputSchema.safeParse(parsed);
        if (!validated.success)
            throw new Error(`Gemini: schema validation failed — ${validated.error.message}`);
        return validated.data;
    }
    async generateTrends(prompt) {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
        });
        const result = await model.generateContent(`${TRENDS_SYSTEM_PROMPT}\n\n${prompt}`);
        const rawText = result.response.text();
        const parsed = (0, utils_1.extractJSON)(rawText);
        if (!parsed)
            throw new Error('Gemini: failed to extract trends JSON');
        const validated = schemas_1.AITrendOutputSchema.safeParse(parsed);
        if (!validated.success)
            throw new Error(`Gemini: trends validation failed — ${validated.error.message}`);
        return validated.data;
    }
}
exports.GeminiProvider = GeminiProvider;
const OUTFIT_SYSTEM_PROMPT = `You are an expert fashion stylist AI. Respond with ONLY valid JSON matching:
{"title":string,"description":string,"items":[{"category":"top"|"bottom"|"shoes"|"outerwear"|"accessory"|"dress"|"suit","name":string,"description":string,"color":string,"material":string,"style":string,"priceRange":"budget"|"mid"|"luxury","searchTerms":string[]}],"stylingTips":string[],"colorPalette":string[],"confidenceScore":number}
colorPalette must use hex #RRGGBB. Include at least top+bottom+shoes. Return ONLY JSON.`.trim();
const TRENDS_SYSTEM_PROMPT = `You are a fashion trend analyst. Respond ONLY with valid JSON:
{"trends":[{"trend":string,"description":string,"relevance":number}],"location":string,"season":string,"updatedAt":string}
Return ONLY the JSON object.`.trim();
//# sourceMappingURL=gemini.provider.js.map