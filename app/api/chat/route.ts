import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Vizzy, a visual creative AI. When the user describes something they want to create or visualize, output ONLY a raw JSON object. No markdown fences, no explanation, no text before or after the JSON.
Output format (raw JSON, nothing else): {"reply": "one warm sentence acknowledging what you are creating", "prompt": "detailed image generation prompt for Flux, rich in subject, style, lighting, color, composition — 80 to 120 words"}`

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'No message' }, { status: 400 })
    }

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: 'user', content: message }],
    })

    const textBlock = completion.content.find(b => b.type === 'text')
    const raw = textBlock?.type === 'text' ? textBlock.text : ''

    let reply = 'Creating your visual...'
    let imagePrompt = message

    try {
      const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      const parsed = JSON.parse(stripped)
      reply = parsed.reply ?? reply
      imagePrompt = parsed.prompt ?? imagePrompt
    } catch {
      reply = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim().slice(0, 200)
    }

    let imageUrl: string | null = null

    try {
      const controller = new AbortController()
      const falTimeout = setTimeout(() => controller.abort(), 45_000)

      const falRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          image_size: 'square_hd',
          num_inference_steps: 4,
          num_images: 1,
        }),
        signal: controller.signal,
      })

      clearTimeout(falTimeout)

      if (falRes.ok) {
        const falData = await falRes.json()
        imageUrl = falData.images?.[0]?.url ?? null
      } else {
        console.error('fal.ai error:', await falRes.text())
      }
    } catch (falErr) {
      console.error('fal.ai unreachable:', falErr)
    }

    return NextResponse.json({ reply, imageUrl })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
