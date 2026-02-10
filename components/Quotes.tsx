import React from 'react'

export default function Quotes() {
  const quotes = [
    "Progress is not inevitable. It's the result of choices we make together.",
    "A house divided cannot stand, but a nation united cannot be stopped.",
    "The future belongs to those who build it, not those who fear it.",
    "Our strength is not in our uniformity, but in our unity.",
    "The measure of a government is how it treats its most vulnerable.",
    "Politics is the art of the possible; leadership is the art of making it happen.",
    "Power is not a trophy to be won, but a trust to be earned.",
    "Government exists for the people, not the other way around.",
    "If you want to go fast, go alone. If you want to go far, go together.",
    "Change is the law of life. And those who look only to the past or present are certain to miss the future.",
    "Don't just complain about the dark; be the one who turns on the light.",
    "The status quo is a road to nowhere. It’s time for a new direction."
  ];

  return (
    <div className="w-full h-fit bg-white p-2 md:p-3 font-sans">
      {/* Title with link styling */}
      <div className="">
        <h2 className="text-xl md:text-2xl font-bold text-gray-700 underline decoration-blue-400 cursor-pointer">
          Quotes
        </h2>
      </div>

      {/* Quotes Container */}
      <div className="flex flex-col gap-3 max-w-5xl">
        {quotes.map((quote, index) => (
          <div 
            key={index} 
            className="border border-green-400 p-2 md:p-3 hover:bg-green-50 transition-colors"
          >
            {/* 'whitespace-nowrap' prevents breaking. 
              'text-[10px]' ensures it fits on tiny screens.
              'sm:text-sm' and 'md:text-lg' scale it up.
            */}
            <p className="font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis text-[10px] sm:text-sm md:text-lg lg:text-xl">
              {quote}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}