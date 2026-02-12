'use client'

import Image from 'next/image';
import React, { useState } from 'react';

export default function Footer() {
  const whatsappLink = 'https://chat.whatsapp.com/Hv2MpzTAtFqFHoWwWYJjjz';
  const xLink = 'https://x.com/Aspirants_EMC';

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(whatsappLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full bg-[#f4fbf4] border-t border-gray-200 p-0 m-0 font-sans">
      <div className="flex flex-row justify-between items-start py-6 px-2 md:px-10 gap-2">
        
        {/* Logo & Slogan Column */}
        <div className="flex flex-col items-center flex-1">
          <div className="relative w-10 h-10 md:w-20 md:h-20 bg-white rounded-full overflow-hidden mb-2 border border-gray-100 flex items-center justify-center">
            {/* Replace with your emc-logo.png */}
            <Image 
              src={'/emc_aspirants_logo.png'} 
              alt="Logo" 
              className="w-full h-full object-contain p-1"
              fill
            />
          </div>
          <p className="text-gray-500 font-bold text-[2.5vw] md:text-lg whitespace-nowrap">
            Home for you
          </p>
        </div>

        {/* Links Column */}
        <div className="flex flex-col flex-1">
          <h4 className="text-red-600 font-bold text-[3vw] md:text-xl mb-1 md:mb-3">Links</h4>
          <nav className="flex flex-col space-y-0.5 md:space-y-1 text-black font-bold text-[2.2vw] md:text-lg">
            <a href="#" className="hover:text-red-600 transition-colors">Join</a>
            <a href="#" className="hover:text-red-600 transition-colors">Events</a>
            <a href="#" className="hover:text-red-600 transition-colors">Talk to us</a>
            <a href="#" className="hover:text-red-600 transition-colors">Support us</a>
          </nav>
        </div>

        {/* Contact Us Column */}
        <div className="flex flex-col flex-1">
          <h4 className="text-green-500 font-bold text-[3vw] md:text-xl mb-1 md:mb-3 whitespace-nowrap">Contact us</h4>
          <div className="flex flex-col space-y-0.5 md:space-y-1 text-black font-bold text-[2.2vw] md:text-lg">
            <a href={xLink} target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">X</a>
            <span>FB</span>
            <span>Tiktok</span>
          </div>
        </div>

        {/* Whatsapp Column */}
        <div className="flex flex-col flex-1">
          <h4 className="text-blue-700 font-bold text-[2.8vw] md:text-xl mb-1 md:mb-3 whitespace-nowrap">
            WhatsApp Group Link
          </h4>
          <div className="flex flex-col items-start">
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 text-[1.8vw] md:text-sm break-all hover:underline mb-1"
            >
              {whatsappLink}
            </a>
            <button 
              onClick={copyToClipboard}
              className="bg-blue-500 text-white px-2 py-1 rounded text-[1.6vw] md:text-xs hover:bg-blue-600 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}