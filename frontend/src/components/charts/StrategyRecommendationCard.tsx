import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Shield, Target, AlertTriangle } from 'lucide-react';

interface StrategyRecommendationCardProps {
  strategy: string;
  trend: 'up' | 'down' | 'neutral';
  rsi: number;
  riskScore: number;
  volatility: number;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

export const StrategyRecommendationCard: React.FC<StrategyRecommendationCardProps> = ({
  strategy,
  trend,
  rsi,
  riskScore,
  volatility,
  recommendation,
}) => {
  const getStrategyDetails = () => {
    if (strategy.includes('추세추종')) {
      return {
        icon: <TrendingUp className="w-8 h-8 text-green-400" />,
        title: '추세추종 전략',
        description: '현재 상승 추세가 지속되고 있습니다. 추세를 따라 매수 후 상승 추세가 끝날 때까지 보유하세요.',
        actions: [
          '현재 추세 방향으로 포지션 진입',
          '추세 반전 신호 발생 시 매도',
          '손절선을 MA200 근처에 설정',
        ],
        color: 'text-green-400 border-green-400 bg-green-900/20',
      };
    } else if (strategy.includes('손절 중심') || strategy.includes('보수')) {
      return {
        icon: <Shield className="w-8 h-8 text-red-400" />,
        title: '보수 전략',
        description: '하락 추세가 감지되었습니다. 손절선을 설정하고 보수적으로 접근하세요.',
        actions: [
          '손절선을 현재가의 5-10% 아래에 설정',
          '포지션 크기 축소 고려',
          '추세 반전 신호 확인 후 재진입',
        ],
        color: 'text-red-400 border-red-400 bg-red-900/20',
      };
    } else if (strategy.includes('분할 매수') || strategy.includes('역추세')) {
      return {
        icon: <Target className="w-8 h-8 text-yellow-400" />,
        title: '역추세 분할 매수 전략',
        description: '과매도 구간이 감지되었습니다. 분할 매수로 리스크를 분산하세요.',
        actions: [
          '3-5회에 걸쳐 분할 매수',
          '각 매수 시점마다 RSI 확인',
          '목표가 도달 시 분할 매도',
        ],
        color: 'text-yellow-400 border-yellow-400 bg-yellow-900/20',
      };
    } else if (strategy.includes('수량 조절')) {
      return {
        icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
        title: '리스크 관리 전략',
        description: '변동성이 높습니다. 포지션 크기를 조절하고 리스크를 관리하세요.',
        actions: [
          '포지션 크기를 평소의 50-70%로 축소',
          '손절선을 더 타이트하게 설정',
          '변동성 감소 시 포지션 확대',
        ],
        color: 'text-orange-400 border-orange-400 bg-orange-900/20',
      };
    } else {
      return {
        icon: <DollarSign className="w-8 h-8 text-slate-400" />,
        title: '현재 포지션 유지',
        description: '중립적 시장 상황입니다. 현재 포지션을 유지하고 시장 변화를 관찰하세요.',
        actions: [
          '현재 포지션 유지',
          '추세 변화 신호 모니터링',
          '새로운 기회 대기',
        ],
        color: 'text-slate-400 border-slate-400 bg-slate-900/20',
      };
    }
  };

  const strategyDetails = getStrategyDetails();

  return (
    <div className={`border-2 rounded-lg p-6 ${strategyDetails.color}`}>
      <div className="flex items-center gap-4 mb-6">
        {strategyDetails.icon}
        <div className="flex-1">
          <div className="text-2xl font-bold mb-1">{strategyDetails.title}</div>
          <div className="text-sm text-slate-400">{strategyDetails.description}</div>
        </div>
      </div>

      {/* 전략 액션 리스트 */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-light-blue mb-3">권장 액션</div>
        <ul className="space-y-2">
          {strategyDetails.actions.map((action, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-light-blue mt-1">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 현재 시장 상태 */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
        <div>
          <div className="text-xs text-slate-400 mb-1">추세</div>
          <div className={`text-sm font-semibold ${
            trend === 'up' ? 'text-green-400' :
            trend === 'down' ? 'text-red-400' :
            'text-slate-400'
          }`}>
            {trend === 'up' ? '상승' : trend === 'down' ? '하락' : '중립'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">RSI</div>
          <div className={`text-sm font-semibold ${
            rsi > 70 ? 'text-red-400' :
            rsi < 30 ? 'text-green-400' :
            'text-yellow-400'
          }`}>
            {rsi.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">위험 점수</div>
          <div className={`text-sm font-semibold ${
            riskScore <= 30 ? 'text-green-400' :
            riskScore <= 70 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {riskScore.toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">변동성</div>
          <div className={`text-sm font-semibold ${
            volatility < 20 ? 'text-green-400' :
            volatility < 40 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {volatility.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

