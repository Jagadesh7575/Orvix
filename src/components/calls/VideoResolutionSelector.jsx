import React from 'react';
import { Settings } from 'lucide-react';

export function VideoResolutionSelector({ currentResolution, changeResolution }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const options = [
    { label: 'Auto', value: 'auto' },
    { label: '360p Data Saver', value: '360p' },
    { label: '480p Balanced', value: '480p' },
    { label: '720p HD', value: '720p' },
  ];

  const handleSelect = (val) => {
    changeResolution(val);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden w-48 border border-gray-700">
          <div className="text-xs font-semibold px-4 py-2 text-gray-400 uppercase tracking-wider border-b border-gray-700">
            Resolution
          </div>
          <div className="flex flex-col">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`px-4 py-2 text-sm text-left hover:bg-gray-800 transition-colors ${currentResolution === opt.value ? 'bg-purple-600/20 text-purple-400 font-medium' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
