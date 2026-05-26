import NodeCache from 'node-cache';

export const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

export const CACHE_KEYS = {
  MARKETS: 'markets',
  CHART: (symbol) => `chart_${symbol}`,
  TRENDING: 'trending_memes',
  SEARCH: (q) => `search_${q}`,
  TOKEN: (addr) => `token_${addr}`,
  DEX_PAIRS: 'dex_pairs',
};
