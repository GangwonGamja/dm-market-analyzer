import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface VolumeAnalysisChartProps {
  data: any[]; // { date, price, volume } 형태
  symbol: string;
}

export const VolumeAnalysisChart: React.FC<VolumeAnalysisChartProps> = ({ data, symbol }) => {
  // 거래량 급증일 계산 (7일 평균 대비 200% 이상)
  const volumeSpikeData = useMemo(() => {
    if (!data || data.length < 7) return data;
    
    return data.map((item, index) => {
      if (index < 7) {
        return { ...item, isSpike: false };
      }
      
      // 최근 7일 평균 거래량
      const recent7Days = data.slice(index - 7, index);
      const avgVolume = recent7Days.reduce((sum, d) => sum + (d.volume || 0), 0) / 7;
      const currentVolume = item.volume || 0;
      
      // 200% 이상이면 급증
      const isSpike = currentVolume >= avgVolume * 2;
      
      return {
        ...item,
        isSpike,
        avgVolume7: avgVolume,
      };
    });
  }, [data]);

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

  return (
    <div className="w-full space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={volumeSpikeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis 
            yAxisId="price"
            stroke="#60A5FA"
            tick={{ fill: '#60A5FA', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            label={{ value: '가격', angle: -90, position: 'insideLeft', fill: '#60A5FA' }}
          />
          <YAxis 
            yAxisId="volume"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toString();
            }}
            label={{ value: '거래량', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
            labelFormatter={(value) => formatDate(value)}
            formatter={(value: number, name: string) => {
              if (name === '가격') {
                return [formatCurrency(value), name];
              }
              if (name === '거래량') {
                return [value.toLocaleString(), name];
              }
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          <Line 
            yAxisId="price"
            type="monotone" 
            dataKey="price" 
            stroke="#60A5FA" 
            strokeWidth={2}
            name="가격"
            dot={false}
          />
          <Bar 
            yAxisId="volume"
            dataKey="volume" 
            fill="#6B7280"
            name="거래량"
            opacity={0.6}
          />
          {/* 거래량 급증일 표시 */}
          {volumeSpikeData.map((item, index) => 
            item.isSpike ? (
              <ReferenceLine
                key={`spike-${index}`}
                x={item.date}
                stroke="#EF4444"
                strokeDasharray="2 2"
                label={{ value: '거래량 급증', position: 'top', fill: '#EF4444', fontSize: 10 }}
              />
            ) : null
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 거래량 급증일 요약 */}
      {volumeSpikeData.filter(d => d.isSpike).length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-sm font-semibold text-light-blue mb-2">
            거래량 급증일 ({volumeSpikeData.filter(d => d.isSpike).length}일)
          </div>
          <div className="text-xs text-slate-400">
            7일 평균 대비 200% 이상 거래량 증가
          </div>
        </div>
      )}
    </div>
  );
};

