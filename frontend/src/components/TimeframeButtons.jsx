const TIMEFRAMES = [
  { label: '1M', value: '1m' },
  { label: '5M', value: '5m' },
  { label: '15M', value: '15m' },
  { label: '30M', value: '30m' },
  { label: '1H', value: '1h' },
];

export default function TimeframeButtons({ active, onChange }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf.value}
          onClick={() => onChange(tf.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            active === tf.value
              ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
              : 'text-gray-500 hover:text-white hover:bg-surface-2'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
