import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import axios from 'axios'; // USA AXIOS
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
};

// ==================== HELPERS ====================
async function getBinancePrice(symbol) {
  const binanceSymbol = symbol.includes('USDT')? symbol : `${symbol}USDT`;
  
  try {
    const { data } = await axios.get(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      { timeout: 5000 }
    );
    
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      priceChangePercent: parseFloat(data.priceChangePercent),
      volume: parseFloat(data.volume),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      source: 'binance'
    };
  } catch (err) {
    if (err.response?.status === 400) {
      throw new Error(`Symbol ${binanceSymbol} not found on Binance`);
    }
    throw new Error(`Binance API error: ${err.message}`);
  }
}

// ==================== ENDPOINTS ====================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), node: process.version });
});

// GET /api/test-binance - testa conexão
app.get('/api/test-binance', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.binance.com/api/v3/ping', { timeout: 3000 });
    res.json({ binance: true, data });
  } catch (e) {
    res.status(500).json({ binance: false, error: e.message });
  }
});

// GET /api/price/:symbol - USA AXIOS
app.get('/api/price/:symbol', sanitizeInput, async (req, res) => {
  const rawSymbol = req.params.symbol.toUpperCase();
  
  try {
    const binanceData = await getBinancePrice(rawSymbol);
    return res.json(binanceData);
  } catch (err) {
    console.error(`GET /api/price/${rawSymbol} ERROR:`, err.message);
    res.status(500).json({ 
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
    cache.set(CACHE_KEYS.MARKETS, data, 30);
    res.json({ source: 'coingecko', data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch markets', data: [] });
  }
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
});

app.listen(PORT, () => console.log(`🚀 Backend on ${PORT} | Node ${process.version}`));
