# Deckoviz - Vizzy Chat

A conversational interface where users type or speak what they want to create, and the system generates images, artworks, posters, storyboards, and other visual content in response. Think ChatGPT but the output is visual.

The brief covers two audiences: home users (personal art, vision boards, story visuals) and businesses (product photography, signage, brand materials). The interface is the same for both; the intent parsing adapts to context.

## Stack and Decisions

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) | Fullstack in one repo; API routes replace a separate backend |
| Styling | Tailwind CSS | Utility-first, fast to iterate on a custom chat layout |
| Language | TypeScript | Catches shape mismatches between API responses and UI early |
| Conversation AI | Claude API (Haiku) | Cheapest tier, good at parsing creative intent and generating image prompts |
| Image Generation | Hugging Face Inference API | Free tier supports SDXL and Flux-schnell, sufficient for a demo |
| State | React state + context | No external store needed at this scale |

## How it Works

1. User sends a message (text, optionally with an image upload)
2. Claude parses the intent and produces a structured prompt for the image model
3. The image model (HuggingFace) returns one or more generated images
4. The UI renders the conversation and the image outputs together
5. User can refine inline by replying in the same thread

## Running Locally

```bash
npm install
# add ANTHROPIC_API_KEY and HUGGINGFACE_API_KEY to .env.local
npm run dev
```
