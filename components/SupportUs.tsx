'use client';

import { useState, useTransition, FormEvent, useMemo } from 'react';
import { ActionResponse, createFundsDonation, createGiftDonation, createSkillAgent } from './actionsSupport';

interface PollingStation {
  id: string;
  name: string;
  ward?: string | null;
}

interface SupportUsProps {
  onClose: () => void;
  stations: PollingStation[];
}

type SupportType = 'funds' | 'gifts' | 'skills' | null;

export default function SupportUs({ onClose, stations }: SupportUsProps) {
  const [type, setType] = useState<SupportType>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<ActionResponse | null>(null);

  // For skills form only
  const [stationSearch, setStationSearch] = useState('');

  const filteredStations = useMemo(() => {
    if (!stationSearch.trim()) return stations;
    const lower = stationSearch.toLowerCase();
    return stations.filter(
      (st) =>
        st.name.toLowerCase().includes(lower) ||
        (st.ward && st.ward.toLowerCase().includes(lower))
    );
  }, [stations, stationSearch]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let res: ActionResponse | undefined;

      if (type === 'funds') {
        res = await createFundsDonation(formData);
      } else if (type === 'gifts') {
        res = await createGiftDonation(formData);
      } else if (type === 'skills') {
        res = await createSkillAgent(formData);
      }

      setMessage(res ?? { error: 'Something went wrong' });

      if (res?.success) {
        setTimeout(() => {
          onClose();
          setType(null);
          setMessage(null);
          setStationSearch('');
        }, 2200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg md:max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-3xl text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900">
            Support Our Aspirants
          </h2>

          {!type ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
              <button
                onClick={() => setType('funds')}
                className="flex flex-col items-center p-8 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border border-green-200 transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                <span className="text-6xl mb-4">💰</span>
                <h3 className="text-xl font-bold text-green-800">Funds</h3>
                <p className="text-green-700 text-center mt-2 text-sm">Monetary support</p>
              </button>

              <button
                onClick={() => setType('gifts')}
                className="flex flex-col items-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                <span className="text-6xl mb-4">🎁</span>
                <h3 className="text-xl font-bold text-blue-800">Gifts</h3>
                <p className="text-blue-700 text-center mt-2 text-sm">Products, services, items</p>
              </button>

              <button
                onClick={() => setType('skills')}
                className="flex flex-col items-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border border-purple-200 transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                <span className="text-6xl mb-4">🛡️</span>
                <h3 className="text-xl font-bold text-purple-800">Agent</h3>
                <p className="text-purple-700 text-center mt-2 text-sm">Become a polling agent / observer</p>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setType(null);
                  setMessage(null);
                  setStationSearch('');
                }}
                className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
              >
                ← Back to options
              </button>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="+2547xxxxxxxx"
                  />
                </div>

                {type === 'funds' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Amount (KES) <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="amount"
                      type="number"
                      min="100"
                      step="1"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                      placeholder="e.g. 5000"
                    />
                  </div>
                )}

                {type === 'gifts' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Describe your gift / product / service <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      name="describe"
                      rows={4}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                      placeholder="e.g. 50kg bags of rice, printing services, fuel support..."
                    />
                  </div>
                )}

                {type === 'skills' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Polling Station <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Search polling station by name or ward..."
                        value={stationSearch}
                        onChange={(e) => setStationSearch(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none mb-2 transition-all"
                      />
                      <select
                        name="pollingStationId"
                        required
                        size={Math.min(8, filteredStations.length + 1)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white outline-none transition-all h-48 overflow-y-auto"
                      >
                        <option value="" disabled>
                          {filteredStations.length === 0 ? 'No stations match your search' : 'Select polling station'}
                        </option>
                        {filteredStations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} {st.ward ? ` — ${st.ward}` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Position / Role <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="position"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white outline-none transition-all"
                      >
                        <option value="">Select role</option>
                        <option value="Agent">Agent</option>
                        <option value="Observer">Observer</option>
                        <option value="Mobilizer">Mobilizer</option>
                        <option value="Coordinator">Coordinator</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className={`w-full py-4 px-6 text-white font-bold rounded-lg transition-colors ${
                    isPending
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 shadow-md'
                  }`}
                >
                  {isPending ? 'Submitting...' : `Submit ${type === 'funds' ? 'Donation' : type === 'gifts' ? 'Gift' : 'Agent Registration'}`}
                </button>

                {message && (
                  <div
                    className={`p-4 rounded-lg text-center ${
                      message.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {message.success || message.error}
                  </div>
                )}
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Thank you for your generous support — may you never lack!
          </p>
        </div>
      </div>
    </div>
  );
}