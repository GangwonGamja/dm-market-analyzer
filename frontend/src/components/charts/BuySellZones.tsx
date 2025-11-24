import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label,
} from 'recharts';

interface BuySellZonesProps {
  priceData: any[];
  rsiData: any[];
  symbol: string;
}

export const BuySellZones: React.FC<BuySellZonesProps> = ({ priceData, rsiData, symbol }) => {
  // 매수/매도 구간 계산
  const zones = useMemo(() => {
    if (!priceData || !rsiData || priceData.length === 0 || rsiData.length === 0) {
      return { buyZones: [], sellZones: [] };
    }
    
    const buyZones: any[] = [];
    const sellZones: any[] = [];
    
    // RSI와 가격 데이터 병합
    const merged = priceData.map((priceItem) => {
      const rsiItem = rsiData.find(r => r.date === priceItem.date);
      return {
        date: priceItem.date,
        price: priceItem.close || priceItem.price,
        rsi: rsiItem?.rsi || null,
      };
    });
    
    // RSI 기반 구간 탐지
    merged.forEach((item, index) => {
      if (item.rsi !== null) {
        if (item.rsi < 30) {
          buyZones.push({
            date: item.date,
            price: item.price,
            reason: 'RSI < 30 (과매도)',
          });
        } else if (item.rsi > 70) {
          sellZones.push({
            date: item.date,
            price: item.price,
            reason: 'RSI > 70 (과매수)',
          });
        }
      }
    });
    
    return { buyZones, sellZones };
  }, [priceData, rsiData]);

  return (
    <div className="w-full space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          
          {/* 매수 구간 표시 */}
          {zones.buyZones.map((zone, index) => (
            <ReferenceLine
              key={`buy-${index}`}
              x={zone.date}
              stroke="#10B981"
              strokeDasharray="2 2"
              label={{ 
                value: '매수 가능', 
                position: 'top', 
                fill: '#10B981', 
                fontSize: 10,
                fontWeight: 'bold'
              }}
            />
          ))}
          
          {/* 매도 구간 표시 */}
          {zones.sellZones.map((zone, index) => (
            <ReferenceLine
              key={`sell-${index}`}
              x={zone.date}
              stroke="#EF4444"
              strokeDasharray="2 2"
              label={{ 
                value: '과열 구간', 
                position: 'bottom', 
                fill: '#EF4444', 
                fontSize: 10,
                fontWeight: 'bold'
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 구간 요약 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
          <div className="text-sm font-semibold text-green-400 mb-2">
            매수 가능 구간
          </div>
          <div className="text-2xl font-bold text-green-400">
            {zones.buyZones.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">RSI &lt; 30 감지</div>
        </div>
        
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <div className="text-sm font-semibold text-red-400 mb-2">
            과열 구간
          </div>
          <div className="text-2xl font-bold text-red-400">
            {zones.sellZones.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">RSI &gt; 70 감지</div>
        </div>
      </div>
    </div>
  );
};

