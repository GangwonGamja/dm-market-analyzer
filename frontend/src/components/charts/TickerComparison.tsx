import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TickerInput } from '../common/TickerInput';

interface TickerComparisonProps {
  onCompare?: (symbols: string[], period: string) => void;
}

export const TickerComparison: React.FC<TickerComparisonProps> = ({ onCompare }) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['VIG', 'QLD']);
  const [period, setPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y'>('1Y');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAddSymbol = (symbol: string) => {
    if (selectedSymbols.length < 3 && !selectedSymbols.includes(symbol.toUpperCase())) {
      setSelectedSymbols([...selectedSymbols, symbol.toUpperCase()]);
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
  };

  const handleCompare = async () => {
    if (selectedSymbols.length < 2) return;
    
    setLoading(true);
    try {
      if (onCompare) {
        await onCompare(selectedSymbols, period);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 티커 선택 */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-semibold text-light-blue mb-3">비교 티커 선택 (최대 3개)</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedSymbols.map((symbol) => (
            <div
              key={symbol}
              className="flex items-center gap-2 px-3 py-1 bg-light-blue text-deep-navy rounded-lg font-semibold"
            >
              <span>{symbol}</span>
              {selectedSymbols.length > 2 && (
                <button
                  onClick={() => handleRemoveSymbol(symbol)}
                  className="text-deep-navy hover:text-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {selectedSymbols.length < 3 && (
            <TickerInput
              value=""
              onChange={() => {}}
              onAnalyze={(symbol) => handleAddSymbol(symbol)}
              placeholder="티커 추가"
            />
          )}
        </div>
        
        {/* 기간 선택 */}
        <div className="flex gap-2 mb-4">
          {(['1M', '3M', '6M', '1Y', '3Y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                period === p
                  ? 'bg-light-blue text-deep-navy'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleCompare}
          disabled={loading || selectedSymbols.length < 2}
          className="px-6 py-2 bg-light-blue text-deep-navy rounded-lg font-semibold hover:bg-blue-400 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {loading ? '비교 중...' : '비교하기'}
        </button>
      </div>

      {/* 비교 결과 */}
      {comparisonData && comparisonData.results && (
        <div className="space-y-4">
          {/* 수익률 비교 차트 */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="text-sm font-semibold text-light-blue mb-3">수익률 비교</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={comparisonData.results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="symbol" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="return_pct"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  name="수익률 (%)"
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 지표 비교 테이블 */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="text-sm font-semibold text-light-blue mb-3">지표 비교</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-4 text-slate-400">티커</th>
                    <th className="text-right py-2 px-4 text-slate-400">수익률</th>
                    <th className="text-right py-2 px-4 text-slate-400">변동성</th>
                    <th className="text-right py-2 px-4 text-slate-400">Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.results.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-slate-800">
                      <td className="py-2 px-4 font-semibold">{item.symbol}</td>
                      <td className={`py-2 px-4 text-right ${
                        item.return_pct > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.return_pct > 0 ? '+' : ''}{item.return_pct.toFixed(2)}%
                      </td>
                      <td className="py-2 px-4 text-right text-slate-300">
                        {item.volatility.toFixed(2)}%
                      </td>
                      <td className={`py-2 px-4 text-right ${
                        item.risk_score <= 30 ? 'text-green-400' :
                        item.risk_score <= 70 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {item.risk_score.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

