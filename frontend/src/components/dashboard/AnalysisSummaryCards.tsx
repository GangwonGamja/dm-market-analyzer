import React from 'react';
import { Card } from '../common/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Shield,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';
import { AnalysisResponse } from '../../types/analysis';

interface AnalysisSummaryCardsProps {
  analysisData: AnalysisResponse;
  confidence?: number;
  recommendation?: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

export const AnalysisSummaryCards: React.FC<AnalysisSummaryCardsProps> = ({
  analysisData,
  confidence = 75,
  recommendation = 'Hold',
}) => {
  // 추천 색상 및 스타일
  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'Strong Buy':
        return { bg: 'bg-green-900/30', border: 'border-green-500', text: 'text-green-400', icon: '🟢' };
      case 'Buy':
        return { bg: 'bg-green-800/20', border: 'border-green-400', text: 'text-green-300', icon: '🟢' };
      case 'Hold':
        return { bg: 'bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-400', icon: '🔵' };
      case 'Sell':
        return { bg: 'bg-red-800/20', border: 'border-red-400', text: 'text-red-300', icon: '🔴' };
      case 'Strong Sell':
        return { bg: 'bg-red-900/30', border: 'border-red-500', text: 'text-red-400', icon: '🔴' };
      default:
        return { bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-400', icon: '⚪' };
    }
  };

  // 위험도 색상
  const getRiskColor = (score: number) => {
    if (score <= 30) return { text: 'text-green-400', bg: 'bg-green-500', border: 'border-green-500', grade: '안정적' };
    if (score <= 60) return { text: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500', grade: '보통' };
    if (score <= 80) return { text: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500', grade: '위험' };
    return { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500', grade: '매우 위험' };
  };

  const recStyle = getRecommendationStyle(recommendation);
  const riskScore = analysisData.volatility.risk_score;
  const riskStyle = getRiskColor(riskScore);

  // MA 상태 계산
  const getMAStatus = (maData: any[], maKey: string) => {
    if (!maData || maData.length === 0) return null;
    
    const latestMA = maData[maData.length - 1];
    const price = latestMA?.price || 0;
    const ma = latestMA?.[maKey] || 0;
    
    if (ma === 0 || price === 0) return null;
    
    const isAbove = price > ma;
    const prevMA = maData.length > 1 ? (maData[maData.length - 2]?.[maKey] || 0) : ma;
    const trend = ma > prevMA ? 'up' : ma < prevMA ? 'down' : 'neutral';
    
    return { isAbove, trend, price, ma };
  };

  const ma20Status = getMAStatus(analysisData.ma[20], 'ma20');
  const ma50Status = getMAStatus(analysisData.ma[50], 'ma50');
  const ma200Status = getMAStatus(analysisData.ma[200], 'ma200');

  // 패턴 분류
  const bullishPatterns = analysisData.candles.filter((p: string) => 
    p.includes('bull') || p === 'hammer' || p.includes('morning')
  );
  const bearishPatterns = analysisData.candles.filter((p: string) => 
    p.includes('bear') || p.includes('evening')
  );
  const neutralPatterns = analysisData.candles.filter((p: string) => 
    p === 'doji' || (!p.includes('bull') && !p.includes('bear'))
  );

  // 핵심 근거 3개만 추출
  const keyReasons = analysisData.summary.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. 종합 평가 카드 */}
      <div className={`rounded-lg border-2 ${recStyle.border} ${recStyle.bg} p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{recStyle.icon}</span>
              <div>
                <h3 className="text-2xl font-bold text-slate-200 mb-1">종합 평가</h3>
                <div className={`text-3xl font-bold ${recStyle.text}`}>
                  {analysisData.ticker} - {recommendation}
                </div>
              </div>
            </div>
            
            {/* 핵심 근거 3개 */}
            <div className="space-y-2 mt-4">
              {keyReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span className="text-sm text-slate-300">{reason}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 신뢰도 도넛 차트 */}
          <div className="ml-6 relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - confidence / 100)}`}
                className={recStyle.text.replace('text-', 'text-')}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${recStyle.text}`}>
                {confidence}%
              </span>
              <span className="text-xs text-slate-400">신뢰도</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 추세 분석 카드 & 3. RSI·MACD 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 추세 분석 카드 */}
        <Card title="📈 이동평균선 & 추세 분석">
          <div className="space-y-4">
            {/* MA20 */}
            {ma20Status && (
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">MA20:</span>
                  <span className={`font-semibold ${
                    ma20Status.isAbove ? 'text-green-400' : 'text-red-400'
                  }`}>
                    가격 {ma20Status.isAbove ? '위' : '아래'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {ma20Status.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                  {ma20Status.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {ma20Status.trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
                  <span className="text-xs text-slate-400">
                    {ma20Status.trend === 'up' ? '상승' : ma20Status.trend === 'down' ? '하락' : '중립'}
                  </span>
                </div>
              </div>
            )}

            {/* MA50 */}
            {ma50Status && (
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">MA50:</span>
                  <span className={`font-semibold ${
                    ma50Status.isAbove ? 'text-green-400' : 'text-red-400'
                  }`}>
                    가격 {ma50Status.isAbove ? '위' : '아래'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {ma50Status.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                  {ma50Status.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {ma50Status.trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
                  <span className="text-xs text-slate-400">
                    {ma50Status.trend === 'up' ? '상승' : ma50Status.trend === 'down' ? '하락' : '중립'}
                  </span>
                </div>
              </div>
            )}

            {/* MA200 */}
            {ma200Status && (
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">MA200:</span>
                  <span className={`font-semibold ${
                    ma200Status.isAbove ? 'text-green-400' : 'text-red-400'
                  }`}>
                    가격 {ma200Status.isAbove ? '위' : '아래'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {ma200Status.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                  {ma200Status.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {ma200Status.trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
                  <span className="text-xs text-slate-400">
                    {ma200Status.trend === 'up' ? '상승' : ma200Status.trend === 'down' ? '하락' : '중립'}
                  </span>
                </div>
              </div>
            )}

            {/* 크로스 신호 */}
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
              {analysisData.cross.ma50_ma200 === 'golden' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500 rounded-lg">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold">골든크로스 발생 (MA50/MA200)</span>
                </div>
              )}
              {analysisData.cross.ma50_ma200 === 'death' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-semibold">데드크로스 발생 (MA50/MA200)</span>
                </div>
              )}
              {analysisData.cross.ma20_ma60 === 'golden' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500 rounded-lg">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold">골든크로스 발생 (MA20/MA60)</span>
                </div>
              )}
              {analysisData.cross.ma20_ma60 === 'death' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-semibold">데드크로스 발생 (MA20/MA60)</span>
                </div>
              )}
              {analysisData.cross.ma50_ma200 === 'none' && analysisData.cross.ma20_ma60 === 'none' && (
                <div className="text-sm text-slate-400">크로스 신호 없음</div>
              )}
            </div>

            {/* 추세 요약 */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">단기 추세:</span>
                <div className="flex items-center gap-1">
                  {analysisData.trend.short === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                  {analysisData.trend.short === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {analysisData.trend.short === 'neutral' && <Activity className="w-4 h-4 text-slate-400" />}
                  <span className={`font-semibold ${
                    analysisData.trend.short === 'up' ? 'text-green-400' :
                    analysisData.trend.short === 'down' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {analysisData.trend.short === 'up' ? '상승' : analysisData.trend.short === 'down' ? '하락' : '중립'} ({analysisData.trend.strength_short}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">장기 추세:</span>
                <div className="flex items-center gap-1">
                  {analysisData.trend.long === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                  {analysisData.trend.long === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {analysisData.trend.long === 'neutral' && <Activity className="w-4 h-4 text-slate-400" />}
                  <span className={`font-semibold ${
                    analysisData.trend.long === 'up' ? 'text-green-400' :
                    analysisData.trend.long === 'down' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {analysisData.trend.long === 'up' ? '상승' : analysisData.trend.long === 'down' ? '하락' : '중립'} ({analysisData.trend.strength_long}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* RSI·MACD 카드 */}
        <Card title="📊 모멘텀 지표 분석 (RSI / MACD)">
          <div className="space-y-4">
            {/* RSI */}
            <div className="p-4 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">RSI</span>
                <span className={`text-2xl font-bold ${
                  analysisData.rsi.zone === 'overbought' ? 'text-red-400' :
                  analysisData.rsi.zone === 'oversold' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {analysisData.rsi.value.toFixed(2)}
                </span>
              </div>
              
              {/* RSI 막대 그래프 */}
              <div className="w-full bg-slate-700 rounded-full h-4 mb-2">
                <div
                  className={`h-4 rounded-full transition-all ${
                    analysisData.rsi.zone === 'overbought' ? 'bg-red-500' :
                    analysisData.rsi.zone === 'oversold' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${analysisData.rsi.value}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-slate-500">
                <span>0</span>
                <span className={analysisData.rsi.value < 30 ? 'text-green-400 font-semibold' : ''}>30</span>
                <span className={analysisData.rsi.value > 70 ? 'text-red-400 font-semibold' : ''}>70</span>
                <span>100</span>
              </div>
              
              <div className="mt-2 text-sm">
                <span className={`font-semibold ${
                  analysisData.rsi.zone === 'overbought' ? 'text-red-400' :
                  analysisData.rsi.zone === 'oversold' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {analysisData.rsi.zone === 'overbought' ? '과매수' :
                   analysisData.rsi.zone === 'oversold' ? '과매도' : '중립'} 영역
                </span>
              </div>
            </div>

            {/* MACD */}
            <div className="p-4 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">MACD 신호</span>
                <div className="flex items-center gap-2">
                  {analysisData.macd.signal === 'golden' && (
                    <>
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">골든크로스</span>
                    </>
                  )}
                  {analysisData.macd.signal === 'death' && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
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
      </div>

      {/* 4. 패턴 감지 카드 & 5. 리스크 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 패턴 감지 카드 */}
        <Card title="🧩 패턴 감지 결과">
          <div className="space-y-4">
            {/* 상승형 패턴 */}
            {bullishPatterns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">상승형 패턴</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bullishPatterns.map((pattern, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-sm font-medium"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 하락형 패턴 */}
            {bearishPatterns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">하락형 패턴</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bearishPatterns.map((pattern, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-500/20 border border-red-500 rounded-full text-red-400 text-sm font-medium"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 중립 패턴 */}
            {neutralPatterns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-400">중립 패턴</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {neutralPatterns.map((pattern, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-full text-slate-400 text-sm font-medium"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 기술 패턴 */}
            {analysisData.patterns.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">기술 패턴</span>
                </div>
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

            {analysisData.candles.length === 0 && analysisData.patterns.length === 0 && (
              <div className="text-center text-slate-400 py-8">감지된 패턴 없음</div>
            )}
          </div>
        </Card>

        {/* 리스크 카드 */}
        <div className={`rounded-lg border-2 ${riskStyle.border} bg-slate-900 p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className={`w-5 h-5 ${riskStyle.text}`} />
            <h3 className="text-lg font-semibold text-slate-200">⚠ 변동성 & 위험도 평가</h3>
          </div>

          <div className="space-y-4">
            {/* Risk Score 도넛 차트 */}
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - riskScore / 100)}`}
                    className={riskStyle.text}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${riskStyle.text}`}>
                    {riskScore}
                  </span>
                  <span className="text-xs text-slate-400">Risk Score</span>
                </div>
              </div>
            </div>

            {/* 위험도 등급 */}
            <div className="text-center">
              <div className={`inline-block px-4 py-2 rounded-lg ${riskStyle.bg} ${riskStyle.text} font-semibold`}>
                {riskStyle.grade}
              </div>
            </div>

            {/* ATR */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ATR (Average True Range)</span>
                <span className="text-slate-200 font-semibold">{analysisData.volatility.atr.toFixed(4)}</span>
              </div>
            </div>

            {/* 위험도 설명 */}
            <div className="text-xs text-slate-400 space-y-1">
              <div>• 0-30: 안정적 - 낮은 변동성</div>
              <div>• 30-60: 보통 - 일반적인 변동성</div>
              <div>• 60-80: 위험 - 높은 변동성</div>
              <div>• 80-100: 매우 위험 - 극도의 변동성</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

