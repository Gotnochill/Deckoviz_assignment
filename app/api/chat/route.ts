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
      const hfTimeout = setTimeout(() => controller.abort(), 45_000)

      const hfRes = await fetch(
        'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: imagePrompt }),
          signal: controller.signal,
        }
      )

      clearTimeout(hfTimeout)

      if (hfRes.ok) {
        const mimeType = hfRes.headers.get('content-type') ?? 'image/png'
        const buffer = await hfRes.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        imageUrl = `data:${mimeType};base64,${base64}`
      } else {
        console.error('HuggingFace error:', await hfRes.text())
      }
    } catch (hfErr) {
      console.error('HuggingFace unreachable:', hfErr)
    }

    return NextResponse.json({ reply, imageUrl })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
