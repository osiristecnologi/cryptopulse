import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import MemecoinCard from './MemecoinCard';
import { CardSkeleton } from './Skeleton';

export default function MenuOverlay({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('trending');
  const { data, loading } = useApi('/api/trending-memes', [], 15000);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] max-w-full z-50 bg-bg-secondary animate-slide-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-neon-blue">⚡</span> Trending Memecoins
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-white/5">
          {['trending', 'top gainers', 'top losers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeTab === tab ? 'bg-neon-blue/15 text-neon-blue' : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : data?.length ? (
            data
              .slice(0, activeTab === 'top losers' ? 20 : undefined)
              .sort((a, b) => {
                if (activeTab === 'top gainers') return (b.priceChange24h || 0) - (a.priceChange24h || 0);
                if (activeTab === 'top losers') return (a.priceChange24h || 0) - (b.priceChange24h || 0);
                return (b.volume24h || 0) - (a.volume24h || 0);
              })
              .map((meme, i) => <MemecoinCard key={meme.address || i} meme={meme} index={i} />)
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-3">🐸</div>
              <p className="text-sm">No memecoins found right now</p>
              <p className="text-xs text-gray-600 mt-1">Check back in a few seconds</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600">Data from DexScreener & CoinGecko · Auto-refresh every 15s</p>
        </div>
      </div>
    </>
  );
}
