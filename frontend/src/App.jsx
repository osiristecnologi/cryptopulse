import { useState, useCallback } from 'react';
import Header from './components/Header';
import PriceBar from './components/PriceBar';
import CryptoChart from './components/Chart';
import TimeframeButtons from './components/TimeframeButtons';
import MiniFeed from './components/MiniFeed';
import MenuOverlay from './components/MenuOverlay';

export default function App() {
  const [activeSymbol, setActiveSymbol] = useState('BTC');
  const [activeInterval, setActiveInterval] = useState('1h');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSymbolChange = useCallback((symbol) => {
    setActiveSymbol(symbol.toUpperCase());
  }, []);

  const handleIntervalChange = useCallback((interval) => {
    setActiveInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <Header
        onMenuOpen={() => setMenuOpen(true)}
        currentSymbol={activeSymbol}
        onSymbolChange={handleSymbolChange}
      />

      {/* Main Content */}
      <main className="flex-1 pt-14 flex flex-col">
        {/* Price Bar */}
        <PriceBar onCoinClick={handleSymbolChange} activeCoin={activeSymbol} />

        {/* Mini Feed */}
        <MiniFeed />

        {/* Chart Container */}
        <div className="flex-1 flex flex-col min-h-[350px] sm:min-h-[450px]">
          {/* Timeframe Buttons */}
          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{activeSymbol}<span className="text-gray-500 text-sm font-normal">/USDT</span></h1>
            </div>
            <TimeframeButtons active={activeInterval} onChange={handleIntervalChange} />
          </div>

          {/* Chart */}
          <div className="flex-1 px-1 sm:px-2 pb-2">
            <div className="w-full h-full glass rounded-xl overflow-hidden">
              <CryptoChart symbol={activeSymbol} interval={activeInterval} />
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="px-3 py-2 flex items-center gap-4 text-xs text-gray-500 border-t border-white/5">
          <span>📊 24h Vol: <span className="text-gray-300 font-mono">$--</span></span>
          <span>📈 High: <span className="text-neon-green font-mono">$--</span></span>
          <span>📉 Low: <span className="text-neon-pink font-mono">$--</span></span>
          <span className="ml-auto text-gray-600">Auto-refresh: 10s</span>
        </div>
      </main>

      {/* Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
