import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { useApi } from '../hooks/useApi';
import { ChartSkeleton } from './Skeleton';

export default function CryptoChart({ symbol = 'BTC', interval = '1h' }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [chartData, setChartData] = useState([]);

  const { data, loading } = useApi(`/api/chart/${symbol}?interval=${interval}`, [symbol, interval], 15000);

  useEffect(() => {
    if (data?.length) setChartData(data);
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0f' },
        textColor: '#8a8a9a',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00ff88',
      downColor: '#ff006e',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff006e',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff006e',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      seriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [chartData]);

  if (loading && !chartData.length) {
    return <div ref={containerRef} className="w-full h-full"><ChartSkeleton /></div>;
  }

  return <div ref={containerRef} className="w-full h-full" />;
      }
