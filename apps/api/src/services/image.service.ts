import Replicate           from 'replicate'
import { v2 as cloudinary } from 'cloudinary'
import type { Outfit } from '../../../../packages/shared/src/schemas'
import { env }    from '../config/env'
import { logger } from '../config/logger'

// ─────────────────────────────────────────────────────────────────
// Replicate model versions (pinned for reproducibility)
// Update these when newer stable versions are released.
// Check: https://replicate.com/stability-ai/sdxl
// ─────────────────────────────────────────────────────────────────
const SDXL_MODEL = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37ec1375916f4f8a88a2628' as `${string}/${string}:${string}`

// Alternate: use Flux Schnell for faster/cheaper generation
const FLUX_SCHNELL = 'black-forest-labs/flux-schnell' as `${string}/${string}`

export class ImageService {
  private readonly replicate: Replicate

  constructor() {
    this.replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN })

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key:    env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    })
  }

  async generateAndUpload(outfit: Outfit, traceId: string): Promise<string> {
    logger.info({ traceId, title: outfit.title }, 'Starting image generation')

    const prompt = this.buildEditorialPrompt(outfit)

    // Try SDXL first, fall back to Flux Schnell
    let imageUrl: string | undefined

    try {
      imageUrl = await this.runSDXL(prompt)
    } catch (sdxlErr) {
      logger.warn({ err: sdxlErr, traceId }, 'SDXL failed — trying Flux Schnell')
      try {
        imageUrl = await this.runFluxSchnell(prompt)
      } catch (fluxErr) {
        logger.error({ err: fluxErr, traceId }, 'All image providers failed')
        throw new Error('Image generation unavailable — both SDXL and Flux Schnell failed')
      }
    }

    if (!imageUrl) throw new Error('No image URL returned from generation')

    logger.info({ traceId, imageUrl }, 'Image generated — uploading to Cloudinary')

    const uploaded = await cloudinary.uploader.upload(imageUrl, {
      folder:       'ai-fashion-stylist/outfits',
      public_id:    `outfit-${traceId}-${Date.now()}`,
      transformation: [
        { quality: 'auto:best', fetch_format: 'auto' },
        { width: 768, height: 768, crop: 'limit' },
      ],
      tags:         ['outfit', 'ai-generated'],
    })

    logger.info({ traceId, cloudinaryUrl: uploaded.secure_url }, 'Image uploaded to CDN')
    return uploaded.secure_url
  }

  private buildEditorialPrompt(outfit: Outfit): string {
    const itemDescriptions = outfit.items.map(i => `${i.color} ${i.name}`).join(', ')
    
    return [
      'High-end fashion flat lay photography',
      `Full outfit: ${itemDescriptions}`,
      'Styling: ' + (outfit.stylingTips?.[0] || 'minimalist'),
      'Arranged artistically on a clean white background',
      'Neutral studio lighting',
      'Sharp focus on textures and fabrics',
      '8k resolution',
      'Product photography',
      'No people',
      'Symmetric composition',
    ].join(', ')
  }

  private async runSDXL(prompt: string): Promise<string> {
    const output = await this.replicate.run(SDXL_MODEL, {
      input: {
        prompt,
        negative_prompt:     'blurry, low quality, watermark, text, logo, person, human, face, hands',
        width:               768,
        height:              768,
        num_inference_steps: 30,
        guidance_scale:      7.5,
        scheduler:           'K_EULER',
        apply_watermark:     false,
      },
    }) as string[]

    const url = output[0]
    if (!url) throw new Error('SDXL returned empty output')
    return url
  }

  private async runFluxSchnell(prompt: string): Promise<string> {
    const output = await this.replicate.run(FLUX_SCHNELL, {
      input: {
        prompt,
        num_inference_steps: 4,
        output_format:       'webp',
        output_quality:      80,
        disable_safety_checker: false,
      },
    }) as string[]

    const url = output[0]
    if (!url) throw new Error('Flux Schnell returned empty output')
    return url
  }
}
