'use client'

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
}

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content: 'What would you like to create today?',
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
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

  function send() {
    const text = input.trim()
    if (!text) return

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: text },
    ])
    setInput('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'On it. Your visual is being prepared.',
        },
      ])
    }, 500)
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

      <section className="flex-1 min-h-0 overflow-y-auto px-6 py-8 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <p
              className={`max-w-[60%] px-4 py-3 text-sm leading-relaxed font-serif rounded-sm ${
                msg.role === 'user'
                  ? 'bg-[#3daa6e] text-white'
                  : 'bg-[#f5f5f5] text-[#111111]'
              }`}
            >
              {msg.content}
            </p>
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
          className="flex-1 resize-none bg-transparent text-sm text-[#111111] placeholder-[#aaaaaa] outline-none leading-relaxed font-sans overflow-hidden"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="shrink-0 text-sm font-sans text-[#3daa6e] disabled:text-[#cccccc] transition-colors cursor-pointer disabled:cursor-default"
        >
          Send
        </button>
      </div>
    </div>
  )
}
