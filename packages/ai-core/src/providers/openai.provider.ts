import OpenAI from 'openai'
import { AIOutfitOutputSchema, AITrendOutputSchema } from '../../../shared/src/schemas'
import { extractJSON } from '../../../shared/src/utils'
import type { AIOutfitOutput, AITrendOutput } from '../../../shared/src/schemas'

export interface OpenAIProviderConfig {
  apiKey:  string
  model?:  string
}

export class OpenAIProvider {
  private readonly client: OpenAI
  private readonly model:  string

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey })
    this.model  = config.model ?? 'gpt-4o-mini'
  }

  async generateOutfit(prompt: string): Promise<AIOutfitOutput> {
    const response = await this.client.chat.completions.create({
      model:           this.model,
      max_tokens:      2048,
      temperature:     0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: OUTFIT_SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
    })

    const rawText = response.choices[0]?.message?.content
    if (!rawText) throw new Error('OpenAI: empty response')

    const parsed = extractJSON(rawText)
    if (!parsed) throw new Error('OpenAI: failed to extract JSON')

    const validated = AIOutfitOutputSchema.safeParse(parsed)
    if (!validated.success) {
      throw new Error(`OpenAI: schema validation failed — ${validated.error.message}`)
    }

    return validated.data
  }

  async generateTrends(prompt: string): Promise<AITrendOutput> {
    const response = await this.client.chat.completions.create({
      model:           this.model,
      max_tokens:      1024,
      temperature:     0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: TRENDS_SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
    })

    const rawText = response.choices[0]?.message?.content
    if (!rawText) throw new Error('OpenAI: empty trends response')

    const parsed = extractJSON(rawText)
    if (!parsed) throw new Error('OpenAI: failed to extract trends JSON')

    const validated = AITrendOutputSchema.safeParse(parsed)
    if (!validated.success) {
      throw new Error(`OpenAI: trends validation failed — ${validated.error.message}`)
    }

    return validated.data
  }
}

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
`.trim()

const TRENDS_SYSTEM_PROMPT = `
Fashion trend analyst. Respond ONLY with valid JSON:
{"trends":[{"trend","description","relevance"}],"location","season","updatedAt"}
`.trim()
