import { useState } from 'react';
import SearchOverlay from './SearchOverlay';
import MenuOverlay from './MenuOverlay';

export default function Header({ onMenuOpen, currentSymbol, onSymbolChange }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuOpen}
            className="p-2 -ml-2 rounded-lg hover:bg-surface-2 transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSymbolChange?.('BTC')}>
            <span className="text-xl">⚡</span>
            <span className="font-bold text-lg tracking-tight neon-text-blue text-neon-blue">Crypto</span>
            <span className="font-bold text-lg tracking-tight text-white">Pulse</span>
          </div>
        </div>

        {/* Current Symbol */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-lg">
          <span className="text-gray-400 text-sm">{currentSymbol}</span>
          <span className="text-neon-blue text-xs font-mono">USD</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
            aria-label="Search"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onSymbolChange={onSymbolChange} />}
    </header>
  );
}
