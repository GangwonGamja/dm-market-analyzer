import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading, SkeletonCard } from '../components/common/Loading';
import { PriceChartWithMA } from '../components/charts/PriceChartWithMA';
import { RSIPanel } from '../components/charts/RSIPanel';
import { RiskScoreCard } from '../components/charts/RiskScoreCard';
import { SignalResultCard } from '../components/charts/SignalResultCard';
import { NewsSentimentPanel } from '../components/charts/NewsSentimentPanel';
import { RecommendationCard } from '../components/charts/RecommendationCard';
import { ValueScoreCard } from '../components/charts/ValueScoreCard';
import { AdvancedIndicatorsChart } from '../components/charts/AdvancedIndicatorsChart';
import { PatternDetectionEnhanced } from '../components/charts/PatternDetectionEnhanced';
import { NewsSentimentEnhanced } from '../components/charts/NewsSentimentEnhanced';
import { StrategyRecommendationCard } from '../components/charts/StrategyRecommendationCard';
import { EnhancedAnalysisCard } from '../components/charts/EnhancedAnalysisCard';
import { InsightCard } from '../components/dashboard/InsightCard';
import { AnalysisSummaryCards } from '../components/dashboard/AnalysisSummaryCards';
import { marketApi, etfApi, signalApi, indicatorApi, newsApi, analysisApi } from '../services/api';
import { AnalysisResponse } from '../types/analysis';
import toast from 'react-hot-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('VIG');
  const [customSymbol, setCustomSymbol] = useState<string>('');
  
  // 가격 & MA 데이터
  const [priceData, setPriceData] = useState<any[]>([]);
  const [ma20Data, setMa20Data] = useState<any[]>([]);
  const [ma50Data, setMa50Data] = useState<any[]>([]);
  const [ma60Data, setMa60Data] = useState<any[]>([]);
  const [ma200Data, setMa200Data] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<any>(null);
  
  // RSI & Divergence
  const [rsiData, setRsiData] = useState<any[]>([]);
  const [divergence, setDivergence] = useState<'bullish' | 'bearish' | 'none'>('none');
  
  // 골든/데드크로스
  const [crossData, setCrossData] = useState<any>(null);
  
  // Risk Score
  const [riskScore, setRiskScore] = useState<number>(50);
  const [riskGrade, setRiskGrade] = useState<'Low' | 'Medium' | 'High'>('Medium');
  
  // 시그널 결과
  const [signalResult, setSignalResult] = useState<any>(null);
  
  // 뉴스 & FGI
  const [newsData, setNewsData] = useState<any[]>([]);
  const [fgiData, setFgiData] = useState<any>(null);
  
  // 새로운 분석 데이터
  const [recommendation, setRecommendation] = useState<any>(null);
  const [fundamental, setFundamental] = useState<any>(null);
  const [advancedIndicators, setAdvancedIndicators] = useState<any>(null);
  const [patterns, setPatterns] = useState<any>(null);
  
  // 확장된 분석 데이터
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null);
  
  // /analysis/{ticker} 응답 데이터 (새로운 구조)
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [crossSignals, setCrossSignals] = useState<{
    ma50_ma200: "golden" | "death" | "none";
    ma20_ma60: "golden" | "death" | "none";
  } | null>(null);
  const [trendData, setTrendData] = useState<{
    short: "up" | "down" | "neutral";
    long: "up" | "down" | "neutral";
    strength_short: number;
    strength_long: number;
  } | null>(null);
  const [rsiInfo, setRsiInfo] = useState<{
    value: number;
    zone: "overbought" | "oversold" | "neutral";
  } | null>(null);
  const [macdInfo, setMacdInfo] = useState<{
    signal: "golden" | "death" | "neutral";
  } | null>(null);
  const [volatilityInfo, setVolatilityInfo] = useState<{
    atr: number;
    risk_score: number;
  } | null>(null);
  const [candlePatterns, setCandlePatterns] = useState<string[]>([]);
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);
  const [summaryReasons, setSummaryReasons] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSymbol = async (targetSymbol: string) => {
    try {
      setLoading(true);
      setError(null);
      targetSymbol = targetSymbol.toUpperCase();
      
      // 1. /analysis/{ticker} 엔드포인트로 모든 분석 데이터 가져오기
      const analysisRes = await analysisApi.getAnalysis(targetSymbol).catch((err) => {
        console.error(`[ERROR] /analysis/${targetSymbol} 호출 실패:`, err);
        return null;
      });
      
      if (analysisRes?.data) {
        const analysis: AnalysisResponse = analysisRes.data;
        setAnalysisData(analysis);
        
        // 모든 데이터를 console.log로 출력
        console.log('=== /analysis/{ticker} 응답 데이터 ===');
        console.log('전체 응답:', analysis);
        console.log('MA 데이터:', analysis.ma);
        console.log('크로스 신호:', analysis.cross);
        console.log('추세 데이터:', analysis.trend);
        console.log('RSI 정보:', analysis.rsi);
        console.log('MACD 정보:', analysis.macd);
        console.log('변동성 정보:', analysis.volatility);
        console.log('캔들 패턴:', analysis.candles);
        console.log('감지된 패턴:', analysis.patterns);
        console.log('요약 근거:', analysis.summary);
        console.log('=====================================');
        
        // State 업데이트
        // MA 데이터
        setMa20Data(analysis.ma[20] || []);
        setMa50Data(analysis.ma[50] || []);
        setMa200Data(analysis.ma[200] || []);
        
        // 크로스 신호
        setCrossSignals(analysis.cross);
        setCrossData({
          golden_cross: analysis.cross.ma50_ma200 === "golden" || analysis.cross.ma20_ma60 === "golden",
          death_cross: analysis.cross.ma50_ma200 === "death" || analysis.cross.ma20_ma60 === "death"
        });
        
        // 추세 데이터
        setTrendData(analysis.trend);
        
        // RSI 정보
        setRsiInfo(analysis.rsi);
        // RSI 데이터 배열 생성 (차트용)
        if (analysis.ma[20] && analysis.ma[20].length > 0) {
          const rsiDataArray = analysis.ma[20].map((ma: any, idx: number) => ({
            date: ma.date,
            rsi: analysis.rsi.value,
            price: ma.price
          }));
          setRsiData(rsiDataArray);
        }
        
        // MACD 정보
        setMacdInfo(analysis.macd);
        
        // 변동성 정보
        setVolatilityInfo(analysis.volatility);
        setRiskScore(analysis.volatility.risk_score || 50);
        // Risk Grade 계산
        const riskScoreValue = analysis.volatility.risk_score || 50;
        if (riskScoreValue <= 30) {
          setRiskGrade('Low');
        } else if (riskScoreValue <= 70) {
          setRiskGrade('Medium');
        } else {
          setRiskGrade('High');
        }
        
        // 캔들 패턴
        setCandlePatterns(analysis.candles || []);
        
        // 감지된 패턴
        setDetectedPatterns(analysis.patterns || []);
        
        // 요약 근거
        setSummaryReasons(analysis.summary || []);
      }
      
      // 기존 API 호출도 유지 (하위 호환성 및 추가 데이터)
      const [
        priceRes, historyRes, ma20Res, ma60Res, ma200Res, rsiRes,
        crossRes, divergenceRes, riskRes, newsRes, fgiRes
      ] = await Promise.all([
        etfApi.getPrice(targetSymbol).catch(() => null),
        etfApi.getHistory(targetSymbol, 3).catch(() => null),
        etfApi.getMA(targetSymbol, 20).catch(() => null),
        etfApi.getMA(targetSymbol, 60).catch(() => null),
        etfApi.getMA(targetSymbol, 200).catch(() => null),
        etfApi.getRSI(targetSymbol).catch(() => null),
        indicatorApi.getGoldenDeathCross(targetSymbol).catch(() => null),
        indicatorApi.getDivergence(targetSymbol).catch(() => null),
        indicatorApi.getRiskScore(targetSymbol).catch(() => null),
        newsApi.getAll(targetSymbol, 10).catch(() => null),
        marketApi.getFgi().catch(() => null),
      ]);

      // 가격 데이터
      if (priceRes?.data) {
        setCurrentPrice(priceRes.data);
      }

      // 히스토리 데이터
      if (historyRes?.data?.data) {
        setPriceData(historyRes.data.data);
      }

      // MA 데이터 (기존 API가 있으면 덮어쓰기)
      if (ma20Res?.data?.data) setMa20Data(ma20Res.data.data);
      if (ma60Res?.data?.data) setMa60Data(ma60Res.data.data);
      if (ma200Res?.data?.data) setMa200Data(ma200Res.data.data);
      
      // MA50 데이터가 없으면 analysis API에서 가져온 데이터 사용
      if (!ma50Data || ma50Data.length === 0) {
        // 이미 analysis API에서 설정됨
      }

      // RSI 데이터
      if (rsiRes?.data?.data) {
        setRsiData(rsiRes.data.data);
      }

      // 골든/데드크로스
      if (crossRes?.data) {
        setCrossData(crossRes.data);
      }

      // Divergence
      if (divergenceRes?.data) {
        setDivergence(divergenceRes.data.divergence || 'none');
      }

      // Risk Score
      if (riskRes?.data) {
        setRiskScore(riskRes.data.risk_score || 50);
        setRiskGrade(riskRes.data.risk_grade || 'Medium');
      }

      // 뉴스
      if (newsRes?.data?.articles) {
        setNewsData(newsRes.data.articles);
      }

      // FGI
      if (fgiRes?.data) {
        const fgi = fgiRes.data;
        if (fgi.success || fgi.score !== null) {
          setFgiData({
            score: fgi.score,
            rating: fgi.rating || fgi.classification,
          });
        }
      }

      // 확장된 시그널 계산
      if (currentPrice && ma200Res?.data?.data && rsiRes?.data?.data && fgiRes?.data) {
        const latestMA200 = ma200Res.data.data[ma200Res.data.data.length - 1];
        const latestRSI = rsiRes.data.data[rsiRes.data.data.length - 1];
        const fgi = fgiRes.data;
        
        const priceValue = typeof currentPrice === 'object' 
          ? (currentPrice.close || currentPrice.price || currentPrice.current_price || 0)
          : currentPrice;
        
        const signalRes = await signalApi.getSwitchingSignalVtoG(
          priceValue,
          latestMA200.ma200,
          latestRSI.rsi,
          fgi.score || 50,
          targetSymbol
        ).catch(() => null);

        if (signalRes?.data) {
          setSignalResult(signalRes.data);
        }
      }
      
      // 새로운 분석 데이터 로드
      const [recRes, fundRes, advRes, patRes, enhancedRes] = await Promise.all([
        analysisApi.getRecommendation(targetSymbol).catch(() => null),
        analysisApi.getFundamental(targetSymbol).catch(() => null),
        analysisApi.getAdvancedIndicators(targetSymbol).catch(() => null),
        analysisApi.getPatterns(targetSymbol).catch(() => null),
        analysisApi.getEnhancedAnalysis(targetSymbol).catch(() => null),
      ]);
      
      if (recRes?.data) setRecommendation(recRes.data);
      if (fundRes?.data) setFundamental(fundRes.data);
      if (advRes?.data) setAdvancedIndicators(advRes.data);
      if (patRes?.data) setPatterns(patRes.data);
      if (enhancedRes?.data) setEnhancedAnalysis(enhancedRes.data);

      // 데이터 검증
      if (!analysisRes && !priceRes && !historyRes) {
        setError(`${targetSymbol} 데이터를 찾을 수 없습니다.`);
        toast.error(`${targetSymbol} 데이터를 찾을 수 없습니다.`);
      } else if (analysisRes?.data) {
        // 분석 데이터가 성공적으로 로드된 경우
        console.log(`[SUCCESS] ${targetSymbol} 분석 데이터 로드 완료`);
      }

    } catch (error: any) {
      console.error('[ERROR] 분석 오류:', error);
      setError('분석 중 오류가 발생했습니다.');
      toast.error('분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    if (customSymbol.trim()) {
      setSymbol(customSymbol.toUpperCase());
      analyzeSymbol(customSymbol);
    }
  };

  useEffect(() => {
    analyzeSymbol(symbol);
  }, [symbol]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 티커 입력 영역 */}
      <Card title="티커 분석">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSymbol('VIG')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                symbol === 'VIG'
                  ? 'bg-light-blue text-deep-navy'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              VIG
            </button>
            <button
              onClick={() => setSymbol('QLD')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                symbol === 'QLD'
                  ? 'bg-light-blue text-deep-navy'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              QLD
            </button>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAnalyze();
                }
              }}
              placeholder="티커 입력 (예: AAPL, TSLA, NVDA)"
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-light-blue"
            />
            <button
              onClick={handleAnalyze}
              disabled={!customSymbol.trim()}
              className="px-6 py-2 bg-light-blue text-deep-navy rounded-lg font-semibold hover:bg-blue-400 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              분석하기
            </button>
          </div>
          <button
            onClick={() => analyzeSymbol(symbol)}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </Card>

      {/* 분석 데이터 요약 카드 (재설계된 UI) */}
      {analysisData && (
        <AnalysisSummaryCards
          analysisData={analysisData}
          confidence={signalResult?.confidence ? Math.round(signalResult.confidence * 100) : 75}
          recommendation={
            recommendation?.recommendation || 
            (signalResult?.signal === 'buy' ? 'Buy' : 
             signalResult?.signal === 'sell' ? 'Sell' : 'Hold')
          }
        />
      )}

      {/* 블록 1: 현재 가격 & MA(20/50/60/200) */}
      <Card title={`${symbol} 가격 & 이동평균선`}>
        {priceData.length > 0 ? (
          <PriceChartWithMA
            data={priceData}
            symbol={symbol}
            ma20Data={ma20Data}
            ma60Data={ma60Data}
            ma200Data={ma200Data}
            goldenCross={crossData?.golden_cross || crossSignals?.ma50_ma200 === "golden" || crossSignals?.ma20_ma60 === "golden" || false}
            deathCross={crossData?.death_cross || crossSignals?.ma50_ma200 === "death" || crossSignals?.ma20_ma60 === "death" || false}
          />
        ) : (
          <div className="text-slate-400 text-center py-8">데이터를 불러올 수 없습니다.</div>
        )}
      </Card>

      {/* 블록 2: RSI 패널 */}
      <Card title={`${symbol} RSI 분석`}>
        {(rsiData.length > 0 || rsiInfo) ? (
          <RSIPanel
            rsiData={rsiData.length > 0 ? rsiData : (rsiInfo ? [{
              date: new Date().toISOString().split('T')[0],
              rsi: rsiInfo.value,
              price: 0
            }] : [])}
            divergence={divergence}
          />
        ) : (
          <div className="text-slate-400 text-center py-8">데이터를 불러올 수 없습니다.</div>
        )}
      </Card>

      {/* InsightCard: 종합 인사이트 카드 */}
      {analysisData && (
        <InsightCard
          analysisData={analysisData}
          confidence={signalResult?.confidence ? Math.round(signalResult.confidence * 100) : 75}
          recommendation={
            recommendation?.recommendation || 
            (signalResult?.signal === 'buy' ? 'Buy' : 
             signalResult?.signal === 'sell' ? 'Sell' : 'Hold')
          }
        />
      )}

      {/* 확장된 종합 분석 카드 */}
      {enhancedAnalysis?.data && (
        <EnhancedAnalysisCard
          comprehensiveOpinion={enhancedAnalysis.data.comprehensive_opinion}
          trend={enhancedAnalysis.data.trend}
          crosses={enhancedAnalysis.data.crosses}
          candlestickPatterns={enhancedAnalysis.data.candlestick_patterns}
          technicalPatterns={enhancedAnalysis.data.technical_patterns}
          volatilityTiming={enhancedAnalysis.data.volatility_timing}
          obv={enhancedAnalysis.data.obv}
          riskScore={riskScore}
          riskGrade={riskGrade}
        />
      )}

      {/* 분석 근거 카드 */}
      {summaryReasons.length > 0 && (
        <Card title="매수/매도 근거">
          <div className="space-y-2">
            {summaryReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-slate-900 rounded">
                <span className="text-green-400 mt-1">•</span>
                <span className="text-sm text-slate-300">{reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 패턴 정보 카드 */}
      {(candlePatterns.length > 0 || detectedPatterns.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candlePatterns.length > 0 && (
            <Card title="캔들 패턴">
              <div className="flex flex-wrap gap-2">
                {candlePatterns.map((pattern, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-500/20 border border-blue-500 rounded-full text-blue-400 text-sm">
                    {pattern}
                  </span>
                ))}
              </div>
            </Card>
          )}
          {detectedPatterns.length > 0 && (
            <Card title="감지된 기술 패턴">
              <div className="flex flex-wrap gap-2">
                {detectedPatterns.map((pattern, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-500/20 border border-purple-500 rounded-full text-purple-400 text-sm">
                    {pattern}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 블록 3 & 4: Risk Score & 시그널 결과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="변동성 (Risk Score)">
          <RiskScoreCard
            riskScore={volatilityInfo?.risk_score || riskScore}
            riskGrade={riskGrade}
          />
          {volatilityInfo && (
            <div className="mt-4 text-sm text-slate-400">
              <div>ATR: {volatilityInfo.atr}</div>
              <div>Risk Score: {volatilityInfo.risk_score}</div>
            </div>
          )}
        </Card>

        <Card title="시그널 결과">
          {signalResult ? (
            <SignalResultCard
              signal={signalResult.signal}
              confidence={signalResult.confidence}
              reasons={signalResult.reason ? signalResult.reason.split('; ').filter((r: string) => r.trim()) : []}
              goldenCross={signalResult.golden_cross}
              deathCross={signalResult.death_cross}
              divergence={signalResult.divergence}
              riskScore={signalResult.risk_score}
              riskGrade={signalResult.risk_grade}
            />
          ) : (
            <div className="text-slate-400 text-center py-8">시그널 데이터를 불러올 수 없습니다.</div>
          )}
        </Card>
      </div>

      {/* 투자 의견 카드 */}
      {recommendation && (
        <>
          <RecommendationCard
            recommendation={recommendation.recommendation}
            confidence={recommendation.confidence}
            opinionScore={recommendation.opinion_score}
            reasons={recommendation.reasons || { positive: [], negative: [], neutral: [] }}
            strategy={recommendation.strategy}
            targetPrice={recommendation.target_price}
            stopLoss={recommendation.stop_loss}
            rewardRiskRatio={recommendation.reward_risk_ratio}
            currentPrice={currentPrice?.close || currentPrice?.price || currentPrice?.current_price}
          />
          
          {/* 전략 추천 카드 */}
          <StrategyRecommendationCard
            strategy={recommendation.strategy}
            trend={
              recommendation.components?.trend > 0 ? 'up' :
              recommendation.components?.trend < 0 ? 'down' :
              'neutral'
            }
            rsi={rsiData.length > 0 ? rsiData[rsiData.length - 1]?.rsi || 50 : 50}
            riskScore={riskScore}
            volatility={0} // TODO: volatility 데이터 추가
            recommendation={recommendation.recommendation}
          />
        </>
      )}

      {/* Value Score 카드 */}
      {fundamental && (
        <ValueScoreCard
          valueScore={fundamental.value_score}
          valueGrade={fundamental.value_grade}
          per={fundamental.per}
          pbr={fundamental.pbr}
          peg={fundamental.peg}
          revenueGrowth={fundamental.revenue_growth}
          epsGrowth={fundamental.eps_growth}
          factors={fundamental.factors || []}
        />
      )}

      {/* 고급 기술지표 */}
      {advancedIndicators && (
        <Card title="고급 기술지표">
          <AdvancedIndicatorsChart
            cciData={advancedIndicators.cci}
            adxData={advancedIndicators.adx}
            obvData={advancedIndicators.obv}
            bbData={advancedIndicators.bollinger_bands}
            vwapData={advancedIndicators.vwap}
            priceData={priceData}
          />
        </Card>
      )}

      {/* 패턴 탐지 */}
      {patterns && (
        <Card title="패턴 탐지">
          <PatternDetectionEnhanced
            patterns={patterns.patterns || []}
            spikeDays={patterns.spike_days || []}
            bollingerBreakout={patterns.bollinger_breakout}
          />
        </Card>
      )}

      {/* 블록 5: 뉴스 & 심리 데이터 */}
      <Card title="뉴스 & 시장 심리">
        {newsData.length > 0 ? (
          <NewsSentimentEnhanced articles={newsData} />
        ) : (
          <NewsSentimentPanel
            news={newsData}
            fgi={fgiData}
          />
        )}
      </Card>
    </div>
  );
};
