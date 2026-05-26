import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import axios from 'axios';
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
  USDT: 'tether', USDC: 'usd-coin', XRP: 'ripple', DOGE: 'dogecoin',
  ADA: 'cardano', SHIB: 'shiba-inu', AVAX: 'avalanche-2', DOT: 'polkadot',
  LINK: 'chainlink', MATIC: 'matic-network', UNI: 'uniswap', LTC: 'litecoin',
  PEPE: 'pepe', WIF: 'dogwifcoin', BONK: 'bonk', FLOKI: 'floki',
};

// ==================== HELPERS ====================
// Cache global pra evitar 429 - 30s de duração
const priceCache = new Map();

async function getDexScreenerPrice(symbol) {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '');

  const { data } = await axios.get(
    `https://api.dexscreener.com/latest/dex/search?q=${cleanSymbol}`,
    { timeout: 5000 }
  );

  const pair = data.pairs?.find(p =>
    p.baseToken.symbol.toUpperCase() === cleanSymbol &&
    p.quoteToken.symbol === 'USDT' &&
    p.liquidity?.usd > 10000 // só pares com liquidez
  );

  if (!pair) throw new Error(`Symbol ${symbol} not found on DexScreener`);

  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(pair.priceUsd),
    priceChangePercent: parseFloat(pair.priceChange?.h24 || 0),
    volume: parseFloat(pair.volume?.h24 || 0),
    marketCap: parseFloat(pair.fdv || 0),
    liquidity: parseFloat(pair.liquidity?.usd || 0),
    source: 'dexscreener'
  };
}

async function getCoinGeckoPrice(symbol) {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '');
  const coinId = SYMBOL_MAP[cleanSymbol] || cleanSymbol.toLowerCase();

  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      params: {
        ids: coinId,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_24hr_vol: true,
        include_market_cap: true
      },
      timeout: 5000
    }
  );

  const coinData = data[coinId];
  if (!coinData?.usd) throw new Error(`Symbol ${symbol} not found on CoinGecko`);

  return {
    symbol: symbol.toUpperCase(),
    price: coinData.usd,
    priceChangePercent: coinData.usd_24h_change || 0,
    volume: coinData.usd_24h_vol || 0,
    marketCap: coinData.usd_market_cap || 0,
    source: 'coingecko'
  };
}

// ==================== ENDPOINTS ====================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    node: process.version,
    cacheSize: priceCache.size
  });
});

// GET /api/price/:symbol - DEXSCREENER PRIMEIRO
app.get('/api/price/:symbol', sanitizeInput, async (req, res) => {
  const rawSymbol = req.params.symbol.toUpperCase();
  const cacheKey = `price_${rawSymbol}`;

  try {
    // 1. Cache de 30s - evita 429
    if (priceCache.has(cacheKey)) {
      const { data, timestamp } = priceCache.get(cacheKey);
      if (Date.now() - timestamp < 30000) {
        return res.json({...data, source: 'cache' });
      }
    }

    // 2. Tenta DexScreener primeiro - sem rate limit
    try {
      const data = await getDexScreenerPrice(rawSymbol);
      priceCache.set(cacheKey, { data, timestamp: Date.now() });
      return res.json(data);
    } catch (dsErr) {
      console.warn(`DexScreener failed for ${rawSymbol}:`, dsErr.message);
    }

    // 3. Fallback CoinGecko se DexScreener falhar
    const data = await getCoinGeckoPrice(rawSymbol);
    priceCache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(data);

  } catch (err) {
    console.error(`GET /api/price/${rawSymbol}:`, err.message);

    // 4. Última tentativa: retorna cache antigo mesmo expirado
    if (priceCache.has(cacheKey)) {
      const { data } = priceCache.get(cacheKey);
      return res.json({...data, source: 'stale-cache' });
    }

    const status = err.message.includes('not found')? 404 : 503;
    res.status(status).json({
      error: 'Failed to fetch price',
      detail: err.message
    });
  }
});

// GET /api/markets
app.get('/api/markets', async (req, res) => {
  try {
    if (cache.has(CACHE_KEYS.MARKETS)) {
      return res.json({ source: 'cache', data: cache.get(CACHE_KEYS.MARKETS) });
    }
    const data = await coingecko.getMarkets();
    cache.set(CACHE_KEYS.MARKETS, data, 60); // 60s cache
    res.json({ source: 'coingecko', data });
  } catch (err) {
    const cached = cache.get(CACHE_KEYS.MARKETS);
    if (cached) return res.json({ source: 'cache-fallback', data: cached });
    res.status(500).json({ error: 'Failed to fetch markets', data: [] });
  }
});

// Demais rotas iguais...
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

    cache.set(cacheKey, formatted, 30);
    res.json({ source: 'coingecko', data: formatted });
  } catch (err) {
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ source: 'cache-fallback', data: cached });
    res.status(500).json({ error: 'Failed to fetch chart', data: [] });
  }
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
});

app.listen(PORT, () => {
  console.log(`🚀 CryptoPulse Backend running on port ${PORT}`);
  console.log(`Node ${process.version}`);
});
