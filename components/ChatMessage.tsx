'use client'

interface ChatMessageProps {
  message: string
  isBot: boolean
  delay: number
  isVoice?: boolean
}

const MESSAGE_TIME = '10:42'

export const ChatMessage = ({ message, isBot }: ChatMessageProps) => {
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-message-in`}>
      <div 
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isBot 
            ? 'bg-white text-[#303030]' 
            : 'bg-[#e7ffd9] text-[#303030]'
        }`}
      >
        <p className="text-sm whitespace-pre-line">{message}</p>
        <span className="text-[10px] text-[#303030]/60 mt-1 block">
          {MESSAGE_TIME}
        </span>
      </div>
    </div>
  )
}
