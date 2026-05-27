'use client'

import { useEffect, useState } from 'react'

interface Message {
  isUser: boolean
  text: string
  time: string
  emoji?: string
}

interface ChatExampleProps {
  messages: Message[]
}

const ChatExample = ({ messages }: ChatExampleProps) => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    let isMounted = true

    const showMessages = async () => {
      setVisibleMessages([])

      for (let i = 0; i < messages.length; i++) {
        if (!isMounted) return

        if (!messages[i].isUser) {
          setIsTyping(true)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(Math.max(messages[i].text.length * 30, 1000), 2500))
          )
          if (!isMounted) return
          setIsTyping(false)
          await new Promise((resolve) => setTimeout(resolve, 300))
        }

        if (!isMounted) return
        setVisibleMessages((prev) => [...prev, messages[i]])

        if (i < messages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    showMessages()

    return () => {
      isMounted = false
      setVisibleMessages([])
      setIsTyping(false)
    }
  }, [messages])

  return (
    <div
      className="mx-1 w-[280px] flex-shrink-0 md:mx-2 md:w-[300px]"
      style={{
        background: '#deedf5',
        borderRadius: 18,
        border: '1px solid rgba(6,182,212,0.15)',
        boxShadow: '0 4px 24px rgba(13,26,46,0.1)',
      }}
    >
      <div
        className="flex items-center space-x-2 p-3 md:space-x-3 md:p-4"
        style={{
          background: '#cce4f0',
          borderBottom: '1px solid rgba(6,182,212,0.12)',
          borderRadius: '18px 18px 0 0',
        }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#06B6D4] text-sm font-bold text-white md:h-8 md:w-8 md:text-base">
          F
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900 md:text-base">FinancIA</div>
          <div className="text-xs text-cyan-800 md:text-sm">En línea</div>
        </div>
      </div>

      <div
        className="min-h-[180px] space-y-2 p-3 md:min-h-[200px] md:space-y-3 md:p-4"
        style={{ background: '#deedf5', borderRadius: '0 0 18px 18px' }}
      >
        {visibleMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-message-in`}
          >
            <div
              className="max-w-[85%] rounded-xl p-2 md:rounded-2xl md:p-3"
              style={
                message.isUser
                  ? { background: '#06B6D4', color: '#fff' }
                  : {
                      background: '#ffffff',
                      color: '#334155',
                      border: '1px solid rgba(6,182,212,0.15)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }
              }
            >
              <p className="whitespace-pre-line text-xs leading-relaxed md:text-sm">
                {message.emoji && <span className="mr-1">{message.emoji}</span>}
                {message.text}
              </p>
              <div
                className="mt-1 text-xs"
                style={{ color: message.isUser ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}
              >
                {message.time}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex animate-message-in justify-start">
            <div
              className="rounded-xl p-2 md:rounded-2xl md:p-3"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(6,182,212,0.15)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 animate-typing-1 rounded-full bg-slate-400 md:h-2 md:w-2" />
                <div className="h-1.5 w-1.5 animate-typing-2 rounded-full bg-slate-400 md:h-2 md:w-2" />
                <div className="h-1.5 w-1.5 animate-typing-3 rounded-full bg-slate-400 md:h-2 md:w-2" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatExample
