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
  ComposedChart,
  Area,
} from 'recharts';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface IndicatorChartProps {
  rsiData: Array<{
    date: string;
    rsi: number;
  }>;
  fgiData?: Array<{
    date?: string;
    timestamp?: string;
    score?: number | null;
    value?: number | null;
    rating?: string;
    classification?: string;
  }>;
  currentFgi?: {
    score?: number | null;
    rating?: string | null;
    timestamp?: string;
  } | null;
}

type Period = '1w' | '1m' | '3m' | '6m' | '1y' | '3y' | 'all';

export const IndicatorChart: React.FC<IndicatorChartProps> = ({ rsiData, fgiData, currentFgi }) => {
  const [period, setPeriod] = useState<Period>('all');
  const [isZoomed, setIsZoomed] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // RSI와 FGI 데이터 병합 (score 또는 value 지원)
  const combinedData = useMemo(() => {
    return rsiData.map((rsi) => {
      const fgi = fgiData?.find((f) => {
        // 날짜 매칭 (형식이 다를 수 있으므로 날짜만 비교)
        const rsiDate = new Date(rsi.date).toISOString().split('T')[0];
        const fgiDate = new Date(f.date || f.timestamp || f.date).toISOString().split('T')[0];
        return rsiDate === fgiDate;
      });
      
      // score 또는 value 필드 사용
      const fgiValue = fgi?.score ?? fgi?.value ?? null;
      
      return {
        date: rsi.date,
        rsi: rsi.rsi,
        fgi: fgiValue !== null && fgiValue !== undefined ? Number(fgiValue) : null,
      };
    });
  }, [rsiData, fgiData]);

  // 기간별 데이터 필터링
  const filteredData = useMemo(() => {
    if (period === 'all' || !combinedData.length) return combinedData;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case '1w':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return combinedData;
    }
    
    return combinedData.filter(item => new Date(item.date) >= cutoffDate);
  }, [combinedData, period]);

  const periods: { key: Period; label: string }[] = [
    { key: '1w', label: '1주' },
    { key: '1m', label: '1개월' },
    { key: '3m', label: '3개월' },
    { key: '6m', label: '6개월' },
    { key: '1y', label: '1년' },
    { key: '3y', label: '3개년' },
    { key: 'all', label: '전체' },
  ];

  const chartHeight = isZoomed ? 600 : 400;

  const getRsiStatus = (rsi: number) => {
    if (rsi > 70) return { label: '과매수', color: '#EF4444' };
    if (rsi < 30) return { label: '과매도', color: '#10B981' };
    return { label: '중립', color: '#9CA3AF' };
  };

  return (
    <div className="space-y-4">
      {/* 기간 선택 및 줌 컨트롤 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                period === p.key
                  ? 'bg-light-blue text-deep-navy'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
          title={isZoomed ? '축소' : '확대'}
        >
          {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          <span className="text-sm">{isZoomed ? '축소' : '확대'}</span>
        </button>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => {
              const date = new Date(value);
              if (period === '1w') {
                return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
              }
              return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            }}
            stroke="#9CA3AF"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#9CA3AF" 
            domain={[0, 100]}
            label={{ value: 'RSI', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          {fgiData && (
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#9CA3AF" 
              domain={[0, 100]}
              label={{ value: 'FGI', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
            />
          )}
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              padding: '12px',
            }}
            labelFormatter={(value) => formatDate(value)}
            formatter={(value: number, name: string) => {
              if (name === 'RSI') {
                const status = getRsiStatus(value);
                return [
                  <span key="rsi" style={{ color: status.color }}>
                    {value.toFixed(2)} ({status.label})
                  </span>,
                  name
                ];
              }
              return [value?.toFixed(2) || 'N/A', name];
            }}
          />
          <Legend />
          <ReferenceLine yAxisId="left" y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '과매수(70)', position: 'right' }} />
          <ReferenceLine yAxisId="left" y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: '과매도(30)', position: 'right' }} />
          <ReferenceLine yAxisId="left" y={50} stroke="#6B7280" strokeDasharray="1 1" strokeOpacity={0.5} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rsi"
            name="RSI"
            stroke="#38BDF8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          {fgiData && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="fgi"
              name="Fear & Greed Index"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          )}
          <Brush
            dataKey="date"
            height={30}
            stroke="#38BDF8"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 통계 정보 */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
          <div>
            <div className="text-sm text-slate-400">현재 RSI</div>
            <div className={`text-lg font-bold ${
              filteredData[filteredData.length - 1].rsi 
                ? getRsiStatus(filteredData[filteredData.length - 1].rsi).color 
                : 'text-slate-400'
            }`}>
              {filteredData[filteredData.length - 1].rsi?.toFixed(2) || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">평균 RSI</div>
            <div className="text-lg font-bold text-light-blue">
              {filteredData.filter(d => d.rsi).length > 0
                ? (filteredData.filter(d => d.rsi).reduce((sum, d) => sum + d.rsi, 0) / filteredData.filter(d => d.rsi).length).toFixed(2)
                : 'N/A'
              }
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">현재 FGI</div>
            <div className="text-lg font-bold text-yellow-400">
              {currentFgi && currentFgi.score !== null && currentFgi.score !== undefined
                ? currentFgi.score.toFixed(0)
                : (filteredData.length > 0 && filteredData[filteredData.length - 1].fgi !== null && filteredData[filteredData.length - 1].fgi !== undefined
                  ? filteredData[filteredData.length - 1].fgi.toFixed(0)
                  : 'N/A')}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">평균 FGI</div>
            <div className="text-lg font-bold text-yellow-400">
              {(() => {
                const fgiValues = filteredData.filter(d => d.fgi !== null && d.fgi !== undefined).map(d => Number(d.fgi));
                return fgiValues.length > 0
                  ? (fgiValues.reduce((sum, val) => sum + val, 0) / fgiValues.length).toFixed(0)
                  : 'N/A';
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

