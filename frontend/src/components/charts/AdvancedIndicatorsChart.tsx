import React, { useState } from 'react';
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
import { Eye, EyeOff } from 'lucide-react';

interface AdvancedIndicatorsChartProps {
  cciData?: any[];
  adxData?: any[];
  obvData?: any[];
  bbData?: any[];
  vwapData?: any[];
  priceData?: any[];
}

export const AdvancedIndicatorsChart: React.FC<AdvancedIndicatorsChartProps> = ({
  cciData = [],
  adxData = [],
  obvData = [],
  bbData = [],
  vwapData = [],
  priceData = [],
}) => {
  const [showCCI, setShowCCI] = useState(false);
  const [showADX, setShowADX] = useState(false);
  const [showOBV, setShowOBV] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);

  // 데이터 병합
  const mergedData = React.useMemo(() => {
    const dateMap: { [key: string]: any } = {};
    
    // 가격 데이터
    priceData.forEach(item => {
      const date = item.date;
      if (!dateMap[date]) {
        dateMap[date] = { date, price: item.close || item.price };
      }
    });
    
    // CCI
    if (showCCI) {
      cciData.forEach(item => {
        if (dateMap[item.date]) {
          dateMap[item.date].cci = item.cci;
        }
      });
    }
    
    // ADX
    if (showADX) {
      adxData.forEach(item => {
        if (dateMap[item.date]) {
          dateMap[item.date].adx = item.adx;
          dateMap[item.date].di_plus = item.di_plus;
          dateMap[item.date].di_minus = item.di_minus;
        }
      });
    }
    
    // OBV
    if (showOBV && obvData.length > 0) {
      // OBV는 별도 차트로 표시
    }
    
    // 볼린저밴드
    if (showBB) {
      bbData.forEach(item => {
        if (dateMap[item.date]) {
          dateMap[item.date].bb_upper = item.upper;
          dateMap[item.date].bb_middle = item.middle;
          dateMap[item.date].bb_lower = item.lower;
        }
      });
    }
    
    // VWAP
    if (showVWAP) {
      vwapData.forEach(item => {
        if (dateMap[item.date]) {
          dateMap[item.date].vwap = item.vwap;
        }
      });
    }
    
    return Object.values(dateMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [priceData, cciData, adxData, bbData, vwapData, showCCI, showADX, showBB, showVWAP]);

  return (
    <div className="w-full space-y-4">
      {/* 지표 토글 */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-slate-400 mr-2">고급 지표:</span>
        <button
          onClick={() => setShowCCI(!showCCI)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
            showCCI ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'
          }`}
        >
          {showCCI ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          CCI
        </button>
        <button
          onClick={() => setShowADX(!showADX)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
            showADX ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-500'
          }`}
        >
          {showADX ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          ADX
        </button>
        <button
          onClick={() => setShowBB(!showBB)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
            showBB ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-500'
          }`}
        >
          {showBB ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          볼린저밴드
        </button>
        <button
          onClick={() => setShowVWAP(!showVWAP)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
            showVWAP ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'
          }`}
        >
          {showVWAP ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          VWAP
        </button>
      </div>

      {/* 가격 + 지표 차트 */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={mergedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            yAxisId="price"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          {showCCI && (
            <YAxis 
              yAxisId="cci"
              orientation="right"
              stroke="#60A5FA"
              tick={{ fill: '#60A5FA', fontSize: 12 }}
              domain={[-200, 200]}
            />
          )}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
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
          {showBB && (
            <>
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="bb_upper" 
                stroke="#F59E0B" 
                strokeWidth={1}
                name="볼린저 상단"
                dot={false}
                strokeDasharray="5 5"
              />
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="bb_middle" 
                stroke="#EAB308" 
                strokeWidth={1}
                name="볼린저 중간"
                dot={false}
                strokeDasharray="3 3"
              />
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="bb_lower" 
                stroke="#F59E0B" 
                strokeWidth={1}
                name="볼린저 하단"
                dot={false}
                strokeDasharray="5 5"
              />
            </>
          )}
          {showVWAP && (
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="vwap" 
              stroke="#10B981" 
              strokeWidth={2}
              name="VWAP"
              dot={false}
            />
          )}
          {showCCI && (
            <>
              <ReferenceLine yAxisId="cci" y={100} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="cci" y={-100} stroke="#10B981" strokeDasharray="3 3" />
              <Line 
                yAxisId="cci"
                type="monotone" 
                dataKey="cci" 
                stroke="#60A5FA" 
                strokeWidth={2}
                name="CCI"
                dot={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* OBV 별도 차트 */}
      {showOBV && obvData.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-light-blue mb-2">OBV (On-Balance Volume)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={obvData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
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
                dataKey="obv"
                stroke="#A855F7"
                strokeWidth={2}
                name="OBV"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ADX 별도 차트 */}
      {showADX && adxData.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-light-blue mb-2">ADX (Average Directional Index)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={adxData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <ReferenceLine y={25} stroke="#EF4444" strokeDasharray="3 3" label="강한 추세 (25)" />
              <Line
                type="monotone"
                dataKey="adx"
                stroke="#A855F7"
                strokeWidth={2}
                name="ADX"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="di_plus"
                stroke="#10B981"
                strokeWidth={1}
                name="DI+"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="di_minus"
                stroke="#EF4444"
                strokeWidth={1}
                name="DI-"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

