'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface SecurityChartProps {
  ticker: string;
}

export function SecurityChart({ ticker }: SecurityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#666666',
      },
      grid: {
        vertLines: { color: '#e5e7eb' },
        horzLines: { color: '#e5e7eb' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Mock data - replace with real data from your API
    const data = [
      { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103 },
      { time: '2024-01-02', open: 103, high: 107, low: 102, close: 105 },
      { time: '2024-01-03', open: 105, high: 108, low: 104, close: 106 },
      { time: '2024-01-04', open: 106, high: 110, low: 105, close: 108 },
      { time: '2024-01-05', open: 108, high: 112, low: 107, close: 109 },
    ];

    candlestickSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [ticker]);

  return <div ref={chartContainerRef} />;
} 