import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface VolatilityHeatmapProps {
  data: any[]; // { date, volatility } 형태
}

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({ data }) => {
  // 최근 12개월 데이터로 변환
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const monthlyData: { [key: string]: number[] } = {};
    
    data.forEach((item) => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      
      // 변동성 값이 있으면 추가
      if (item.volatility !== null && item.volatility !== undefined) {
        monthlyData[monthKey].push(item.volatility);
      }
    });
    
    // 월별 평균 변동성 계산
    const result = Object.entries(monthlyData)
      .map(([month, values]) => {
        if (values.length === 0) return null;
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        return {
          month,
          volatility: avg,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => (a?.month || '').localeCompare(b?.month || ''))
      .slice(-12); // 최근 12개월
    
    return result;
  }, [data]);

  const maxVolatility = Math.max(...heatmapData.map(d => d.volatility || 0));
  const minVolatility = Math.min(...heatmapData.map(d => d.volatility || 0));

  const getColor = (volatility: number) => {
    if (maxVolatility === minVolatility) return '#60A5FA';
    const ratio = (volatility - minVolatility) / (maxVolatility - minVolatility);
    if (ratio > 0.7) return '#EF4444'; // Red (높은 변동성)
    if (ratio > 0.4) return '#F59E0B'; // Yellow
    return '#3B82F6'; // Blue (낮은 변동성)
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={heatmapData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="month" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            tickFormatter={(value) => {
              const [year, month] = value.split('-');
              return `${year}-${month}`;
            }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: '변동성 (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, '변동성']}
          />
          <Bar dataKey="volatility" name="변동성">
            {heatmapData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.volatility || 0)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>낮은 변동성</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>중간 변동성</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>높은 변동성</span>
        </div>
      </div>
    </div>
  );
};

