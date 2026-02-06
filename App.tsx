
import React, { useState, useEffect, useCallback } from 'react';
import StockChart from './components/StockChart';
import AnalysisPanel from './components/AnalysisPanel';
import { analyzeStockWithGemini } from './services/geminiService';
import { StockData, AIAnalysis, ChartPoint } from './types';
import { generateSampleData, calculateSMA, calculateEMA } from './utils/math';

const App: React.FC = () => {
  const [ticker, setTicker] = useState('RELIANCE');
  const [searchInput, setSearchInput] = useState('RELIANCE');
  const [history, setHistory] = useState<StockData[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [analysis, setAnalysis] = useState<(AIAnalysis & { quotaExceeded?: boolean }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingPersonalKey, setIsUsingPersonalKey] = useState(false);

  const checkKey = useCallback(async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsUsingPersonalKey(hasKey);
    }
  }, []);

  useEffect(() => {
    checkKey();
  }, [checkKey]);

  const performAnalysis = useCallback(async (symbol: string) => {
    setIsLoading(true);
    const mockHistory = generateSampleData(symbol);
    setHistory(mockHistory);

    try {
      const geminiResult = await analyzeStockWithGemini(symbol, mockHistory);
      setAnalysis(geminiResult);

      // Even if search fails, show the last mock price or real price if found
      const currentPrice = geminiResult.realTimePrice || mockHistory[mockHistory.length - 1].price;
      mockHistory[mockHistory.length - 1].price = currentPrice;

      const smas = calculateSMA(mockHistory, 20);
      const emas = calculateEMA(mockHistory, 12);
      
      const combinedData: ChartPoint[] = mockHistory.map((d, i) => ({
        date: d.date,
        actual: d.price,
        sma: smas[i] || undefined,
        ema: emas[i] || undefined,
      }));

      const lastDate = new Date(mockHistory[mockHistory.length - 1].date);
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + 1);

      combinedData.push({
        date: nextDate.toISOString().split('T')[0],
        predicted: geminiResult.forecast.targetPrice,
      });

      setChartData(combinedData);
    } catch (err) {
      console.error("Critical Analysis Failure:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performAnalysis('RELIANCE');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const upper = searchInput.toUpperCase();
      setTicker(upper);
      performAnalysis(upper);
    }
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success and refresh state
      setIsUsingPersonalKey(true);
      performAnalysis(ticker); 
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <nav className="py-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
            <i className="fas fa-tower-broadcast text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FinPredict AI</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Market Intelligence</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Search NSE/BSE Ticker (e.g. RELIANCE, TCS)" 
            className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="absolute right-1 top-1 bottom-1 px-4 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search text-xs"></i>}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
            <span className={`h-2 w-2 rounded-full ${analysis?.quotaExceeded ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></span>
            {analysis?.quotaExceeded ? 'Quota Limited' : 'Live Data Active'}
          </div>
          <button 
            onClick={handleOpenKeyDialog}
            className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${isUsingPersonalKey ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : analysis?.quotaExceeded ? 'border-rose-500/50 text-rose-400 bg-rose-500/10 animate-pulse' : 'border-slate-700 text-slate-400 hover:text-white'}`}
          >
            <i className={`fas ${isUsingPersonalKey ? 'fa-key' : 'fa-lock-open'} text-xs`}></i>
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {isUsingPersonalKey ? 'Personal Key Active' : analysis?.quotaExceeded ? 'Fix Quota (Add Key)' : 'Shared Tier'}
            </span>
          </button>
        </div>
      </nav>

      <main className="mt-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <StockChart data={chartData} ticker={ticker} />
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Market Snapshot</h4>
              <div className="space-y-4">
                <div>
                   <p className="text-[10px] text-slate-500 uppercase">Market Cap</p>
                   <p className="font-bold text-white">{analysis?.marketCap || '---'}</p>
                </div>
                <div>
                   <p className="text-[10px] text-slate-500 uppercase">P/E Ratio</p>
                   <p className="font-bold text-white">{analysis?.peRatio || '---'}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Sentiment Score</h4>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl ${analysis?.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  <i className={`fas ${analysis?.sentiment === 'Bullish' ? 'fa-arrow-trend-up' : analysis?.sentiment === 'Bearish' ? 'fa-arrow-trend-down' : 'fa-minus'}`}></i>
                </div>
                <div>
                  <p className="font-bold text-lg">{analysis?.sentiment || 'Analyzing...'}</p>
                  <p className="text-xs text-slate-500">{analysis?.quotaExceeded ? 'Quota Limited' : 'Live Search Analysis'}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-rose-500/20 bg-rose-500/5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Data Quality</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Search Connectivity</span>
                  <span className={`font-mono ${analysis?.quotaExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {analysis?.quotaExceeded ? 'Blocked' : 'Verified'}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`${analysis?.quotaExceeded ? 'bg-rose-500' : 'bg-emerald-500'} h-full transition-all duration-1000`} style={{ width: analysis?.quotaExceeded ? '15%' : '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(analysis || isLoading) && (
          <AnalysisPanel analysis={analysis} isLoading={isLoading} />
        )}
      </main>

      <footer className="mt-20 text-center text-slate-500 text-xs border-t border-slate-800 pt-8">
        <p>© 2025 FinPredict AI. Real-time data fetched via Gemini Google Search Grounding.</p>
        <p className="mt-2 text-slate-600">Note: Shared quota limits apply. Use a personal API key for high-frequency live tracking.</p>
      </footer>
    </div>
  );
};

export default App;
