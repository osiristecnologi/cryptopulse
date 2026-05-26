import { useApi } from '../hooks/useApi';
import { formatPrice, formatPct, pctColor, formatCompact } from '../utils/formatters';

const MAIN_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
];

export default function PriceBar({ onCoinClick, activeCoin }) {
  const { data, loading } = useApi('/api/markets', [], 10000);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-3 py-2 -mx-1">
        {MAIN_COINS.map(c => (
          <div key={c.id} className="glass rounded-xl p-3 min-w-[140px] shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full shimmer-bg" />
              <span className="text-sm font-medium text-gray-400">{c.symbol}</span>
            </div>
            <div className="h-5 w-20 shimmer-bg rounded" />
          </div>
        ))}
      </div>
    );
  }

  const coins = data?.length ? data : MAIN_COINS.map(c => ({ ...c, current_price: 0, price_change_percentage_24h: 0, total_volume: 0, market_cap: 0 }));

  return (
    <div className="flex gap-2 sm:gap-3 overflow-x-auto px-3 py-2 -mx-1 scrollbar-hide">
      {coins.map(coin => {
        const isActive = coin.symbol?.toUpperCase() === activeCoin;
        const change = coin.price_change_percentage_24h || 0;
        return (
          <button
            key={coin.id || coin.symbol}
            onClick={() => onCoinClick?.(coin.symbol?.toUpperCase() || coin.id)}
            className={`glass rounded-xl p-3 min-w-[130px] sm:min-w-[150px] shrink-0 transition-all hover:scale-[1.02] ${isActive ? 'neon-border border-neon-blue/30' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {coin.image ? (
                <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" loading="lazy" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-surface-3" />
              )}
              <span className="text-xs font-semibold text-gray-400">{coin.symbol?.toUpperCase()}</span>
              {change > 10 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green font-bold">HOT</span>
              )}
            </div>
            <div className="text-base font-mono font-semibold text-white mb-1">
              {formatPrice(coin.current_price)}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-medium ${pctColor(change)}`}>
                {formatPct(change)}
              </span>
              <span className="text-[10px] text-gray-500">Vol {formatCompact(coin.total_volume)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
