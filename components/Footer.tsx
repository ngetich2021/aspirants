'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react' // optional: install lucide-react for better icons

export default function Footer() {
  const whatsappLink = 'https://chat.whatsapp.com/Hv2MpzTAtFqFHoWwWYJjjz'
  const xLink = 'https://x.com/Aspirants_EMC'
  const tiktokLink = 'https://www.tiktok.com/@aspirant_forum'
  const fbLink = 'https://www.facebook.com/groups/1253115390075496'

  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(whatsappLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <footer className="w-full bg-[#f8fff8] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-200 mb-3">
              <Image
                src="/emc_aspirants_logo.png"
                alt="EMC Aspirants Logo"
                fill
                className="object-contain p-1.5"
                priority
              />
            </div>
            <p className="text-gray-600 font-medium text-center md:text-left">
              Home for you
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-red-600 font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-gray-700">
              <li><a href="#" className="hover:text-red-600 transition">Join</a></li>
              <li><a href="#" className="hover:text-red-600 transition">Events</a></li>
              <li><a href="#" className="hover:text-red-600 transition">Talk to us</a></li>
              <li><a href="#" className="hover:text-red-600 transition">Support us</a></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="text-green-600 font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href={xLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition">
                <Image src="https://img.icons8.com/ios-filled/50/000000/x.png" alt="X" width={28} height={28} />
              </a>
              <a href={fbLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition">
                <Image src="https://img.icons8.com/fluency/48/000000/facebook-new.png" alt="Facebook" width={28} height={28} />
              </a>
              <a href={tiktokLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition">
                <Image src="https://img.icons8.com/color/48/000000/tiktok--v1.png" alt="TikTok" width={28} height={28} />
              </a>
            </div>
          </div>

          {/* WhatsApp Group */}
          <div>
            <h4 className="text-blue-600 font-semibold mb-4">WhatsApp Group</h4>
            <div className="flex items-center gap-2 mb-3">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition">
                <Image src="https://img.icons8.com/color/48/000000/whatsapp--v1.png" alt="WhatsApp" width={28} height={28} />
              </a>
              {/* <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-blue-600 transition"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy link
                  </>
                )}
              </button> */}
            </div>
            {/* <p className="text-xs text-gray-500 break-all">
              {whatsappLink}
            </p> */}
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} EMC Aspirants • All rights reserved
        </div>
      </div>
    </footer>
  )
}