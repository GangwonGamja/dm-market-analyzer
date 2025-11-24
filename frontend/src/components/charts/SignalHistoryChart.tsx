import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ScatterChart,
} from 'recharts';

interface SignalHistoryChartProps {
  history: Array<{
    date: string;
    signal: 'buy' | 'sell' | 'hold';
    confidence: number;
  }>;
}

export const SignalHistoryChart: React.FC<SignalHistoryChartProps> = ({ history }) => {
  const chartData = useMemo(() => {
    return history.map((item) => ({
      date: item.date,
      confidence: item.confidence * 100,
      signal: item.signal,
      value: item.signal === 'buy' ? 1 : item.signal === 'sell' ? -1 : 0,
    }));
  }, [history]);

  const getSignalColor = (signal: string) => {
    if (signal === 'buy') return '#10B981';
    if (signal === 'sell') return '#EF4444';
    return '#9CA3AF';
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            domain={[-1.5, 1.5]}
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value === 1) return 'Buy';
              if (value === -1) return 'Sell';
              return 'Hold';
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
            formatter={(value: number, name: string, props: any) => [
              `${props.payload.signal} (${props.payload.confidence.toFixed(0)}%)`,
              '시그널'
            ]}
          />
          <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#60A5FA" 
            strokeWidth={2}
            dot={(props: any) => {
              const { payload } = props;
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={6}
                  fill={getSignalColor(payload.signal)}
                  stroke="#1F2937"
                  strokeWidth={2}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* 범례 */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-slate-400">Buy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-400">Sell</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500"></div>
          <span className="text-slate-400">Hold</span>
        </div>
      </div>
    </div>
  );
};

