"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";

type Activity = {
  id: string;
  name: string;
  description: string;
  image: string;
  supervisor: string;
};

interface EventsSliderProps {
  initialData: Activity[];
}

export default function EventsSlider({ initialData }: EventsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  const checkOverflow = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowArrows(el.scrollWidth > el.clientWidth + 1); // +1 to avoid rounding issues
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    // Also re-check after images might have loaded
    const timer = setTimeout(checkOverflow, 300);
    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearTimeout(timer);
    };
  }, [initialData]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.85;

    el.scrollTo({
      left:
        direction === "left"
          ? el.scrollLeft - scrollAmount
          : el.scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  // Hide "Read more" if description seems short
  const shouldShowMore = (desc: string) => desc.trim().length > 180;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          Previous & Upcoming forum Events
        </h2>

        {showArrows && (
          <div className="flex gap-3">
            <button
              onClick={() => scroll("left")}
              className="p-2.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-label="Scroll left"
            >
              ←
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={`
          flex gap-5 sm:gap-6 lg:gap-8
          overflow-x-auto pb-6 -mx-1 px-1
          snap-x snap-mandatory
          scrollbar-hide
        `}
      >
        {initialData.map((event) => (
          <article
            key={event.id}
            className={`
              flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4
              snap-start
              bg-white border border-gray-100 rounded-xl
              overflow-hidden shadow-sm hover:shadow-md
              transition-shadow duration-200
            `}
          >
            <div className="relative aspect-[4/3] sm:aspect-video w-full">
              <Image
                src={event.image}
                alt={event.name}
                fill
                className="object-fit"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAErgJ9aA9l9gAAAABJRU5ErkJggg=="
              />
            </div>

            <div className="p-5 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                {event.name}
              </h3>

              <p className="text-gray-600 text-base leading-relaxed line-clamp-3 sm:line-clamp-4 mb-4">
                {event.description}
              </p>

              {shouldShowMore(event.description) && (
                <button className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  Read more →
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}