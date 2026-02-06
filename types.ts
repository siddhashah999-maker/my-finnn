
export interface StockData {
  date: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
}

export interface PredictionResult {
  algorithm: string;
  prediction: number;
  confidence: number;
  description: string;
  rmse: number;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  summary: string;
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface AIAnalysis {
  summary: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  recommendation: string;
  realTimePrice?: number;
  marketCap?: string;
  peRatio?: string;
  forecast: {
    targetPrice: number;
    timeline: string;
    risks: string[];
  };
  comparisons: PredictionResult[];
  news: NewsItem[];
  sources: SearchSource[];
}

export interface ChartPoint {
  date: string;
  actual?: number;
  predicted?: number;
  sma?: number;
  ema?: number;
}
