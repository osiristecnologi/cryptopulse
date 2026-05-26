import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as coingecko from './services/coingecko.js';
import * as dexscreener from './services/dexscreener.js';
import { cache, CACHE_KEYS } from './services/cache.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'https://cryptopulse-yy4l.onrender.com'] }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ windowMs: 60000, max: 60 });
app.use('/api/', limiter);

// ========== HELPERS ==========
const SYMBOL_TO_ID = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  DOGE: 'dogecoin', SHIB: 'shiba-inu', PEPE: 'pepe', WIF: 'dogwifcoin', BONK: 'bonk'
};

async function getPriceFromDexScreener(symbol) {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '');
  const { pairs } = await dexscreener.searchPairs(cleanSymbol);
  
  const pair = pairs?.find(p => 
    p.baseToken.symbol.toUpperCase() === cleanSymbol &&
    p.quoteToken.symbol === 'USDT' &&
    p.liquidity?.usd > 10000
  );
  
  if (!pair) throw new Error('Not found on DexScreener');
  
  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(pair.priceUsd),
    priceChangePercent: parseFloat(pair.priceChange?.h24 || 0),
    volume: parseFloat(pair.volume?.h24 || 0),
    marketCap: parseFloat(pair.fdv || 0),
    source: 'dexscreener'
  };
}

async function getPriceFromCoinGecko(symbol) {
  const coinId = SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
  const data = await coingecko.getCoinMarketData(coinId);
  
  if (!data?.market_data?.current_price?.usd) throw new Error('Not found on CoinGecko');
  
  return {
    symbol: symbol.toUpperCase(),
    price: data.market_data.current_price.usd,
    priceChangePercent: data.market_data.price_change_percentage_24h || 0,
    volume: data.market_data.total_volume.usd || 0,
    marketCap: data.market_data.market_cap.usd || 0,
    source: 'coingecko'
  };
}

// ========== ROUTES ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', cacheKeys: cache.keys().length });
});

app.get('/api/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `price_${symbol}`;
  
  try {
    // 1. Cache primeiro - 30s
    if (cache.has(cacheKey)) {
      return res.json({ ...cache.get(cacheKey), source: 'cache' });
    }
    
    // 2. DexScreener - sem rate limit
    try {
      const data = await getPriceFromDexScreener(symbol);
      cache.set(cacheKey, data);
      return res.json(data);
    } catch (dsErr) {
      console.warn(`DexScreener fail ${symbol}:`, dsErr.message);
    }
    
    // 3. CoinGecko - fallback com cuidado
    const data = await getPriceFromCoinGecko(symbol);
    cache.set(cacheKey, data);
    res.json(data);
    
  } catch (err) {
    // 4. Stale cache se tudo falhar
    if (cache.has(cacheKey)) {
      return res.json({ ...cache.get(cacheKey), source: 'stale-cache' });
    }
    res.status(503).json({ error: 'Failed to fetch price', detail: err.message });
  }
});

app.get('/api/markets', async (req, res) => {
  try {
    if (cache.has(CACHE_KEYS.MARKETS)) {
      return res.json({ source: 'cache', data: cache.get(CACHE_KEYS.MARKETS) });
    }
    const data = await coingecko.getMarkets();
    cache.set(CACHE_KEYS.MARKETS, data, 60); // 60s pra markets
    res.json({ source: 'coingecko', data });
  } catch (err) {
    const cached = cache.get(CACHE_KEYS.MARKETS);
    if (cached) return res.json({ source: 'stale-cache', data: cached });
    res.status(500).json({ error: 'Failed', data: [] });
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    if (cache.has(CACHE_KEYS.TRENDING)) {
      return res.json({ source: 'cache', data: cache.get(CACHE_KEYS.TRENDING) });
    }
    const data = await dexscreener.getTrending();
    cache.set(CACHE_KEYS.TRENDING, data, 300); // 5min pra trending
    res.json({ source: 'dexscreener', data });
  } catch (err) {
    res.status(500).json({ error: 'Failed', data: [] });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend on ${PORT}`));
