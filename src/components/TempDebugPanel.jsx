import React, { useState } from 'react';

export default function TempDebugPanel({ title, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    setLogs('Generating debug logs...');
    try {
      const data = await onRefresh();
      setLogs(JSON.stringify(data, null, 2));
    } catch (e) {
      setLogs('Error generating logs: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(logs);
      alert('Logs copied to clipboard!');
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = logs;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Logs copied to clipboard!');
      } catch (err) {
        alert('Failed to copy logs');
      }
      document.body.removeChild(textArea);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => { setIsOpen(true); handleRefresh(); }}
        className="absolute top-4 right-4 z-50 px-3 py-1 bg-black/80 border border-green-500 text-green-500 rounded text-[10px] font-mono shadow-lg"
      >
        {title}
      </button>
    );
  }

  return (
    <div className="fixed inset-4 z-[999] bg-black/95 border border-green-500 rounded-xl flex flex-col p-4 shadow-2xl font-mono text-[10px] text-green-500 overflow-hidden">
      <div className="flex justify-between items-center mb-3 border-b border-green-500/30 pb-2 flex-shrink-0">
        <span className="font-bold truncate mr-2">{title}</span>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleRefresh} disabled={loading} className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 rounded transition-colors disabled:opacity-50">Refresh</button>
          <button onClick={handleCopy} disabled={loading} className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 rounded transition-colors disabled:opacity-50">Copy</button>
          <button onClick={() => setIsOpen(false)} className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded transition-colors">Close</button>
        </div>
      </div>
      <textarea 
        readOnly 
        value={logs} 
        className="flex-1 w-full bg-transparent border border-green-500/30 rounded p-2 text-green-400 resize-none outline-none focus:border-green-500"
      />
    </div>
  );
}
