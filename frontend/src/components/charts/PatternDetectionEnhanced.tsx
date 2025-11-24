import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface PatternDetectionEnhancedProps {
  patterns: Array<{
    type: string;
    description: string;
    start_date: string;
    end_date: string;
    upper?: number;
    lower?: number;
  }>;
  spikeDays: Array<{
    date: string;
    change_pct: number;
    type: 'spike_up' | 'spike_down';
    price: number;
  }>;
  bollingerBreakout?: {
    type: 'upper_breakout' | 'lower_breakout';
    description: string;
    price: number;
    upper_band?: number;
    lower_band?: number;
  };
}

export const PatternDetectionEnhanced: React.FC<PatternDetectionEnhancedProps> = ({
  patterns,
  spikeDays,
  bollingerBreakout,
}) => {
  const getPatternColor = (type: string) => {
    if (type.includes('ascending') || type.includes('bullish')) return 'text-green-400';
    if (type.includes('descending') || type.includes('bearish')) return 'text-red-400';
    if (type === 'box') return 'text-blue-400';
    return 'text-slate-400';
  };

  const getPatternIcon = (type: string) => {
    if (type.includes('ascending') || type.includes('bullish')) return <TrendingUp className="w-5 h-5" />;
    if (type.includes('descending') || type.includes('bearish')) return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  return (
    <div className="w-full space-y-4">
      {/* 패턴 목록 */}
      {patterns.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-sm font-semibold text-light-blue mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            탐지된 패턴 ({patterns.length}개)
          </div>
          <div className="space-y-2">
            {patterns.map((pattern, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div style={{ color: getPatternColor(pattern.type) }}>
                    {getPatternIcon(pattern.type)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: getPatternColor(pattern.type) }}>
                      {pattern.description}
                    </div>
                    <div className="text-xs text-slate-400">
                      {pattern.start_date} ~ {pattern.end_date}
                    </div>
                    {pattern.upper && pattern.lower && (
                      <div className="text-xs text-slate-500 mt-1">
                        범위: ${pattern.lower.toFixed(2)} ~ ${pattern.upper.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 볼린저밴드 돌파 */}
      {bollingerBreakout && (
        <div className={`bg-slate-900 rounded-lg p-4 border ${
          bollingerBreakout.type === 'upper_breakout' 
            ? 'border-red-500 bg-red-900/20' 
            : 'border-green-500 bg-green-900/20'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${
              bollingerBreakout.type === 'upper_breakout' ? 'text-red-400' : 'text-green-400'
            }`} />
            <div>
              <div className={`text-sm font-semibold ${
                bollingerBreakout.type === 'upper_breakout' ? 'text-red-400' : 'text-green-400'
              }`}>
                {bollingerBreakout.description}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                가격: ${bollingerBreakout.price.toFixed(2)}
                {bollingerBreakout.upper_band && ` (상단: ${bollingerBreakout.upper_band.toFixed(2)})`}
                {bollingerBreakout.lower_band && ` (하단: ${bollingerBreakout.lower_band.toFixed(2)})`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 급등/급락일 */}
      {spikeDays.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-sm font-semibold text-light-blue mb-3">
            급등/급락일 ({spikeDays.length}일)
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {spikeDays.map((spike, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded ${
                  spike.type === 'spike_up' ? 'bg-green-900/20' : 'bg-red-900/20'
                }`}
              >
                <div className="text-xs text-slate-400">{spike.date}</div>
                <div className={`text-sm font-semibold ${
                  spike.type === 'spike_up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {spike.change_pct > 0 ? '+' : ''}{spike.change_pct.toFixed(2)}%
                </div>
                <div className="text-xs text-slate-400">
                  ${spike.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {patterns.length === 0 && !bollingerBreakout && spikeDays.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          탐지된 패턴이 없습니다.
        </div>
      )}
    </div>
  );
};

