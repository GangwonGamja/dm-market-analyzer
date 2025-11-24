import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BacktestChartProps {
  data: Array<{
    date: string;
    strategy_a: number;
    strategy_b: number;
    strategy_c?: number;
  }>;
}

export const BacktestChart: React.FC<BacktestChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#9CA3AF"
        />
        <YAxis 
          stroke="#9CA3AF"
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
          }}
          labelFormatter={formatDate}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="strategy_a"
          name="전략 A: VIG 단순 보유"
          stroke="#38BDF8"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="strategy_b"
          name="전략 B: VIG↔QLD 스위칭"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={false}
        />
        {data[0]?.strategy_c !== undefined && (
          <Line
            type="monotone"
            dataKey="strategy_c"
            name="전략 C: AI 비중 자동조절"
            stroke="#A855F7"
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

