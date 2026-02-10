'use client';

import { useModal } from '@/components/ModalContext';

export default function Hero() {
  const { openModal } = useModal();

  return (
    <section
      className="
        relative 
        min-h-[500px] sm:h-[60vh] md:h-[70vh] lg:max-h-[800px]
        flex items-center justify-center 
        bg-cover bg-center bg-no-repeat 
        text-white 
        overflow-hidden
        isolate
      "
      style={{
        backgroundImage: `url('/hero_aspirants.avif')`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="
        relative z-10 
        w-full max-w-5xl mx-auto 
        px-6 sm:px-10 
        text-center
        flex flex-col items-center justify-center
      ">
        {/* Stacked phrase */}
        <div className="font-extrabold leading-[0.9] tracking-tighter mb-2">
          <div className="text-[clamp(1.5rem,6vw,3rem)] text-yellow-300">WE</div>
          <div className="text-[clamp(1.5rem,6vw,3rem)]">ARE</div>
          <div className="text-[clamp(2rem,10vw,4.5rem)] text-orange-400">VERY</div>
          <div className="text-[clamp(1.5rem,6vw,3rem)]">STRONG</div>
        </div>

        {/* TOGETHER */}
        <div className="
          font-black 
          text-[clamp(3rem,15vw,8rem)] 
          leading-none 
          tracking-tight
          drop-shadow-2xl
        ">
          TOGETHER
        </div>

        {/* Subtitle */}
        <p className="
          mt-6 
          text-[clamp(1rem,4vw,1.25rem)] 
          font-light 
          leading-relaxed 
          max-w-md sm:max-w-xl 
          opacity-90
        ">
          Aspirants united. Dreams ignited. <span className="block sm:inline">— we rise as one.</span>
        </p>

        {/* CTA – now opens modal */}
        <div className="mt-8">
          <button
            onClick={() => openModal('join')}
            className="
              inline-flex items-center justify-center px-8 py-4 
              text-base sm:text-lg font-bold 
              bg-gradient-to-r from-yellow-500 to-orange-600 
              hover:from-yellow-600 hover:to-orange-700 
              rounded-full 
              shadow-xl
              transform transition-all active:scale-95
              min-w-[220px]
            "
          >
            Join Us →
          </button>
        </div>
      </div>
    </section>
  );
}