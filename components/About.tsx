import React from 'react'

export default function About() {
  return (
    <div className="w-full h-fit bg-white p-4 md:p-12 font-sans italic">
      {/* Outer Red Border Container */}
      <div className="border-2 border-red-500 h-fit p-6 md:p-10 relative">
        
        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-light mb-12 not-italic">About Us</h1>

        <div className="grid grid-cols-12 gap-2 md:gap-4">
          
          {/* Left Column: Key Objectives Header */}
          <div className="col-span-12 md:col-span-3">
            <h2 className="text-sm sm:text-lg md:text-2xl font-medium mb-4 whitespace-nowrap">
              objectives:
            </h2>
          </div>

          {/* Middle Column: Numbered Objectives List */}
          <div className="col-span-8 md:col-span-6">
            <ul className="text-[10px] sm:text-sm md:text-lg leading-relaxed list-none p-0 space-y-3">
              {[
                "We campaign for the aspirants within our portal",
                "we offer strategies and strategic advises",
                "we encourage everyone to have a say their country through leadership",
                "we sensitize the public on the roles of each leadership position, how they can assist where necessary",
                "we teach on the constitution",
                "we conduct ground check up"
              ].map((text, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-bold min-w-[15px]">{index + 1}.</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Legibility Section */}
          <div className="col-span-4 md:col-span-3 text-right md:text-left border-l md:border-none pl-2">
            <div className="mb-4">
              <h3 className="text-[11px] sm:text-base md:text-xl font-medium mb-1 whitespace-nowrap">
                who is legible?
              </h3>
              <p className="text-[9px] sm:text-xs md:text-lg leading-tight">
                anybody who wants to bring change to the society
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}