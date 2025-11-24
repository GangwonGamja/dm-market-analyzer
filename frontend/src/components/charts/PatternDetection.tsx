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
  ReferenceArea,
} from 'recharts';

interface PatternDetectionProps {
  data: any[]; // { date, price, high, low } 형태
  symbol: string;
}

interface Pattern {
  type: 'wedge_up' | 'wedge_down' | 'triangle' | 'box';
  startDate: string;
  endDate: string;
  description: string;
}

export const PatternDetection: React.FC<PatternDetectionProps> = ({ data, symbol }) => {
  // 패턴 탐지 로직
  const patterns = useMemo(() => {
    if (!data || data.length < 20) return [];
    
    const detectedPatterns: Pattern[] = [];
    
    // 최근 60일 데이터로 패턴 분석
    const recentData = data.slice(-60);
    
    // 상승 쐐기 패턴 (Wedge Up)
    // 고점은 상승하지만 저점은 더 빠르게 상승
    if (recentData.length >= 20) {
      const firstHalf = recentData.slice(0, 20);
      const secondHalf = recentData.slice(20);
      
      const firstHigh = Math.max(...firstHalf.map(d => d.high || d.price));
      const secondHigh = Math.max(...secondHalf.map(d => d.high || d.price));
      const firstLow = Math.min(...firstHalf.map(d => d.low || d.price));
      const secondLow = Math.min(...secondHalf.map(d => d.low || d.price));
      
      if (secondHigh > firstHigh && secondLow > firstLow && 
          (secondLow - firstLow) > (secondHigh - firstHigh) * 1.5) {
        detectedPatterns.push({
          type: 'wedge_up',
          startDate: recentData[0].date,
          endDate: recentData[recentData.length - 1].date,
          description: '상승 쐐기 패턴',
        });
      }
    }
    
    // 하락 쐐기 패턴 (Wedge Down)
    // 저점은 하락하지만 고점은 더 빠르게 하락
    if (recentData.length >= 20) {
      const firstHalf = recentData.slice(0, 20);
      const secondHalf = recentData.slice(20);
      
      const firstHigh = Math.max(...firstHalf.map(d => d.high || d.price));
      const secondHigh = Math.max(...secondHalf.map(d => d.high || d.price));
      const firstLow = Math.min(...firstHalf.map(d => d.low || d.price));
      const secondLow = Math.min(...secondHalf.map(d => d.low || d.price));
      
      if (secondLow < firstLow && secondHigh < firstHigh && 
          (firstHigh - secondHigh) > (firstLow - secondLow) * 1.5) {
        detectedPatterns.push({
          type: 'wedge_down',
          startDate: recentData[0].date,
          endDate: recentData[recentData.length - 1].date,
          description: '하락 쐐기 패턴',
        });
      }
    }
    
    // 박스권 패턴 (Box)
    // 가격이 일정 범위 내에서 움직임
    if (recentData.length >= 30) {
      const prices = recentData.map(d => d.price || d.close);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const range = maxPrice - minPrice;
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      
      // 변동폭이 평균 가격의 5% 이내면 박스권
      if (range / avgPrice < 0.05) {
        detectedPatterns.push({
          type: 'box',
          startDate: recentData[0].date,
          endDate: recentData[recentData.length - 1].date,
          description: '박스권 패턴',
        });
      }
    }
    
    return detectedPatterns;
  }, [data]);

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'wedge_up':
        return '#10B981'; // Green
      case 'wedge_down':
        return '#EF4444'; // Red
      case 'triangle':
        return '#F59E0B'; // Yellow
      case 'box':
        return '#60A5FA'; // Blue
      default:
        return '#9CA3AF';
    }
  };

  return (
    <div className="w-full space-y-4">
      {patterns.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {patterns.map((pattern, index) => (
            <div
              key={index}
              className="px-3 py-1 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: `${getPatternColor(pattern.type)}20`,
                border: `1px solid ${getPatternColor(pattern.type)}`,
                color: getPatternColor(pattern.type),
              }}
            >
              {pattern.description}
            </div>
          ))}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#60A5FA" 
            strokeWidth={2}
            dot={false}
          />
          {/* 패턴 영역 표시 */}
          {patterns.map((pattern, index) => (
            <ReferenceArea
              key={index}
              x1={pattern.startDate}
              x2={pattern.endDate}
              fill={getPatternColor(pattern.type)}
              fillOpacity={0.1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      {patterns.length === 0 && (
        <div className="text-center text-slate-400 text-sm py-4">
          감지된 패턴이 없습니다.
        </div>
      )}
    </div>
  );
};

