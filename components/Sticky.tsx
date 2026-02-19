"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { FiMessageCircle, FiX, FiSearch } from "react-icons/fi";
import { sendMessageAction } from "./actionsmessage";

interface PollingStation {
  id: string;
  name: string;
  ward: string;
}

export default function Sticky({ stations = [] }: { stations: PollingStation[] }) {
  // UI States
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);
  const [pending, setPending] = useState(false); 
  
  // THE LOCK: useRef is synchronous and prevents duplicates instantly
  const isSubmitting = useRef(false);

  // Form States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStation, setSelectedStation] = useState<PollingStation | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter stations based on search
  const filteredStations = useMemo(() => {
    if (!searchTerm || selectedStation) return [];
    return stations.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ward.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8); 
  }, [searchTerm, stations, selectedStation]);

  const handleSubmit = async (formData: FormData) => {
    // 1. INSTANT BLOCK: If already submitting, ignore all subsequent clicks
    if (isSubmitting.current) return;

    // 2. SET LOCKS
    isSubmitting.current = true;
    setPending(true); 
    setStatus(null);

    try {
      const result = await sendMessageAction(formData);
      setStatus(result);

      if (result.success) {
        // Clear form fields
        setSearchTerm("");
        setSelectedStation(null);
        
        // Close modal after delay
        setTimeout(() => {
          setIsOpen(false);
          setStatus(null);
        }, 2000);
      }
    } catch (err) {
      setStatus({ error: "A network error occurred. Try again." });
    } finally {
      // 3. RELEASE LOCKS (Allows retrying if there was an error)
      setPending(false); 
      isSubmitting.current = false;
    }
  };

  return (
    <div className="fixed right-6 bottom-12 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hover:scale-110 transition-transform duration-200"
      >
        {isOpen ? (
          <FiX size={64} className="text-red-400 bg-white rounded-full p-2 shadow-lg" />
        ) : (
          <FiMessageCircle size={64} className="text-green-400 drop-shadow-md" />
        )}
      </button>

      {isOpen && (
        <div className="fixed top-24 right-0 w-full sm:w-[400px] h-fit p-4 z-40 animate-in slide-in-from-right-10 duration-300">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl border border-white/20 rounded-l-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Send a Message</h2>
            
            <form action={handleSubmit} className="flex flex-col gap-3">
              <input 
                name="name" 
                placeholder="Full Name" 
                className="w-full p-2 rounded-lg border bg-white focus:ring-2 focus:ring-green-400 outline-none disabled:bg-gray-100" 
                required 
                disabled={pending} 
              />
              
              <input 
                name="tel" 
                type="tel" 
                placeholder="Telephone Number" 
                className="w-full p-2 rounded-lg border bg-white focus:ring-2 focus:ring-green-400 outline-none disabled:bg-gray-100" 
                required 
                disabled={pending} 
              />

              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Polling Station..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedStation(null);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full p-2 pl-10 rounded-lg border bg-white focus:ring-2 focus:ring-green-400 outline-none disabled:bg-gray-100"
                    required
                    disabled={pending}
                    autoComplete="off"
                  />
                  <input type="hidden" name="pollingStation" value={selectedStation?.name || ""} />
                </div>

                {showDropdown && filteredStations.length > 0 && (
                  <div className="absolute w-full mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-2xl z-[60]">
                    {filteredStations.map((station) => (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => {
                          setSelectedStation(station);
                          setSearchTerm(station.name);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-green-50 border-b border-gray-100 last:border-none"
                      >
                        <p className="font-bold text-sm text-gray-800">{station.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{station.ward} Ward</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea 
                name="message" 
                placeholder="Your message..." 
                rows={4} 
                className="w-full p-2 rounded-lg border bg-white focus:ring-2 focus:ring-green-400 outline-none disabled:bg-gray-100" 
                required 
                disabled={pending} 
              />

              {status?.error && <p className="text-red-500 text-sm font-medium">{status.error}</p>}
              {status?.success && <p className="text-green-600 text-sm font-medium">{status.success}</p>}

              <button
                type="submit"
                disabled={!selectedStation || pending}
                className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  selectedStation && !pending
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-lg" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {pending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : selectedStation ? (
                  "Send Message"
                ) : (
                  "Select a Station"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}