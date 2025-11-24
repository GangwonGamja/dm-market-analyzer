import React from 'react';
import { Card } from '../common/Card';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Info, Shield, Zap } from 'lucide-react';

interface EnhancedAnalysisCardProps {
  comprehensiveOpinion: any;
  trend: any;
  crosses: any;
  candlestickPatterns: any;
  technicalPatterns: any;
  volatilityTiming: any;
  obv: any;
  riskScore: number;
  riskGrade: string;
}

export const EnhancedAnalysisCard: React.FC<EnhancedAnalysisCardProps> = ({
  comprehensiveOpinion,
  trend,
  crosses,
  candlestickPatterns,
  technicalPatterns,
  volatilityTiming,
  obv,
  riskScore,
  riskGrade,
}) => {
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Strong Buy':
        return 'text-green-400 bg-green-900/20 border-green-500';
      case 'Buy':
        return 'text-green-300 bg-green-900/10 border-green-400';
      case 'Hold':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'Sell':
        return 'text-red-300 bg-red-900/10 border-red-400';
      case 'Strong Sell':
        return 'text-red-400 bg-red-900/20 border-red-500';
      default:
        return 'text-slate-400 bg-slate-900/20 border-slate-500';
    }
  };

  const getBuyTimingColor = (timing: string) => {
    switch (timing) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-green-300';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-300';
      case 'avoid':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const recommendation = comprehensiveOpinion?.recommendation || 'Hold';
  const totalScore = comprehensiveOpinion?.total_score || 0;
  const confidence = comprehensiveOpinion?.confidence || 0;
  const buyTiming = comprehensiveOpinion?.buy_timing || 'fair';
  const reasons = comprehensiveOpinion?.reasons || { positive: [], negative: [], neutral: [] };

  return (
    <div className="space-y-6">
      {/* 전체 의견 카드 */}
      <Card title="종합 투자 의견">
        <div className="space-y-4">
          {/* 추천 헤더 */}
          <div className={`text-center p-6 rounded-lg border-2 ${getRecommendationColor(recommendation)}`}>
            <div className="text-4xl font-bold mb-2">{recommendation}</div>
            <div className="text-sm text-slate-300">
              종합 점수: {totalScore > 0 ? '+' : ''}{totalScore} / 신뢰도: {(confidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* 매수 타이밍 */}
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">매수 타이밍</div>
              <div className={`text-lg font-bold ${getBuyTimingColor(buyTiming)}`}>
                {buyTiming === 'excellent' && '⭐ 우수'}
                {buyTiming === 'good' && '✓ 양호'}
                {buyTiming === 'fair' && '○ 보통'}
                {buyTiming === 'poor' && '⚠ 주의'}
                {buyTiming === 'avoid' && '✗ 회피'}
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  buyTiming === 'excellent' || buyTiming === 'good' ? 'bg-green-500' :
                  buyTiming === 'fair' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(totalScore + 10) * 5}%` }}
              ></div>
            </div>
          </div>

          {/* 추세 표시 */}
          {trend && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">장기 추세</div>
                <div className="flex items-center gap-2">
                  {trend.long_term?.trend?.includes('uptrend') ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : trend.long_term?.trend?.includes('downtrend') ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <Info className="w-5 h-5 text-yellow-400" />
                  )}
                  <div className="text-lg font-semibold text-slate-200">
                    {trend.long_term?.trend?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  강도: {trend.long_term?.strength || 0}%
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">단기 추세</div>
                <div className="flex items-center gap-2">
                  {trend.short_term?.trend?.includes('uptrend') ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : trend.short_term?.trend?.includes('downtrend') ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <Info className="w-5 h-5 text-yellow-400" />
                  )}
                  <div className="text-lg font-semibold text-slate-200">
                    {trend.short_term?.trend?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  기울기: {trend.short_term?.ma20_slope || 0}%
                </div>
              </div>
            </div>
          )}

          {/* 골든/데드크로스 배지 */}
          {crosses && (
            <div className="flex gap-2 flex-wrap">
              {crosses.ma50_ma200?.golden_cross && (
                <div className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-sm flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  MA50/200 골든크로스
                </div>
              )}
              {crosses.ma50_ma200?.death_cross && (
                <div className="px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  MA50/200 데드크로스
                </div>
              )}
              {crosses.ma20_ma60?.golden_cross && (
                <div className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-sm flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  MA20/60 골든크로스
                </div>
              )}
              {crosses.ma20_ma60?.death_cross && (
                <div className="px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  MA20/60 데드크로스
                </div>
              )}
            </div>
          )}

          {/* 위험도 게이지 */}
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <div className="text-sm text-slate-400">위험도</div>
              </div>
              <div className={`text-lg font-bold ${
                riskScore <= 30 ? 'text-green-400' :
                riskScore <= 70 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {riskScore.toFixed(0)} / {riskGrade}
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  riskScore <= 30 ? 'bg-green-500' :
                  riskScore <= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${riskScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* 근거 리스트 */}
      <Card title="분석 근거">
        <div className="space-y-3">
          {reasons.positive && reasons.positive.length > 0 && (
            <div>
              <div className="text-sm text-green-400 font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                긍정적 요인 ({reasons.positive.length}개)
              </div>
              <ul className="space-y-1 ml-6">
                {reasons.positive.map((reason: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">✔</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasons.negative && reasons.negative.length > 0 && (
            <div>
              <div className="text-sm text-red-400 font-semibold mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                부정적 요인 ({reasons.negative.length}개)
              </div>
              <ul className="space-y-1 ml-6">
                {reasons.negative.map((reason: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasons.neutral && reasons.neutral.length > 0 && (
            <div>
              <div className="text-sm text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                중립 요인 ({reasons.neutral.length}개)
              </div>
              <ul className="space-y-1 ml-6">
                {reasons.neutral.map((reason: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">○</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!reasons.positive || reasons.positive.length === 0) &&
           (!reasons.negative || reasons.negative.length === 0) &&
           (!reasons.neutral || reasons.neutral.length === 0) && (
            <div className="text-slate-400 text-center py-4">분석 근거 데이터가 없습니다.</div>
          )}
        </div>
      </Card>

      {/* 패턴 및 타이밍 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 캔들 패턴 */}
        {candlestickPatterns && candlestickPatterns.recent_patterns && candlestickPatterns.recent_patterns.length > 0 && (
          <Card title="최근 캔들 패턴">
            <div className="space-y-2">
              {candlestickPatterns.recent_patterns.slice(-3).map((pattern: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded">
                  <div className="text-sm text-slate-300">{pattern.pattern}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    pattern.signal === 'bullish' ? 'bg-green-500/20 text-green-400' :
                    pattern.signal === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {pattern.signal}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 변동성 타이밍 */}
        {volatilityTiming && (
          <Card title="변동성 타이밍">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">ATR 백분위수</div>
                <div className="text-sm font-semibold text-slate-200">
                  {volatilityTiming.atr_percentile?.toFixed(1) || 0}%
                </div>
              </div>
              {volatilityTiming.low_volatility_zone && (
                <div className="text-xs text-green-400 bg-green-500/20 p-2 rounded">
                  ✓ 저변동성 구간 - 매수 타이밍 유리
                </div>
              )}
              {volatilityTiming.atr_spike && (
                <div className="text-xs text-red-400 bg-red-500/20 p-2 rounded">
                  ⚠ 변동성 급증 - 주의 필요
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

