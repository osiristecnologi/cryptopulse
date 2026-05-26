import axios from 'axios';

const BASE = 'https://api.coingecko.com/api/v3';

async function cgFetch(url, params = {}) {
  const res = await axios.get(url, { params, timeout: 10000 });
  return res.data;
}

export async function getMarkets() {
  const ids = 'bitcoin,ethereum,solana,binancecoin';
  return cgFetch(`${BASE}/coins/markets`, {
    vs_currency: 'usd',
    ids,
    order: 'market_cap_desc',
    sparkline: false,
    price_change_percentage: '1h,24h,7d',
  });
}

export async function searchCoins(query) {
  return cgFetch(`${BASE}/search`, { query });
}

export async function getCoinMarketData(id) {
  return cgFetch(`${BASE}/coins/${id}`, {
    localization: false,
    tickers: false,
    community_data: false,
    developer_data: false,
  });
}

export async function getOhlcv(coinId, days = 1) {
  return cgFetch(`${BASE}/coins/${coinId}/ohlc`, {
    vs_currency: 'usd',
    days,
  });
}
