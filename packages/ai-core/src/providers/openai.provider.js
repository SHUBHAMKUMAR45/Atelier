"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const schemas_1 = require("../../../shared/src/schemas");
const utils_1 = require("../../../shared/src/utils");
class OpenAIProvider {
    client;
    model;
    constructor(config) {
        this.client = new openai_1.default({ apiKey: config.apiKey });
        this.model = config.model ?? 'gpt-4o-mini';
    }
    async generateOutfit(prompt) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            max_tokens: 2048,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: OUTFIT_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
        });
        const rawText = response.choices[0]?.message?.content;
        if (!rawText)
            throw new Error('OpenAI: empty response');
        const parsed = (0, utils_1.extractJSON)(rawText);
        if (!parsed)
            throw new Error('OpenAI: failed to extract JSON');
        const validated = schemas_1.AIOutfitOutputSchema.safeParse(parsed);
        if (!validated.success) {
            throw new Error(`OpenAI: schema validation failed — ${validated.error.message}`);
        }
        return validated.data;
    }
    async generateTrends(prompt) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            max_tokens: 1024,
            temperature: 0.5,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: TRENDS_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
        });
        const rawText = response.choices[0]?.message?.content;
        if (!rawText)
            throw new Error('OpenAI: empty trends response');
        const parsed = (0, utils_1.extractJSON)(rawText);
        if (!parsed)
            throw new Error('OpenAI: failed to extract trends JSON');
        const validated = schemas_1.AITrendOutputSchema.safeParse(parsed);
        if (!validated.success) {
            throw new Error(`OpenAI: trends validation failed — ${validated.error.message}`);
        }
        return validated.data;
    }
}
exports.OpenAIProvider = OpenAIProvider;
const OUTFIT_SYSTEM_PROMPT = `
You are a fashion stylist AI. Respond ONLY with valid JSON matching:
{
  "title": string,
  "description": string,
  "items": [{"category","name","description","color","material?","style","priceRange","searchTerms"}],
  "stylingTips": string[],
  "colorPalette": string[],
  "confidenceScore": number
}
category: "top"|"bottom"|"shoes"|"outerwear"|"accessory"|"dress"|"suit"
priceRange: "budget"|"mid"|"luxury"
colorPalette: hex format (#RRGGBB)
`.trim();
const TRENDS_SYSTEM_PROMPT = `
Fashion trend analyst. Respond ONLY with valid JSON:
{"trends":[{"trend","description","relevance"}],"location","season","updatedAt"}
`.trim();
//# sourceMappingURL=openai.provider.js.map