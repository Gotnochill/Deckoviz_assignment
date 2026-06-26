import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are Vizzy, a visual creative AI. When the user describes something they want to create or visualize, respond with valid JSON only — no markdown, no extra text.
Format: {"reply": "one warm sentence acknowledging what you are creating", "prompt": "detailed image generation prompt for Flux, rich in subject, style, lighting, color, composition — 80 to 120 words"}`

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'No message' }, { status: 400 })
    }

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: 'user', content: message }],
    })

    const raw = completion.content[0].type === 'text' ? completion.content[0].text : ''

    let reply = 'Creating your visual...'
    let imagePrompt = message

    try {
      const parsed = JSON.parse(raw)
      reply = parsed.reply ?? reply
      imagePrompt = parsed.prompt ?? imagePrompt
    } catch {
      reply = raw.slice(0, 200)
    }

    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: imagePrompt }),
      }
    )

    if (!hfRes.ok) {
      const err = await hfRes.text()
      console.error('HuggingFace error:', err)
      return NextResponse.json({ reply, imageUrl: null })
    }

    const buffer = await hfRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const imageUrl = `data:image/jpeg;base64,${base64}`

    return NextResponse.json({ reply, imageUrl })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
