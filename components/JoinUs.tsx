"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { FiX, FiSearch, FiCheckCircle, FiLoader } from "react-icons/fi";
import { joinUsAction, ActionResponse } from "./actionsjoin";

export interface PollingStation {
  id: string;
  name: string;
  ward: string;
}

interface JoinUsProps {
  onClose: () => void;
  stations: PollingStation[];
}

export default function JoinUs({ onClose, stations }: JoinUsProps) {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<ActionResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStation, setSelectedStation] = useState<PollingStation | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search logic
  const filteredStations = useMemo(() => {
    if (!searchTerm || selectedStation) return [];
    const term = searchTerm.toLowerCase();
    return stations.filter(s => 
      s.name.toLowerCase().includes(term) || s.ward.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [searchTerm, stations, selectedStation]);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    if (selectedStation) formData.append("pollingStationId", selectedStation.id);
    const result = await joinUsAction(formData);
    setStatus(result);
    setPending(false);
    if (result.success) setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed top-24 right-0 w-full sm:w-[450px] z-[60] p-4 animate-in slide-in-from-right duration-300">
      <div className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 rounded-l-3xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
          <FiX size={24} />
        </button>

        {!hasAgreed ? (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800 italic">Joining us is absolutely free.</h2>
            <div className="text-sm text-gray-600 space-y-4">
               <p>To create profile with us, the following are required:</p>
               <ol className="list-decimal ml-5 space-y-1">
                 <li>phone number - for regular updates</li>
                 <li>name</li>
                 <li>polling station</li>
               </ol>
            </div>
            <label className="flex items-center gap-3 p-4 bg-white/50 border rounded-2xl cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-green-600" onChange={(e) => setHasAgreed(e.target.checked)} />
              <span className="font-bold text-gray-700">Agree</span>
            </label>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-3">
             <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Name:</label>
                <input name="fullName" required className="p-2.5 rounded-xl border bg-white focus:ring-2 focus:ring-green-400 outline-none" disabled={pending} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">phone:</label>
                <input name="tel" type="tel" required className="p-2.5 rounded-xl border bg-white focus:ring-2 focus:ring-green-400 outline-none" disabled={pending} />
            </div>
            <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">polling station:</label>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={selectedStation ? selectedStation.name : searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setSelectedStation(null); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full p-2.5 pl-9 rounded-xl border bg-white focus:ring-2 focus:ring-green-400 outline-none"
                        required
                        disabled={pending}
                    />
                </div>
                {showDropdown && filteredStations.length > 0 && (
                    <div className="absolute top-full w-full mt-1 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
                        {filteredStations.map(s => (
                            <button key={s.id} type="button" onClick={() => { setSelectedStation(s); setShowDropdown(false); }} className="w-full text-left p-3 hover:bg-green-50 border-b last:border-none">
                                <p className="font-bold text-sm text-gray-800">{s.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase">{s.ward} Ward</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">position:</label>
                <input name="position" className="p-2.5 rounded-xl border bg-white focus:ring-2 focus:ring-green-400 outline-none" disabled={pending} />
            </div>
            {status?.error && <p className="text-red-500 text-xs font-bold text-center mt-2">{status.error}</p>}
            <button
              type="submit"
              disabled={!selectedStation || pending}
              className={`w-full font-black py-4 rounded-xl mt-2 shadow-md uppercase tracking-wider ${
                selectedStation && !pending ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              {pending ? <FiLoader className="animate-spin mx-auto" /> : status?.success ? "Success!" : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}