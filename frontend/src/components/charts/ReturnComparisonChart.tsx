import React, { useMemo } from 'react';
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
} from 'recharts';

interface ReturnComparisonChartProps {
  customSymbol?: string;
  customData?: any[];
  vigData?: any[];
  qldData?: any[];
  period?: '1M' | '3M' | '6M' | '1Y' | '3Y' | 'ALL';
}

export const ReturnComparisonChart: React.FC<ReturnComparisonChartProps> = ({
  customSymbol,
  customData = [],
  vigData = [],
  qldData = [],
  period = 'ALL',
}) => {
  // 수익률 계산 (시작 가격 대비)
  const calculateReturns = useMemo(() => {
    const result: any[] = [];
    const allDates = new Set<string>();
    
    // 모든 날짜 수집
    customData.forEach(d => allDates.add(d.date));
    vigData.forEach(d => allDates.add(d.date));
    qldData.forEach(d => allDates.add(d.date));
    
    const sortedDates = Array.from(allDates).sort();
    
    // 각 날짜별로 데이터 병합
    sortedDates.forEach((date) => {
      const customItem = customData.find(d => d.date === date);
      const vigItem = vigData.find(d => d.date === date);
      const qldItem = qldData.find(d => d.date === date);
      
      const entry: any = { date };
      
      // 첫 날 가격을 기준으로 수익률 계산
      if (customItem && customData.length > 0) {
        const firstPrice = customData[0].close || customData[0].price;
        const currentPrice = customItem.close || customItem.price;
        entry.custom = firstPrice ? ((currentPrice / firstPrice - 1) * 100) : null;
      }
      
      if (vigItem && vigData.length > 0) {
        const firstPrice = vigData[0].close || vigData[0].price;
        const currentPrice = vigItem.close || vigItem.price;
        entry.vig = firstPrice ? ((currentPrice / firstPrice - 1) * 100) : null;
      }
      
      if (qldItem && qldData.length > 0) {
        const firstPrice = qldData[0].close || qldData[0].price;
        const currentPrice = qldItem.close || qldItem.price;
        entry.qld = firstPrice ? ((currentPrice / firstPrice - 1) * 100) : null;
      }
      
      result.push(entry);
    });
    
    return result;
  }, [customData, vigData, qldData]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={calculateReturns} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: '수익률 (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
            formatter={(value: number) => [`${value?.toFixed(2)}%`, '수익률']}
          />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
          {customSymbol && (
            <Line 
              type="monotone" 
              dataKey="custom" 
              stroke="#60A5FA" 
              strokeWidth={2}
              name={customSymbol}
              dot={false}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="vig" 
            stroke="#10B981" 
            strokeWidth={2}
            name="VIG"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="qld" 
            stroke="#F59E0B" 
            strokeWidth={2}
            name="QLD"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

