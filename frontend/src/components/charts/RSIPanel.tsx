import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';

interface RSIPanelProps {
  rsiData: any[];
  divergence?: 'bullish' | 'bearish' | 'none';
}

type Period = '1M' | '3M' | '6M' | '1Y' | '3Y' | 'ALL';

export const RSIPanel: React.FC<RSIPanelProps> = ({
  rsiData,
  divergence = 'none',
}) => {
  const [period, setPeriod] = useState<Period>('ALL');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showOverbought, setShowOverbought] = useState(true);
  const [showOversold, setShowOversold] = useState(true);

  const chartData = useMemo(() => {
    return rsiData.map((item) => ({
      date: item.date,
      rsi: item.rsi,
    }));
  }, [rsiData]);

  // 기간별 필터링
  const filteredData = useMemo(() => {
    if (period === 'ALL' || !chartData.length) return chartData;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '3Y':
        cutoffDate.setFullYear(now.getFullYear() - 3);
        break;
      default:
        return chartData;
    }
    
    return chartData.filter(item => new Date(item.date) >= cutoffDate);
  }, [chartData, period]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const chartHeight = isZoomed ? 500 : 300;

  return (
    <div className="w-full h-full space-y-4">
      {/* Divergence 표시 */}
      {divergence !== 'none' && (
        <div className="mb-4 flex items-center gap-2">
          {divergence === 'bullish' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm font-semibold">
              <TrendingUp className="w-4 h-4" />
              상승 다이버전스 감지
            </div>
          )}
          {divergence === 'bearish' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-semibold">
              <TrendingDown className="w-4 h-4" />
              하락 다이버전스 감지
            </div>
          )}
        </div>
      )}

      {/* 컨트롤 패널 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* 기간 선택 */}
        <div className="flex gap-2 flex-wrap">
          {(['1M', '3M', '6M', '1Y', '3Y', 'ALL'] as Period[]).map((p) => (
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

        {/* 기준선 토글 */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-slate-400 mr-2">기준선:</span>
          <button
            onClick={() => setShowOverbought(!showOverbought)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              showOverbought ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500'
            }`}
          >
            {showOverbought ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            70
          </button>
          <button
            onClick={() => setShowOversold(!showOversold)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              showOversold ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'
            }`}
          >
            {showOversold ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            30
          </button>
        </div>

        {/* 줌 컨트롤 */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
        >
          {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          <span className="text-sm">{isZoomed ? '축소' : '확대'}</span>
        </button>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart 
          data={filteredData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          syncId="rsiChart"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            tickFormatter={(value) => {
              const date = new Date(value);
              if (period === '1M') {
                return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
              }
              return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
            labelFormatter={(value) => formatDate(value)}
            formatter={(value: number) => [
              <span key="rsi" style={{ 
                color: value > 70 ? '#EF4444' : value < 30 ? '#10B981' : '#60A5FA' 
              }}>
                {value.toFixed(2)}
              </span>,
              'RSI'
            ]}
          />
          {/* 과매수/과매도 영역 */}
          {showOverbought && (
            <ReferenceArea y1={70} y2={100} fill="#EF4444" fillOpacity={0.1} />
          )}
          {showOversold && (
            <ReferenceArea y1={0} y2={30} fill="#10B981" fillOpacity={0.1} />
          )}
          {showOverbought && (
            <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label="과매수 (70)" />
          )}
          {showOversold && (
            <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label="과매도 (30)" />
          )}
          <Line 
            type="monotone" 
            dataKey="rsi" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          >
            {filteredData.map((entry: any, index: number) => {
              const rsiValue = entry.rsi;
              let strokeColor = '#60A5FA'; // neutral
              if (rsiValue > 70) strokeColor = '#EF4444'; // overbought
              else if (rsiValue < 30) strokeColor = '#10B981'; // oversold
              
              return (
                <Cell key={`cell-${index}`} stroke={strokeColor} />
              );
            })}
          </Line>
          <Brush
            dataKey="date"
            height={30}
            stroke="#60A5FA"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
