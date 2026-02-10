import React from 'react';

export default function Target() {
  return (
    <div className="h-fit bg-white font-sans text-gray-900 p-4 flex flex-col items-center">
      
      {/* Header Section */}
      <header className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-2xl md:text-4xl font-bold mb-6">The Daily Affirmation</h1>
        
        {/* Circle Affirmation */}
        <div className="mx-auto w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gray-200 rounded-full flex items-center justify-center p-6 sm:p-10 shadow-inner">
          <p className="italic text-[10px] sm:text-xs md:text-base leading-tight md:leading-relaxed text-center font-medium">
            May we remember today that while our paths are individual, we do not walk them alone. 
            Soften our hearts to those struggling in silence and sharpen our minds to help one 
            another grow. Help us to measure our progress not against each other, but against 
            who we were yesterday. Give us the patience to trust the process and the courage 
            to keep showing up, even when the finish line feels far away.
          </p>
        </div>
      </header>

      {/* Target Section */}
      <main className="w-full max-w-5xl px-2">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-500">Our target</h2>
        </div>

        <div className="text-center">
          <h3 className="text-2xl md:text-4xl font-bold mb-10">Elgeyomarakwet county</h3>
          
          {/* Stats Row - Forces single line and scales text */}
          <div className="flex flex-row justify-between items-center border-t pt-8 w-full gap-2 whitespace-nowrap">
            
            <div className="flex flex-row items-baseline gap-1">
              <span className="text-[11px] sm:text-lg md:text-3xl font-bold">constituencies</span>
              <span className="text-[13px] sm:text-xl md:text-4xl font-bold text-red-600">4</span>
            </div>
            
            <div className="flex flex-row items-baseline gap-1">
              <span className="text-[11px] sm:text-lg md:text-3xl font-bold">wards</span>
              <span className="text-[13px] sm:text-xl md:text-4xl font-bold text-red-600">20</span>
            </div>
            
            <div className="flex flex-row items-baseline gap-1">
              <span className="text-[11px] sm:text-lg md:text-3xl font-bold">polling station</span>
              <span className="text-[13px] sm:text-xl md:text-4xl font-bold text-red-600">678</span>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}