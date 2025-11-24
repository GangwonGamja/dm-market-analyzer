import React from 'react';
import { Card } from '../common/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { AnalysisResponse } from '../../types/analysis';

interface InsightCardProps {
  analysisData: AnalysisResponse;
  confidence?: number; // 0-100 신뢰도
  recommendation?: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

export const InsightCard: React.FC<InsightCardProps> = ({
  analysisData,
  confidence = 75,
  recommendation = 'Hold',
}) => {
  // 추천 색상 및 스타일
  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'Strong Buy':
        return {
          bg: 'bg-green-900/30 border-green-500',
          text: 'text-green-400',
          icon: '🟢'
        };
      case 'Buy':
        return {
          bg: 'bg-green-800/20 border-green-400',
          text: 'text-green-300',
          icon: '🟢'
        };
      case 'Hold':
        return {
          bg: 'bg-yellow-900/20 border-yellow-500',
          text: 'text-yellow-400',
          icon: '🟡'
        };
      case 'Sell':
        return {
          bg: 'bg-red-800/20 border-red-400',
          text: 'text-red-300',
          icon: '🔴'
        };
      case 'Strong Sell':
        return {
          bg: 'bg-red-900/30 border-red-500',
          text: 'text-red-400',
          icon: '🔴'
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-600',
          text: 'text-slate-400',
          icon: '⚪'
        };
    }
  };

  // 위험도 색상
  const getRiskColor = (score: number) => {
    if (score <= 40) return 'text-green-400';
    if (score <= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score <= 40) return 'bg-green-500';
    if (score <= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const recStyle = getRecommendationStyle(recommendation);
  const riskScore = analysisData.volatility.risk_score;
  const riskColor = getRiskColor(riskScore);
  const riskBgColor = getRiskBgColor(riskScore);

  // 근거를 긍정/부정으로 분류
  const positiveReasons = analysisData.summary.filter((reason: string) => 
    reason.includes('상승') || 
    reason.includes('골든') || 
    reason.includes('과매도') ||
    reason.includes('매수') ||
    reason.includes('Hammer') ||
    reason.includes('Bullish')
  );

  const negativeReasons = analysisData.summary.filter((reason: string) => 
    reason.includes('하락') || 
    reason.includes('데드') || 
    reason.includes('과매수') ||
    reason.includes('매도') ||
    reason.includes('Bearish') ||
    reason.includes('위험') ||
    reason.includes('변동성')
  );

  return (
    <Card title={`${analysisData.ticker} 투자 인사이트`}>
      <div className="space-y-6">
        {/* 1. 종합 시그널 헤더 */}
        <div className={`p-6 rounded-lg border-2 ${recStyle.bg}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{recStyle.icon}</span>
              <div>
                <div className={`text-3xl font-bold ${recStyle.text}`}>
                  {recommendation}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  종합 투자 의견
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-200">
                {confidence}%
              </div>
              <div className="text-xs text-slate-400">신뢰도</div>
            </div>
          </div>
          
          {/* 신뢰도 게이지 */}
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${recStyle.bg.replace('border-', 'bg-').replace('/30', '').replace('/20', '')}`}
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>

        {/* 2. 핵심 근거 리스트 */}
        <div className="space-y-3">
          <div className="text-lg font-semibold text-slate-300 mb-3">핵심 근거</div>
          
          {/* 긍정적 근거 */}
          {positiveReasons.length > 0 && (
            <div className="space-y-2">
              {positiveReasons.map((reason: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-green-900/10 border border-green-500/30 rounded">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300 flex-1">{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* 부정적 근거 */}
          {negativeReasons.length > 0 && (
            <div className="space-y-2 mt-3">
              {negativeReasons.map((reason: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-red-900/10 border border-red-500/30 rounded">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300 flex-1">{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* 중립 근거 (긍정/부정에 포함되지 않은 것들) */}
          {analysisData.summary.filter((r: string) => 
            !positiveReasons.includes(r) && !negativeReasons.includes(r)
          ).length > 0 && (
            <div className="space-y-2 mt-3">
              {analysisData.summary
                .filter((r: string) => !positiveReasons.includes(r) && !negativeReasons.includes(r))
                .map((reason: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-800 border border-slate-600 rounded">
                    <Activity className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300 flex-1">{reason}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 3. MA 교차 신호 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">MA50 vs MA200</div>
            <div className="flex items-center gap-2">
              {analysisData.cross.ma50_ma200 === 'golden' && (
                <>
                  <Zap className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">골든크로스</span>
                </>
              )}
              {analysisData.cross.ma50_ma200 === 'death' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">데드크로스</span>
                </>
              )}
              {analysisData.cross.ma50_ma200 === 'none' && (
                <span className="text-slate-400 text-sm">크로스 없음</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">MA20 vs MA60</div>
            <div className="flex items-center gap-2">
              {analysisData.cross.ma20_ma60 === 'golden' && (
                <>
                  <Zap className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">골든크로스</span>
                </>
              )}
              {analysisData.cross.ma20_ma60 === 'death' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">데드크로스</span>
                </>
              )}
              {analysisData.cross.ma20_ma60 === 'none' && (
                <span className="text-slate-400 text-sm">크로스 없음</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. 트렌드 섹션 */}
        <div className="bg-slate-900 rounded-lg p-4 space-y-3">
          <div className="text-lg font-semibold text-slate-300 mb-3">추세 분석</div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {analysisData.trend.long === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : analysisData.trend.long === 'down' ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <Activity className="w-5 h-5 text-yellow-400" />
              )}
              <span className="text-slate-300">장기 추세</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                analysisData.trend.long === 'up' ? 'text-green-400' :
                analysisData.trend.long === 'down' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {analysisData.trend.long === 'up' ? '상승' : 
                 analysisData.trend.long === 'down' ? '하락' : '중립'}
              </span>
              <span className="text-slate-400 text-sm">
                ({analysisData.trend.strength_long}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {analysisData.trend.short === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : analysisData.trend.short === 'down' ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <Activity className="w-5 h-5 text-yellow-400" />
              )}
              <span className="text-slate-300">단기 추세</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                analysisData.trend.short === 'up' ? 'text-green-400' :
                analysisData.trend.short === 'down' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {analysisData.trend.short === 'up' ? '상승' : 
                 analysisData.trend.short === 'down' ? '하락' : '중립'}
              </span>
              <span className="text-slate-400 text-sm">
                ({analysisData.trend.strength_short}%)
              </span>
            </div>
          </div>
        </div>

        {/* 5. 변동성·리스크 섹션 */}
        <div className="bg-slate-900 rounded-lg p-4">
          <div className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            변동성·리스크
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Risk Score</span>
                <span className={`text-2xl font-bold ${riskColor}`}>
                  {riskScore}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${riskBgColor}`}
                  style={{ width: `${riskScore}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                ATR: {analysisData.volatility.atr}
              </div>
            </div>
            
            {/* 원형 게이지 (간단한 버전) */}
            <div className="ml-6 relative w-20 h-20">
              <svg className="transform -rotate-90 w-20 h-20">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - riskScore / 100)}`}
                  className={riskColor}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${riskColor}`}>
                  {riskScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. 패턴 탐지 섹션 */}
        {(analysisData.patterns.length > 0 || analysisData.candles.length > 0) && (
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-lg font-semibold text-slate-300 mb-3">패턴 탐지</div>
            
            {/* 기술 패턴 */}
            {analysisData.patterns.length > 0 && (
              <div className="mb-3">
                <div className="text-sm text-slate-400 mb-2">기술 패턴</div>
                <div className="flex flex-wrap gap-2">
                  {analysisData.patterns.map((pattern, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500 rounded-full text-purple-400 text-sm font-medium"
                    >
                      {pattern === 'triangle' && '🔺 삼각수렴'}
                      {pattern === 'wedge_up' && '📈 상승 쐐기'}
                      {pattern === 'wedge_down' && '📉 하락 쐐기'}
                      {pattern === 'box_range' && '📦 박스권'}
                      {!['triangle', 'wedge_up', 'wedge_down', 'box_range'].includes(pattern) && pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 캔들 패턴 */}
            {analysisData.candles.length > 0 && (
              <div>
                <div className="text-sm text-slate-400 mb-2">캔들 패턴</div>
                <div className="flex flex-wrap gap-2">
                  {analysisData.candles.map((pattern, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 border rounded-full text-sm font-medium ${
                        pattern.includes('bull') || pattern === 'hammer'
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : pattern.includes('bear')
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-blue-500/20 border-blue-500 text-blue-400'
                      }`}
                    >
                      {pattern === 'hammer' && '🔨 Hammer'}
                      {pattern === 'doji' && '➕ Doji'}
                      {pattern === 'engulfing_bull' && '📈 Bullish Engulfing'}
                      {pattern === 'engulfing_bear' && '📉 Bearish Engulfing'}
                      {!['hammer', 'doji', 'engulfing_bull', 'engulfing_bear'].includes(pattern) && pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 추가 정보: RSI, MACD */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">RSI</div>
            <div className={`text-2xl font-bold ${
              analysisData.rsi.zone === 'oversold' ? 'text-green-400' :
              analysisData.rsi.zone === 'overbought' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {analysisData.rsi.value.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {analysisData.rsi.zone === 'oversold' ? '과매도' :
               analysisData.rsi.zone === 'overbought' ? '과매수' :
               '중립'}
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">MACD</div>
            <div className="flex items-center gap-2">
              {analysisData.macd.signal === 'golden' && (
                <>
                  <Zap className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">골든크로스</span>
                </>
              )}
              {analysisData.macd.signal === 'death' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">데드크로스</span>
                </>
              )}
              {analysisData.macd.signal === 'neutral' && (
                <span className="text-slate-400 text-sm">중립</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

