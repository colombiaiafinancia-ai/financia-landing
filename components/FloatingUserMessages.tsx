'use client'

import { useEffect, useState } from 'react'

const USER_MESSAGES = [
  "Pagué el almuerzo con Juan $30.000",
  "FinancIA, ¿cómo va mi presupuesto este mes?",
  "Quiero ahorrar para un viaje a la costa en diciembre",
  "FinancIA, ¿en qué estoy gastando más?",
  "Gasté $50.000 en el supermercado",
  "¿Cuánto he ahorrado esta semana?"
]

const MESSAGE_TIME = '10:42 a.m.'

export const FloatingUserMessages = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const showNextMessage = async () => {
      // Fade out
      setIsVisible(false)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Change message
      setCurrentMessageIndex((prev) => (prev + 1) % USER_MESSAGES.length)
      
      // Fade in
      setIsVisible(true)
      
      // Wait before next cycle
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    const interval = setInterval(showNextMessage, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full max-w-lg mx-auto h-24 flex items-center justify-center">
      <div 
        className={`transition-all duration-500 transform ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <div className="bg-[#DCF8C6] text-gray-800 p-5 rounded-2xl shadow-lg max-w-md relative">
          <p className="text-base md:text-lg font-medium leading-relaxed">
            {USER_MESSAGES[currentMessageIndex]}
          </p>
          <div className="text-xs text-gray-500 mt-2 text-right">
            {MESSAGE_TIME}
          </div>
          {/* WhatsApp bubble tail */}
          <div className="absolute -bottom-1 right-3 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-[#DCF8C6]"></div>
        </div>
      </div>
    </div>
  )
}
