import { useState, useEffect, useRef } from 'react';
import { formatPrice, formatPct, pctColor } from '../utils/formatters';

const FEED_ITEMS = [
  { symbol: 'BTC', name: 'Bitcoin', action: 'broke $100K resistance', type: 'bullish' },
  { symbol: 'PEPE', name: 'Pepe', action: 'surged 15% in 1h', type: 'bullish' },
  { symbol: 'WIF', name: 'dogwifhat', action: 'new ATH reached', type: 'bullish' },
  { symbol: 'SOL', name: 'Solana', action: 'volume spike detected', type: 'bullish' },
  { symbol: 'BONK', name: 'Bonk', action: 'whale accumulation', type: 'bullish' },
  { symbol: 'ETH', name: 'Ethereum', action: 'gas fees dropping', type: 'neutral' },
  { symbol: 'POPCAT', name: 'Popcat', action: 'trending #1 on DexScreener', type: 'bullish' },
  { symbol: 'GOAT', name: 'GOAT', action: 'AI narrative gaining', type: 'bullish' },
];

export default function MiniFeed() {
  const [visible, setVisible] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisible(prev => (prev + 1) % FEED_ITEMS.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const item = FEED_ITEMS[visible];
  const typeColor = item.type === 'bullish' ? 'text-neon-green' : 'text-gray-400';
  const dotColor = item.type === 'bullish' ? 'bg-neon-green' : 'bg-gray-500';

  return (
    <div className="px-3 py-2 overflow-hidden">
      <div className="flex items-center gap-2 text-xs">
        <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
        <span className="text-gray-500 font-medium">LIVE</span>
        <div className="flex-1 overflow-hidden relative h-4">
          <div className="animate-fade-in">
            <span className="font-semibold text-white">{item.symbol}</span>
            <span className="text-gray-400"> {item.action}</span>
            <span className={`ml-2 ${typeColor} font-medium`}>{formatPct(Math.random() * 20 - 5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
