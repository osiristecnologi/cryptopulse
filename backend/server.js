import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { cache, CACHE_KEYS } from './services/cache.js';
import * as coingecko from './services/coingecko.js';
import * as dexscreener from './services/dexscreener.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ==================== MIDDLEWARES ====================
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://cryptopulse-yy4l.onrender.com'
  ],
  credentials: false
}));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const sanitizeInput = (req, res, next) => {
  const sanitize = (val) => sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} });
  if (req.query?.q) req.query.q = sanitize(req.query.q);
  if (req.params?.symbol) req.params.symbol = sanitize(req.params.symbol);
  if (req.params?.address) req.params.address = sanitize(req.params.address);
  next();
};

// ==================== CONSTANTS ====================
const SYMBOL_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  DOGE: 'dogecoin', SHIB: 'shiba-inu', PEPE: 'pepe', XRP: 'ripple',
  ADA: 'cardano', AVAX: 'avalanche-2', MATIC: 'matic-network',
  DOT: 'polkadot', LINK: 'chainlink', UNI: 'uniswap', AAVE: 'aave',
  NEAR: 'near', FIL: 'filecoin', APT: 'aptos', ARB: 'arbitrum',
  OP: 'optimism', SUI: 'sui', SEI: 'sei-network', TIA: 'celestia',
  JUP: 'jupiter-exchange-solana', WIF: 'dogwifcoin', BONK: 'bonk',
  FLOKI: 'floki', MEME: 'memecoin', POPCAT: 'popcat', GOAT: 'goatseus-maximus',
};

// ==================== HELPERS ====================
async function getMarketsWithFallback() {
  if (cache.has(CACHE_KEYS.MARKETS)) {
    return { source: 'cache', data: cache.get(CACHE_KEYS.MARKETS) };
  }

  try {
    const data = await coingecko.getMarkets();
    cache.set(CACHE_KEYS.MARKETS, data, 30);
    return { source: 'coingecko', data };
  } catch (err) {
    console.error('CoinGecko failed:', err.message);
    const fallback = await dexscreener.searchPairs('bitcoin ethereum solana bnb');
    const data = fallback.pairs?.slice(0, 10).map(p => ({
      id: p.baseToken.symbol.toLowerCase(),
      symbol: p.baseToken.symbol.toUpperCase(),
      name: p.baseToken.name,
      current_price: parseFloat(p.priceUsd),
      price_change_percentage_24h: p.priceChange?.h24 || 0,
      total_volume: p.volume?.h24 || 0,
      market_cap: p.fdv || 0,
      image: p.info?.imageUrl || '',
    })) || [];
    return { source: 'dexscreener-fallback', data };
  }
}

async function getBinancePrice(symbol) {
  const binanceSymbol = symbol.includes('USDT')? symbol : `${symbol}USDT`;
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
  if (!res.ok) throw new Error(`Binance: ${binanceSymbol} not found`);
  const data = await res.json();
  return {
    symbol: data.symbol,
    price: parseFloat(data.lastPrice),
    priceChangePercent: parseFloat(data.priceChangePercent),
    volume: parseFloat(data.volume),
    source: 'binance'
  };
}

// ==================== ENDPOINTS ====================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// GET /api/markets
app.get('/api/markets', async (req, res) => {
  try {
    const { source, data } = await getMarketsWithFallback();
    res.json({ source, data });
  } catch (err) {
    const cached = cache.get(CACHE_KEYS.MARKETS);
    if (cached) return res.json({ source: 'cache-fallback', data: cached });
    res.status(500).json({ error: 'Failed to fetch markets', data: [] });
  }
});

// GET /api/price/:symbol - COM FALLBACK BINANCE
app.get('/api/price/:symbol', sanitizeInput, async (req, res) => {
  const rawSymbol = req.params.symbol.toUpperCase();
  const cleanSymbol = rawSymbol.replace('USDT', '');

  try {
    // 1. Tenta CoinGecko via cache/markets
    const { data: markets } = await getMarketsWithFallback();
    const coin = markets.find(c =>
      c.symbol.toUpperCase() === cleanSymbol ||
      c.id === SYMBOL_MAP[cleanSymbol]
    );

    if (coin) {
      return res.json({
        symbol: rawSymbol,
        price: coin.current_price,
        priceChangePercent: coin.price_change_percentage_24h,
        source: 'coingecko'
      });
    }

    // 2. Fallback Binance - nunca falha pra majors
    const binanceData = await getBinancePrice(rawSymbol);
    return res.json(binanceData);

  } catch (err) {
    console.error(`GET /api/price/${rawSymbol} ERROR:`, err.message);
    res.status(500).json({ error: 'Failed to fetch price', detail: err.message });
  }
});

// GET /api/chart/:symbol
app.get('/api/chart/:symbol', sanitizeInput, async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const interval = req.query.interval || '1h';
  const cacheKey = CACHE_KEYS.CHART(`${symbol}_${interval}`);

  try {
    if (cache.has(cacheKey)) {
      return res.json({ source: 'cache', data: cache.get(cacheKey) });
    }

    const coinId = SYMBOL_MAP[symbol] || symbol.toLowerCase();
    const days = { '1m': 1, '5m': 1, '15m': 3, '30m': 5, '1h': 7 }[interval] || 7;

    let data;
    try {
      data = await coingecko.getOhlcv(coinId, days);
    } catch {
      const pairs = await dexscreener.searchPairs(coinId);
      data = pairs.pairs?.[0]?.info?.pairData || [];
    }

    const formatted = (data || []).map(d => ({
      time: Math.floor((d[0] || Date.now()) / 1000),
      open: d[1] || 0,
      high: d[2] || 0,
      low: d[3] || 0,
      close: d[4] || 0,
    })).filter(d => d.open > 0);

    cache.set(cacheKey, formatted, 15);
    res.json({ source: 'coingecko', data: formatted });
  } catch (err) {
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ source: 'cache-fallback', data: cached });
    res.status(500).json({ error: 'Failed to fetch chart', data: [] });
  }
});

// GET /api/search?q=
app.get('/api/search', sanitizeInput, async (req, res) => {
  const query = req.query.q?.trim();
  if (!query || query.length < 2) return res.json({ coins: [], pairs: [] });

  const cacheKey = CACHE_KEYS.SEARCH(query);
  try {
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const [cgResult, dsResult] = await Promise.allSettled([
      coingecko.searchCoins(query),
      dexscreener.searchPairs(query),
    ]);

    const result = {
      coins: cgResult.status === 'fulfilled'? (cgResult.value.coins || []) : [],
      pairs: dsResult.status === 'fulfilled'? (dsResult.value.pairs || []) : [],
    };

    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch {
    res.json({ coins: [], pairs: [] });
  }
});

// GET /api/trending-memes
app.get('/api/trending-memes', async (req, res) => {
  try {
    if (cache.has(CACHE_KEYS.TRENDING)) {
      return res.json({ source: 'cache', data: cache.get(CACHE_KEYS.TRENDING) });
    }

    let data = [];
    try {
      const trending = await dexscreener.getTrending();
      data = trending || [];
    } catch (err) {
      console.error('DexScreener trending failed:', err.message);
    }

    const enriched = data.map(p => ({
      name: p.baseToken?.name || 'Unknown',
      symbol: p.baseToken?.symbol || '???',
      price: parseFloat(p.priceUsd || 0),
      priceChange24h: parseFloat(p.priceChange?.h24 || 0),
      volume24h: parseFloat(p.volume?.h24 || 0),
      liquidity: parseFloat(p.liquidity?.usd || 0),
      marketCap: parseFloat(p.fdv || 0),
      chain: p.chainId || 'unknown',
      address: p.pairAddress || '',
      url: p.url || '',
      image: p.info?.imageUrl || '',
      website: p.info?.websites?.[0]?.url || '',
      twitter: p.info?.socials?.find(s => s.type === 'twitter')?.url || '',
      telegram: p.info?.socials?.find(s => s.type === 'telegram')?.url || '',
    }));

    cache.set(CACHE_KEYS.TRENDING, enriched, 15);
    res.json({ source: 'dexscreener', data: enriched });
  } catch (err) {
    const cached = cache.get(CACHE_KEYS.TRENDING);
    if (cached) return res.json({ source: 'cache-fallback', data: cached });
    res.status(500).json({ error: 'Failed to fetch trending', data: [] });
  }
});

// GET /api/token/:address
app.get('/api/token/:address', sanitizeInput, async (req, res) => {
  const address = req.params.address;
  const cacheKey = CACHE_KEYS.TOKEN(address);

  try {
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const pairs = await dexscreener.getTokenPairs(address);
    const data = pairs.pairs?.[0];
    if (!data) return res.status(404).json({ error: 'Token not found' });

    const enriched = {
      name: data.baseToken?.name,
      symbol: data.baseToken?.symbol,
      price: parseFloat(data.priceUsd || 0),
      priceChange24h: parseFloat(data.priceChange?.h24 || 0),
      volume24h: parseFloat(data.volume?.h24 || 0),
      liquidity: parseFloat(data.liquidity?.usd || 0),
      chain: data.chainId,
      address: data.pairAddress,
      image: data.info?.imageUrl || '',
    };

    cache.set(cacheKey, enriched, 15);
    res.json(enriched);
  } catch (err) {
    console.error('Token error:', err.message);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
});

app.listen(PORT, () => console.log(`🚀 CryptoPulse Backend running on port ${PORT}`));
