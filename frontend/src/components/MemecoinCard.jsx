import { formatPrice, formatPct, pctColor, formatCompact } from '../utils/formatters';

export default function MemecoinCard({ meme, index }) {
  const change = meme.priceChange24h || 0;
  const isHot = change > 25;
  const isTrending = change > 10;

  return (
    <div className="glass rounded-xl p-4 hover:bg-surface-2/80 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-600 w-5">#{index + 1}</span>
          <img
            src={meme.image || `https://picsum.photos/seed/${meme.symbol}/40/40`}
            alt={meme.symbol}
            className="w-9 h-9 rounded-full border border-white/5"
            loading="lazy"
            onError={e => { e.target.src = `https://picsum.photos/seed/${meme.symbol}/40/40`; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{meme.name}</span>
              {isHot && <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-pink/15 text-neon-pink font-bold animate-pulse">🔥 HOT</span>}
              {isTrending && !isHot && <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-yellow/15 text-neon-yellow font-bold">TRENDING</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">${meme.symbol}</span>
              <span className="text-[10px] px-1.5 rounded bg-surface-3 text-gray-500">{meme.chain}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-semibold">{formatPrice(meme.price)}</div>
          <div className={`text-xs font-mono font-medium ${pctColor(change)}`}>
            {formatPct(change)}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-surface-2/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-500 mb-0.5">Liquidity</div>
          <div className="text-xs font-mono font-medium">{formatCompact(meme.liquidity)}</div>
        </div>
        <div className="bg-surface-2/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-500 mb-0.5">Volume 24h</div>
          <div className="text-xs font-mono font-medium">{formatCompact(meme.volume24h)}</div>
        </div>
        <div className="bg-surface-2/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-500 mb-0.5">Market Cap</div>
          <div className="text-xs font-mono font-medium">{formatCompact(meme.marketCap)}</div>
        </div>
        <div className="bg-surface-2/50 rounded-lg p-2">
          <div className="text-[10px] text-gray-500 mb-0.5">Contract</div>
          <div className="text-[10px] font-mono text-gray-400 truncate">{meme.address?.slice(0, 8)}...{meme.address?.slice(-4)}</div>
        </div>
      </div>

      {/* Social Links */}
      <div className="flex items-center gap-2">
        {meme.website && (
          <a href={meme.website} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-surface-3 text-gray-400 hover:text-white hover:bg-surface-2 transition-colors">🌐 Site</a>
        )}
        {meme.twitter && (
          <a href={meme.twitter} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-surface-3 text-gray-400 hover:text-white hover:bg-surface-2 transition-colors">𝕏 Twitter</a>
        )}
        {meme.telegram && (
          <a href={meme.telegram} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-surface-3 text-gray-400 hover:text-white hover:bg-surface-2 transition-colors">✈️ TG</a>
        )}
        <a href={meme.url || `https://dexscreener.com/${meme.chain}/${meme.address}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] px-3 py-1 rounded bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors font-medium">
          Open Chart →
        </a>
      </div>
    </div>
  );
}
