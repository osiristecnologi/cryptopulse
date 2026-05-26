import { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { formatPrice, formatPct, pctColor } from '../utils/formatters';

export default function SearchOverlay({ onClose, onSymbolChange }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef(null);

  const { data } = useApi(
    debouncedQuery ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    [debouncedQuery],
    0
  );

  useEffect(() => {
    inputRef.current?.focus();
    const handler = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = useCallback((item) => {
    if (item?.id) {
      onSymbolChange?.(item.id);
    } else if (item?.pairAddress) {
      onSymbolChange?.(item.baseToken?.symbol || item.pairAddress);
    }
    onClose();
  }, [onSymbolChange, onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="w-full max-w-lg glass rounded-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tokens, memecoins, chains..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          />
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xs font-medium">ESC</button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Type at least 2 characters to search
            </div>
          )}

          {data?.coins?.slice(0, 6).map(coin => (
            <button
              key={coin.id}
              onClick={() => handleSelect(coin)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
            >
              <img src={coin.thumb || coin.large} alt="" className="w-8 h-8 rounded-full" loading="lazy" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{coin.name}</div>
                <div className="text-xs text-gray-500">{coin.symbol?.toUpperCase()}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-gray-400">CG</span>
            </button>
          ))}

          {data?.pairs?.slice(0, 6).map(pair => (
            <button
              key={pair.pairAddress}
              onClick={() => handleSelect(pair)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
            >
              <img src={pair.info?.imageUrl} alt="" className="w-8 h-8 rounded-full" loading="lazy" onError={e => e.target.style.display = 'none'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{pair.baseToken?.name}</div>
                <div className="text-xs text-gray-500">{pair.baseToken?.symbol} / {pair.quoteToken?.symbol} · {pair.chainId}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">{formatPrice(pair.priceUsd)}</div>
                <div className={`text-xs font-mono ${pctColor(pair.priceChange?.h24)}`}>{formatPct(pair.priceChange?.h24)}</div>
              </div>
            </button>
          ))}

          {query.length >= 2 && !data?.coins?.length && !data?.pairs?.length && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
                }
