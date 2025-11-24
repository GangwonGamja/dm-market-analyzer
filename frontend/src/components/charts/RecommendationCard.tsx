import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Minus } from 'lucide-react';
import { ConfidenceGauge } from './ConfidenceGauge';

interface RecommendationCardProps {
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  confidence: number;
  opinionScore: number;
  reasons: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  strategy: string;
  targetPrice?: number;
  stopLoss?: number;
  rewardRiskRatio?: number;
  currentPrice?: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  confidence,
  opinionScore,
  reasons,
  strategy,
  targetPrice,
  stopLoss,
  rewardRiskRatio,
  currentPrice,
}) => {
  const getRecommendationColor = () => {
    switch (recommendation) {
      case 'Strong Buy':
        return 'text-green-400 border-green-400 bg-green-900/20';
      case 'Buy':
        return 'text-green-300 border-green-300 bg-green-900/10';
      case 'Hold':
        return 'text-yellow-400 border-yellow-400 bg-yellow-900/20';
      case 'Sell':
        return 'text-red-300 border-red-300 bg-red-900/10';
      case 'Strong Sell':
        return 'text-red-400 border-red-400 bg-red-900/20';
      default:
        return 'text-slate-400 border-slate-400 bg-slate-900/20';
    }
  };

  const getRecommendationIcon = () => {
    switch (recommendation) {
      case 'Strong Buy':
        return <CheckCircle className="w-12 h-12 text-green-400" />;
      case 'Buy':
        return <TrendingUp className="w-12 h-12 text-green-300" />;
      case 'Hold':
        return <Minus className="w-12 h-12 text-yellow-400" />;
      case 'Sell':
        return <TrendingDown className="w-12 h-12 text-red-300" />;
      case 'Strong Sell':
        return <XCircle className="w-12 h-12 text-red-400" />;
      default:
        return <AlertCircle className="w-12 h-12 text-slate-400" />;
    }
  };

  const getRecommendationText = () => {
    switch (recommendation) {
      case 'Strong Buy':
        return '적극매수';
      case 'Buy':
        return '매수';
      case 'Hold':
        return '중립';
      case 'Sell':
        return '매도';
      case 'Strong Sell':
        return '적극매도';
      default:
        return '분석 불가';
    }
  };

  const calculateReturn = () => {
    if (!targetPrice || !currentPrice) return null;
    return ((targetPrice - currentPrice) / currentPrice) * 100;
  };

  const calculateLoss = () => {
    if (!stopLoss || !currentPrice) return null;
    return ((stopLoss - currentPrice) / currentPrice) * 100;
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${getRecommendationColor()}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        {getRecommendationIcon()}
        <div className="flex-1">
          <div className="text-3xl font-bold mb-1">{getRecommendationText()}</div>
          <div className="text-sm text-slate-400">
            Opinion Score: {opinionScore > 0 ? '+' : ''}{opinionScore}
          </div>
        </div>
      </div>

      {/* Confidence Gauge */}
      <div className="mb-6 flex items-center justify-center">
        <ConfidenceGauge confidence={confidence} size={150} />
      </div>

      {/* 목표가/손절가 */}
      {(targetPrice || stopLoss) && currentPrice && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          {targetPrice && (
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">목표가</div>
              <div className="text-2xl font-bold text-green-400">
                ${targetPrice.toFixed(2)}
              </div>
              {calculateReturn() !== null && (
                <div className="text-xs text-green-400 mt-1">
                  예상 수익률: +{calculateReturn()!.toFixed(2)}%
                </div>
              )}
            </div>
          )}
          {stopLoss && (
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">손절가</div>
              <div className="text-2xl font-bold text-red-400">
                ${stopLoss.toFixed(2)}
              </div>
              {calculateLoss() !== null && (
                <div className="text-xs text-red-400 mt-1">
                  예상 손실률: {calculateLoss()!.toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reward/Risk Ratio */}
      {rewardRiskRatio !== null && rewardRiskRatio !== undefined && (
        <div className="mb-6 bg-slate-900 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">Reward/Risk Ratio</div>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${
              rewardRiskRatio >= 2.0 ? 'text-green-400' :
              rewardRiskRatio >= 1.0 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {rewardRiskRatio.toFixed(2)}
            </div>
            <div className="flex-1">
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    rewardRiskRatio >= 2.0 ? 'bg-green-500' :
                    rewardRiskRatio >= 1.0 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (rewardRiskRatio / 3.0) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {rewardRiskRatio >= 2.0 ? '매수 유리' :
                 rewardRiskRatio >= 1.0 ? '보통' :
                 '위험 부담 높음'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상승 요인 */}
      {reasons.positive.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            상승 요인
          </div>
          <ul className="space-y-1">
            {reasons.positive.map((reason, index) => (
              <li key={index} className="text-sm text-green-300 flex items-start gap-2">
                <span className="text-green-400 mt-1">+</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 하락 요인 */}
      {reasons.negative.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            하락 요인
          </div>
          <ul className="space-y-1">
            {reasons.negative.map((reason, index) => (
              <li key={index} className="text-sm text-red-300 flex items-start gap-2">
                <span className="text-red-400 mt-1">-</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 중립 요인 */}
      {reasons.neutral.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
            <Minus className="w-4 h-4" />
            중립 요인
          </div>
          <ul className="space-y-1">
            {reasons.neutral.map((reason, index) => (
              <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 전략 추천 */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="text-sm font-semibold text-light-blue mb-2">추천 전략</div>
        <div className="text-sm text-slate-300">{strategy}</div>
      </div>
    </div>
  );
};

