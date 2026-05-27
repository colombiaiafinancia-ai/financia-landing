'use client'

const AVATARS = [
  { 
    name: "María", 
    profession: "Contadora", 
    gradient: "from-purple-400 to-pink-400",
    initial: "M"
  },
  { 
    name: "Carlos", 
    profession: "Ingeniero", 
    gradient: "from-blue-400 to-cyan-400",
    initial: "C"
  },
  { 
    name: "Ana", 
    profession: "Médica", 
    gradient: "from-[#5ce1e6] to-[#4dd0e1]",
    initial: "A"
  },
  { 
    name: "Luis", 
    profession: "Abogado", 
    gradient: "from-orange-400 to-red-400",
    initial: "L"
  }
]

export const ProfessionalAvatars = () => {
  return (
    <div className="flex justify-center items-center -space-x-2">
      {AVATARS.map((avatar, index) => (
        <div
          key={index}
          className={`w-12 h-12 bg-gradient-to-br ${avatar.gradient} rounded-full border-3 border-white flex items-center justify-center text-white font-bold text-sm shadow-lg`}
          style={{ zIndex: 10 - index }}
        >
          {avatar.initial}
        </div>
      ))}
    </div>
  )
}
