'use client'

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import Image from 'next/image'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
  imageUrl?: string
  loading?: boolean
}

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content: 'What would you like to create today?',
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    resizeTextarea()
  }

  async function send() {
    const text = input.trim()
    if (!text || isGenerating) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const loadingId = `loading-${Date.now()}`
    const loadingMsg: Message = { id: loadingId, role: 'assistant', content: '', loading: true }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsGenerating(true)

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? { ...m, content: data.reply ?? 'Done.', imageUrl: data.imageUrl ?? undefined, loading: false }
            : m
        )
      )
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? { ...m, content: 'Something went wrong. Please try again.', loading: false }
            : m
        )
      )
    } finally {
      setIsGenerating(false)
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="shrink-0 border-b border-[#e2e2e2] px-6 py-4">
        <span className="text-[#3daa6e] text-sm tracking-[0.2em] uppercase font-sans">
          Vizzy
        </span>
      </header>

      <section className="flex-1 min-h-0 overflow-y-auto px-6 py-8 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.loading ? (
              <div className="px-4 py-3 bg-[#f5f5f5] rounded-sm">
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#aaaaaa] animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#aaaaaa] animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#aaaaaa] animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            ) : (
              <>
                {msg.content && (
                  <p
                    className={`max-w-[60%] px-4 py-3 text-sm leading-relaxed font-serif rounded-sm ${
                      msg.role === 'user'
                        ? 'bg-[#3daa6e] text-white'
                        : 'bg-[#f5f5f5] text-[#111111]'
                    }`}
                  >
                    {msg.content}
                  </p>
                )}
                {msg.imageUrl && (
                  <div className="mt-2 max-w-[60%]">
                    <Image
                      src={msg.imageUrl}
                      alt="Generated visual"
                      width={512}
                      height={512}
                      className="w-full rounded-sm"
                      unoptimized
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </section>

      <div className="shrink-0 border-t border-[#e2e2e2] px-6 py-4 flex items-end gap-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder="Describe what you want to create..."
          rows={1}
          disabled={isGenerating}
          className="flex-1 resize-none bg-transparent text-sm text-[#111111] placeholder-[#aaaaaa] outline-none leading-relaxed font-sans overflow-hidden disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || isGenerating}
          className="shrink-0 text-sm font-sans text-[#3daa6e] disabled:text-[#cccccc] transition-colors cursor-pointer disabled:cursor-default"
        >
          {isGenerating ? 'Generating...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
