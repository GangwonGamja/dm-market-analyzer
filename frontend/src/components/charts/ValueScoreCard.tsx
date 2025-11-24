import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ValueScoreCardProps {
  valueScore: number; // 0-100
  valueGrade: '저평가' | '정상' | '고평가';
  per?: number;
  pbr?: number;
  peg?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  factors?: string[];
}

export const ValueScoreCard: React.FC<ValueScoreCardProps> = ({
  valueScore,
  valueGrade,
  per,
  pbr,
  peg,
  revenueGrowth,
  epsGrowth,
  factors = [],
}) => {
  const getGradeColor = () => {
    if (valueScore <= 30) return 'text-green-400';
    if (valueScore <= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGradeBgColor = () => {
    if (valueScore <= 30) return 'bg-green-900/20 border-green-400';
    if (valueScore <= 70) return 'bg-yellow-900/20 border-yellow-400';
    return 'bg-red-900/20 border-red-400';
  };

  const getGradeIcon = () => {
    if (valueScore <= 30) return <TrendingUp className="w-8 h-8 text-green-400" />;
    if (valueScore <= 70) return <Minus className="w-8 h-8 text-yellow-400" />;
    return <TrendingDown className="w-8 h-8 text-red-400" />;
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${getGradeBgColor()}`}>
      <div className="flex items-center gap-4 mb-6">
        {getGradeIcon()}
        <div className="flex-1">
          <div className="text-2xl font-bold mb-1" style={{ color: getGradeColor() }}>
            {valueGrade}
          </div>
          <div className="text-sm text-slate-400">Value Score: {valueScore.toFixed(1)}</div>
        </div>
      </div>

      {/* Value Score 게이지 */}
      <div className="mb-6">
        <div className="w-full bg-slate-700 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              valueScore <= 30 ? 'bg-green-500' :
              valueScore <= 70 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${valueScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>0 (저평가)</span>
          <span>50 (정상)</span>
          <span>100 (고평가)</span>
        </div>
      </div>

      {/* 펀더멘털 지표 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {per !== null && per !== undefined && (
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">PER</div>
            <div className="text-lg font-bold">{per.toFixed(2)}</div>
          </div>
        )}
        {pbr !== null && pbr !== undefined && (
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">PBR</div>
            <div className="text-lg font-bold">{pbr.toFixed(2)}</div>
          </div>
        )}
        {peg !== null && peg !== undefined && (
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">PEG</div>
            <div className="text-lg font-bold">{peg.toFixed(2)}</div>
          </div>
        )}
        {revenueGrowth !== null && revenueGrowth !== undefined && (
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">매출 성장률</div>
            <div className={`text-lg font-bold ${
              revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(revenueGrowth * 100).toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* 평가 요인 */}
      {factors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm font-semibold text-light-blue mb-2">평가 요인</div>
          <div className="flex flex-wrap gap-2">
            {factors.map((factor, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

