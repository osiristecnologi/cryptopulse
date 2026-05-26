import axios from 'axios';

const BASE = 'https://api.dexscreener.com/latest/dex';

async function dsFetch(url) {
  const res = await axios.get(url, { timeout: 10000 });
  return res.data;
}

export async function getTokenPairs(address) {
  return dsFetch(`${BASE}/tokens/${address}`);
}

export async function searchPairs(query) {
  return dsFetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
}

export async function getTrending() {
  // DexScreener doesn't have a trending endpoint in free API
  // We'll use search for popular memecoin terms + filter
  const terms = ['pepe','bonk','wif','doge','shib','floki','brett','mog','popcat','goat'];
  const results = await Promise.allSettled(
    terms.map(t => searchPairs(t))
  );
  
  const pairs = [];
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value?.pairs) {
      pairs.push(...r.value.pairs);
    }
  });

  // Deduplicate and sort by liquidity
  const unique = {};
  pairs.forEach(p => {
    if (!unique[p.pairAddress]) unique[p.pairAddress] = p;
  });

  return Object.values(unique)
    .filter(p => p.liquidity?.usd > 50000)
    .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
    .slice(0, 20);
}
