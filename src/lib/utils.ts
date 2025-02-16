import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

export function calculateStochastic(
  high: number[],
  low: number[],
  close: number[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: number[]; d: number[] } {
  const lowestLows = [];
  const highestHighs = [];
  
  // Calculate lowest lows and highest highs for the period
  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      lowestLows.push(NaN);
      highestHighs.push(NaN);
      continue;
    }
    const periodLow = Math.min(...low.slice(i - period + 1, i + 1));
    const periodHigh = Math.max(...high.slice(i - period + 1, i + 1));
    lowestLows.push(periodLow);
    highestHighs.push(periodHigh);
  }

  // Calculate raw %K
  const rawK = close.map((price, i) => {
    if (i < period - 1) return NaN;
    return ((price - lowestLows[i]) / (highestHighs[i] - lowestLows[i])) * 100;
  });

  // Smooth %K
  const k = calculateSMA(rawK.filter(x => !isNaN(x)), smoothK);

  // Calculate %D (SMA of %K)
  const d = calculateSMA(k, smoothD);

  return { k, d };
}