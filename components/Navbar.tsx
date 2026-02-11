// components/Navbar.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import JoinUs from './JoinUs';
import SupportUs from './SupportUs';
import { useModal } from './ModalContext';
import type { PollingStation } from './JoinUs';

interface NavbarProps {
  stations: PollingStation[];
}

export default function Navbar({ stations }: NavbarProps) {
  const { openModal, activeModal, closeModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const router = useRouter();

  const handleFlagClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // STRICT VERSION: only triggers EXACTLY on the 5th click
    if (newCount === 5) {
      router.push('/welcome');
      setClickCount(0);           // reset counter immediately after trigger
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsOpen(false);
  };

  const navLinks = [
    { label: 'Join us', action: () => openModal('join'), isButton: true },
    { label: 'About us', id: 'about' },
    { label: 'Events', id: 'events' },
    { label: 'Contact Us', id: 'contact' },
    { label: 'Support us', action: () => openModal('support'), isButton: true },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Desktop / Large screens */}
      <div className="hidden lg:flex h-16 px-6 xl:px-12 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-gray-200">
            <Image src="/emc_aspirants_logo.png" alt="Logo" fill className="object-cover" priority />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-red-600 leading-tight">
              <span className="text-sm font-black mr-1.5">NOTE:</span> YOU MUST REGISTER WITH THE RESPECTIVE PARTY ASPIRANT PORTAL
            </p>
            <p className="text-[10px] text-gray-600 font-medium uppercase">
              Here we journey together through votes search
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {navLinks.map((link) =>
            link.isButton ? (
              <button
                key={link.label}
                onClick={link.action}
                className="text-sm font-bold text-gray-700 hover:text-red-600 uppercase transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <button
                key={link.label}
                onClick={() => link.id && scrollToSection(link.id)}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                {link.label}
              </button>
            )
          )}
          <div 
            className="w-6 h-6 relative cursor-pointer" 
            onClick={handleFlagClick}
            title="Click exactly 5 times for secret access"
          >
            <Image 
              src="/kenya2.png" 
              alt="Kenya flag – click exactly 5 times to login" 
              fill 
              className="object-contain" 
            />
          </div>
        </div>
      </div>

      {/* Mobile / Small screens */}
      <div className="lg:hidden">
        <div className="h-16 px-4 flex items-center justify-between bg-white border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <Image src="/emc_aspirants_logo.png" alt="Logo" width={36} height={36} className="rounded-full" />
            <p className="text-[10px] font-bold text-red-600">REGISTER WITH PARTY PORTAL</p>
          </div>

          <div className="flex items-center gap-4">
            <div 
              className="w-6 h-6 relative cursor-pointer" 
              onClick={handleFlagClick}
              title="Click exactly 5 times for secret access"
            >
              <Image 
                src="/kenya2.png" 
                alt="Kenya flag – click exactly 5 times to login" 
                fill 
                className="object-contain" 
              />
            </div>

            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              <div className="space-y-1.5">
                <span className={`block w-6 h-0.5 bg-gray-700 transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-6 h-0.5 bg-gray-700 ${isOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-6 h-0.5 bg-gray-700 transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile slide-out menu */}
        <div
          className={`fixed top-16 right-0 w-64 bg-white shadow-2xl transition-transform duration-300 z-50 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.action) {
                    link.action();
                    setIsOpen(false);
                  } else if (link.id) {
                    scrollToSection(link.id);
                  }
                }}
                className="text-left font-bold text-gray-800 py-2 border-b last:border-none"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'join' && <JoinUs onClose={closeModal} stations={stations} />}
      {activeModal === 'support' && <SupportUs onClose={closeModal} stations={stations} />}
    </nav>
  );
}