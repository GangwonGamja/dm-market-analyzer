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
  Brush,
  ReferenceLine,
} from 'recharts';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface PriceChartProps {
  data: Array<{
    date: string;
    price: number;
    ma200?: number;
  }>;
  symbol: string;
}

type Period = '1w' | '1m' | '3m' | '6m' | '1y' | '3y' | 'all';

export const PriceChart: React.FC<PriceChartProps> = ({ data, symbol }) => {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // 기간별 데이터 필터링
  const filteredData = useMemo(() => {
    if (period === 'all' || !data.length) return data;
    
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
      case '3y':
        cutoffDate.setFullYear(now.getFullYear() - 3);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  }, [data, period]);

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
        <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
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
            stroke="#9CA3AF"
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              padding: '12px',
            }}
            labelFormatter={(value) => formatDate(value)}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            name={`${symbol} 가격`}
            stroke="#38BDF8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          {filteredData[0]?.ma200 !== undefined && (
            <Line
              type="monotone"
              dataKey="ma200"
              name="200일 이동평균"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          )}
          {/* 현재 가격 기준선 */}
          {filteredData.length > 0 && (
            <ReferenceLine 
              y={filteredData[filteredData.length - 1].price} 
              stroke="#10B981" 
              strokeDasharray="3 3"
              label={{ value: '현재', position: 'right', fill: '#10B981' }}
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
        </LineChart>
      </ResponsiveContainer>

      {/* 통계 정보 */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
          <div>
            <div className="text-sm text-slate-400">현재 가격</div>
            <div className="text-lg font-bold text-light-blue">
              {formatCurrency(filteredData[filteredData.length - 1].price)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">기간 최고</div>
            <div className="text-lg font-bold text-green-400">
              {formatCurrency(Math.max(...filteredData.map(d => d.price)))}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">기간 최저</div>
            <div className="text-lg font-bold text-red-400">
              {formatCurrency(Math.min(...filteredData.map(d => d.price)))}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">변동률</div>
            <div className={`text-lg font-bold ${
              filteredData.length > 1 
                ? (filteredData[filteredData.length - 1].price >= filteredData[0].price 
                    ? 'text-green-400' 
                    : 'text-red-400')
                : 'text-slate-400'
            }`}>
              {filteredData.length > 1 
                ? `${((filteredData[filteredData.length - 1].price / filteredData[0].price - 1) * 100).toFixed(2)}%`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

