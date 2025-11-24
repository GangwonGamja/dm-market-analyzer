import React from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { ConfidenceGauge } from './ConfidenceGauge';

interface SignalResultCardProps {
  signal: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-1
  reasons: string[];
  goldenCross?: boolean;
  deathCross?: boolean;
  divergence?: 'bullish' | 'bearish' | 'none';
  riskScore?: number;
  riskGrade?: 'Low' | 'Medium' | 'High';
}

export const SignalResultCard: React.FC<SignalResultCardProps> = ({
  signal,
  confidence,
  reasons,
  goldenCross = false,
  deathCross = false,
  divergence = 'none',
  riskScore,
  riskGrade,
}) => {
  const getSignalColor = () => {
    if (signal === 'buy') return 'text-green-400 border-green-400 bg-green-900/20';
    if (signal === 'sell') return 'text-red-400 border-red-400 bg-red-900/20';
    return 'text-yellow-400 border-yellow-400 bg-yellow-900/20';
  };

  const getSignalIcon = () => {
    if (signal === 'buy') return <CheckCircle className="w-12 h-12 text-green-400" />;
    if (signal === 'sell') return <XCircle className="w-12 h-12 text-red-400" />;
    return <AlertCircle className="w-12 h-12 text-yellow-400" />;
  };

  const getSignalText = () => {
    if (signal === 'buy') return '매수 / 유지 권장';
    if (signal === 'sell') return '매도 / 전환 권장';
    return '현재 포지션 유지';
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${getSignalColor()}`}>
      {/* 시그널 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        {getSignalIcon()}
        <div className="flex-1">
          <div className="text-3xl font-bold mb-1">{getSignalText()}</div>
          <div className="text-sm text-slate-400">신뢰도: {(confidence * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Confidence Gauge */}
      <div className="mb-6 flex items-center justify-center">
        <ConfidenceGauge confidence={confidence} size={150} />
      </div>

      {/* 주요 이유 */}
      <div className="mb-4">
        <div className="text-sm font-semibold text-light-blue mb-3">판단 근거</div>
        <ul className="space-y-2">
          {reasons.map((reason, index) => (
            <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
              <span className="text-light-blue mt-1">·</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 추가 지표 요약 */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-4 text-xs">
          {goldenCross && (
            <div className="flex items-center gap-2 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>Golden Cross</span>
            </div>
          )}
          {deathCross && (
            <div className="flex items-center gap-2 text-red-400">
              <TrendingDown className="w-4 h-4" />
              <span>Death Cross</span>
            </div>
          )}
          {divergence === 'bullish' && (
            <div className="flex items-center gap-2 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>Bullish Divergence</span>
            </div>
          )}
          {divergence === 'bearish' && (
            <div className="flex items-center gap-2 text-red-400">
              <TrendingDown className="w-4 h-4" />
              <span>Bearish Divergence</span>
            </div>
          )}
          {riskScore !== undefined && riskGrade && (
            <div className="flex items-center gap-2 text-slate-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Risk: {riskScore.toFixed(0)} ({riskGrade})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

