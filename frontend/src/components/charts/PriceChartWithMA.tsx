import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';

interface PriceChartWithMAProps {
  data: any[];
  symbol: string;
  ma20Data?: any[];
  ma50Data?: any[];
  ma60Data?: any[];
  ma200Data?: any[];
  goldenCross?: boolean;
  deathCross?: boolean;
  crossDates?: {
    ma50_ma200?: { date: string; type: 'golden' | 'death' }[];
    ma20_ma60?: { date: string; type: 'golden' | 'death' }[];
  };
  patterns?: {
    triangle?: { start: string; end: string; points: { date: string; price: number }[] };
    wedge_up?: { start: string; end: string; upper: { date: string; price: number }[]; lower: { date: string; price: number }[] };
    wedge_down?: { start: string; end: string; upper: { date: string; price: number }[]; lower: { date: string; price: number }[] };
    box_range?: { start: string; end: string; top: number; bottom: number };
  };
  rsiData?: any[];
  macdData?: any[];
}

type Period = '1M' | '3M' | '6M' | '1Y' | '3Y' | 'ALL';

export const PriceChartWithMA: React.FC<PriceChartWithMAProps> = ({
  data,
  symbol,
  ma20Data = [],
  ma50Data = [],
  ma60Data = [],
  ma200Data = [],
  goldenCross = false,
  deathCross = false,
  crossDates,
  patterns,
  rsiData = [],
  macdData = [],
}) => {
  const [period, setPeriod] = useState<Period>('ALL');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showPrice, setShowPrice] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showMA60, setShowMA60] = useState(true);
  const [showMA200, setShowMA200] = useState(true);

  // 데이터 병합 (날짜 기준)
  const mergedData = useMemo(() => {
    return data.map((item) => {
      const date = item.date;
      const ma20Item = ma20Data.find((m) => m.date === date);
      const ma50Item = ma50Data.find((m) => m.date === date);
      const ma60Item = ma60Data.find((m) => m.date === date);
      const ma200Item = ma200Data.find((m) => m.date === date);
      const rsiItem = rsiData.find((r) => r.date === date);
      const macdItem = macdData.find((m) => m.date === date);
      
      // 크로스 마커 확인
      let crossMarker = null;
      if (crossDates) {
        const ma50_ma200 = crossDates.ma50_ma200?.find(c => c.date === date);
        const ma20_ma60 = crossDates.ma20_ma60?.find(c => c.date === date);
        if (ma50_ma200) crossMarker = { type: ma50_ma200.type, pair: 'MA50/MA200' };
        if (ma20_ma60) crossMarker = { type: ma20_ma60.type, pair: 'MA20/MA60' };
      }
      
      return {
        date,
        price: item.close || item.price,
        ma20: ma20Item?.ma20 || null,
        ma50: ma50Item?.ma50 || null,
        ma60: ma60Item?.ma60 || null,
        ma200: ma200Item?.ma200 || null,
        rsi: rsiItem?.rsi || null,
        macd: macdItem?.macd || null,
        macdSignal: macdItem?.signal || null,
        macdHistogram: macdItem?.histogram || null,
        crossMarker,
      };
    }).filter((item) => item.price !== null);
  }, [data, ma20Data, ma50Data, ma60Data, ma200Data, rsiData, macdData, crossDates]);

  // 기간별 필터링
  const filteredData = useMemo(() => {
    if (period === 'ALL' || !mergedData.length) return mergedData;
    
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
        return mergedData;
    }
    
    return mergedData.filter(item => new Date(item.date) >= cutoffDate);
  }, [mergedData, period]);

  // 최근 5일 MA 방향 계산
  const getMADirection = (maData: any[], days: number = 5, maKey: string) => {
    if (!maData || maData.length < days) return null;
    const recent = maData.slice(-days);
    if (recent.length < 2) return null;
    
    const first = recent[0][maKey];
    const last = recent[recent.length - 1][maKey];
    
    if (first && last) {
      return last > first ? 'up' : 'down';
    }
    return null;
  };

  const ma20Direction = getMADirection(ma20Data, 5, 'ma20');
  const ma60Direction = getMADirection(ma60Data, 5, 'ma60');
  const ma200Direction = getMADirection(ma200Data, 5, 'ma200');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const chartHeight = isZoomed ? 600 : 400;

  return (
    <div className="w-full h-full space-y-4">
      {/* 크로스 라벨 */}
      {(goldenCross || deathCross) && (
        <div className="mb-4 flex gap-2">
          {goldenCross && (
            <div className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm font-semibold">
              ✨ Golden Cross 발생
            </div>
          )}
          {deathCross && (
            <div className="px-3 py-1 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm font-semibold">
              ⚠️ Death Cross 발생
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

        {/* 지표 토글 */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-slate-400 mr-2">지표:</span>
          <button
            onClick={() => setShowPrice(!showPrice)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              showPrice ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'
            }`}
          >
            {showPrice ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            가격
          </button>
          <button
            onClick={() => setShowMA20(!showMA20)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              showMA20 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-500'
            }`}
          >
            {showMA20 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            MA20
          </button>
          <button
            onClick={() => setShowMA50(!showMA50)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              showMA50 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'
            }`}
          >
            {showMA50 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            MA50
          </button>
          <button
            onClick={() => setShowMA60(!showMA60)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              showMA60 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-500'
            }`}
          >
            {showMA60 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            MA60
          </button>
          <button
            onClick={() => setShowMA200(!showMA200)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              showMA200 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500'
            }`}
          >
            {showMA200 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            MA200
          </button>
        </div>

        {/* 줌 컨트롤 */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
          title={isZoomed ? '축소' : '확대'}
        >
          {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          <span className="text-sm">{isZoomed ? '축소' : '확대'}</span>
        </button>
      </div>

      {/* MA 방향 표시 */}
      <div className="flex gap-4 text-xs text-slate-400">
        {ma20Direction && (
          <div className="flex items-center gap-1">
            MA20: {ma20Direction === 'up' ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
          </div>
        )}
        {ma60Direction && (
          <div className="flex items-center gap-1">
            MA60: {ma60Direction === 'up' ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
          </div>
        )}
        {ma200Direction && (
          <div className="flex items-center gap-1">
            MA200: {ma200Direction === 'up' ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart 
          data={filteredData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          syncId="priceChart"
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
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              
              const data = payload[0].payload;
              const items: JSX.Element[] = [];
              
              // 가격
              if (data.price) {
                items.push(
                  <div key="price" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">가격:</span>
                    <span className="text-blue-400 font-semibold">{formatCurrency(data.price)}</span>
                  </div>
                );
              }
              
              // MA 데이터
              if (data.ma20) {
                items.push(
                  <div key="ma20" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">MA20:</span>
                    <span className="text-yellow-400">{formatCurrency(data.ma20)}</span>
                  </div>
                );
              }
              if (data.ma50) {
                items.push(
                  <div key="ma50" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">MA50:</span>
                    <span className="text-green-400">{formatCurrency(data.ma50)}</span>
                  </div>
                );
              }
              if (data.ma60) {
                items.push(
                  <div key="ma60" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">MA60:</span>
                    <span className="text-orange-400">{formatCurrency(data.ma60)}</span>
                  </div>
                );
              }
              if (data.ma200) {
                items.push(
                  <div key="ma200" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">MA200:</span>
                    <span className="text-red-400">{formatCurrency(data.ma200)}</span>
                  </div>
                );
              }
              
              // RSI
              if (data.rsi !== null && data.rsi !== undefined) {
                const rsiColor = data.rsi > 70 ? '#EF4444' : data.rsi < 30 ? '#10B981' : '#60A5FA';
                items.push(
                  <div key="rsi" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">RSI:</span>
                    <span style={{ color: rsiColor }} className="font-semibold">{data.rsi.toFixed(2)}</span>
                  </div>
                );
              }
              
              // MACD
              if (data.macd !== null && data.macd !== undefined) {
                items.push(
                  <div key="macd" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">MACD:</span>
                    <span className="text-purple-400">{data.macd.toFixed(4)}</span>
                  </div>
                );
              }
              if (data.macdSignal !== null && data.macdSignal !== undefined) {
                items.push(
                  <div key="macdSignal" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">Signal:</span>
                    <span className="text-purple-300">{data.macdSignal.toFixed(4)}</span>
                  </div>
                );
              }
              if (data.macdHistogram !== null && data.macdHistogram !== undefined) {
                const histColor = data.macdHistogram > 0 ? '#10B981' : '#EF4444';
                items.push(
                  <div key="macdHist" className="flex justify-between gap-4 mb-1">
                    <span className="text-slate-400">Histogram:</span>
                    <span style={{ color: histColor }}>{data.macdHistogram.toFixed(4)}</span>
                  </div>
                );
              }
              
              // 크로스 마커
              if (data.crossMarker) {
                items.push(
                  <div key="cross" className="mt-2 pt-2 border-t border-slate-600">
                    <div className={`text-sm font-semibold ${
                      data.crossMarker.type === 'golden' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {data.crossMarker.type === 'golden' ? '↑' : '↓'} {data.crossMarker.pair} {data.crossMarker.type === 'golden' ? '골든크로스' : '데드크로스'}
                    </div>
                  </div>
                );
              }
              
              return (
                <div style={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#F3F4F6'
                }}>
                  <div className="mb-2 font-semibold text-slate-200">{formatDate(label)}</div>
                  {items}
                </div>
              );
            }}
          />
          <Legend 
            wrapperStyle={{ color: '#9CA3AF' }}
          />
          {showPrice && (
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#60A5FA" 
              strokeWidth={2}
              name="가격"
              dot={false}
              activeDot={{ r: 6 }}
            />
          )}
          {showMA20 && ma20Data.length > 0 && (
            <Line 
              type="monotone" 
              dataKey="ma20" 
              stroke="#FBBF24" 
              strokeWidth={1.5}
              name="MA20"
              dot={false}
              strokeDasharray="5 5"
            />
          )}
          {showMA50 && ma50Data.length > 0 && (
            <Line 
              type="monotone" 
              dataKey="ma50" 
              stroke="#10B981" 
              strokeWidth={1.5}
              name="MA50"
              dot={false}
              strokeDasharray="5 5"
            />
          )}
          {showMA60 && ma60Data.length > 0 && (
            <Line 
              type="monotone" 
              dataKey="ma60" 
              stroke="#F59E0B" 
              strokeWidth={1.5}
              name="MA60"
              dot={false}
              strokeDasharray="5 5"
            />
          )}
          {showMA200 && ma200Data.length > 0 && (
            <Line 
              type="monotone" 
              dataKey="ma200" 
              stroke="#EF4444" 
              strokeWidth={1.5}
              name="MA200"
              dot={false}
              strokeDasharray="5 5"
            />
          )}
          
          {/* 크로스 마커 표시 */}
          {filteredData
            .filter((item: any) => item.crossMarker)
            .map((item: any, idx: number) => {
              const isGolden = item.crossMarker.type === 'golden';
              return (
                <ReferenceLine
                  key={`cross-${idx}`}
                  x={item.date}
                  stroke={isGolden ? '#10B981' : '#EF4444'}
                  strokeDasharray="3 3"
                  label={{
                    value: isGolden ? '↑' : '↓',
                    position: 'top',
                    fill: isGolden ? '#10B981' : '#EF4444',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}
                />
              );
            })}
          
          {/* 패턴 오버레이: Box Range */}
          {patterns?.box_range && (
            <>
              <ReferenceLine
                y={patterns.box_range.top}
                stroke="#8B5CF6"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: 'Box Top', position: 'right', fill: '#8B5CF6' }}
              />
              <ReferenceLine
                y={patterns.box_range.bottom}
                stroke="#8B5CF6"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: 'Box Bottom', position: 'right', fill: '#8B5CF6' }}
              />
            </>
          )}
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
