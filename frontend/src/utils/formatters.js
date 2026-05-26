export const formatPrice = (price) => {
  if (!price && price !== 0) return '$0.00';
  const p = Number(price);
  if (p >= 1) return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 0.01) return '$' + p.toFixed(4);
  if (p >= 0.0001) return '$' + p.toFixed(6);
  return '$' + p.toFixed(10);
};

export const formatCompact = (num) => {
  if (!num) return '$0';
  const n = Number(num);
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(2);
};

export const formatPct = (pct) => {
  const v = Number(pct) || 0;
  const sign = v >= 0 ? '+' : '';
  return sign + v.toFixed(2) + '%';
};

export const pctColor = (pct) => {
  const v = Number(pct) || 0;
  return v >= 0 ? 'text-neon-green' : 'text-neon-pink';
};
