import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading, SkeletonCard } from '../components/common/Loading';
import { PriceChart } from '../components/charts/PriceChart';
import { PriceChartWithMA } from '../components/charts/PriceChartWithMA';
import { IndicatorChart } from '../components/charts/IndicatorChart';
import { RSIPanel } from '../components/charts/RSIPanel';
import { RiskScoreCard } from '../components/charts/RiskScoreCard';
import { SignalResultCard } from '../components/charts/SignalResultCard';
import { NewsSentimentPanel } from '../components/charts/NewsSentimentPanel';
import { VolatilityHeatmap } from '../components/charts/VolatilityHeatmap';
import { ReturnComparisonChart } from '../components/charts/ReturnComparisonChart';
import { VolumeAnalysisChart } from '../components/charts/VolumeAnalysisChart';
import { PatternDetection } from '../components/charts/PatternDetection';
import { BuySellZones } from '../components/charts/BuySellZones';
import { TickerInput } from '../components/common/TickerInput';
import { RecommendationCard } from '../components/charts/RecommendationCard';
import { ValueScoreCard } from '../components/charts/ValueScoreCard';
import { AdvancedIndicatorsChart } from '../components/charts/AdvancedIndicatorsChart';
import { PatternDetectionEnhanced } from '../components/charts/PatternDetectionEnhanced';
import { TickerComparison } from '../components/charts/TickerComparison';
import { NewsSentimentEnhanced } from '../components/charts/NewsSentimentEnhanced';
import { StrategyRecommendationCard } from '../components/charts/StrategyRecommendationCard';
import { etfApi, indicatorApi, analysisApi, signalApi, marketApi } from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, RefreshCw, Search } from 'lucide-react';

export const ETFAnalysis: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('VIG');
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [vigPriceData, setVigPriceData] = useState<any[]>([]);
  const [qldPriceData, setQldPriceData] = useState<any[]>([]);
  const [vigRsiData, setVigRsiData] = useState<any[]>([]);
  const [qldRsiData, setQldRsiData] = useState<any[]>([]);
  const [vigPrice, setVigPrice] = useState<any>(null);
  const [qldPrice, setQldPrice] = useState<any>(null);
  const [vigMacdData, setVigMacdData] = useState<any[]>([]);
  const [qldMacdData, setQldMacdData] = useState<any[]>([]);
  const [vigStochData, setVigStochData] = useState<any[]>([]);
  const [qldStochData, setQldStochData] = useState<any[]>([]);
  const [vigVolatility, setVigVolatility] = useState<any>(null);
  const [qldVolatility, setQldVolatility] = useState<any>(null);
  const [vigMdd, setVigMdd] = useState<any>(null);
  const [qldMdd, setQldMdd] = useState<any>(null);
  const [correlation, setCorrelation] = useState<any>(null);
  
  // 커스텀 심볼 분석 데이터
  const [customPriceData, setCustomPriceData] = useState<any[]>([]);
  const [customRsiData, setCustomRsiData] = useState<any[]>([]);
  const [customPrice, setCustomPrice] = useState<any>(null);
  const [customMacdData, setCustomMacdData] = useState<any[]>([]);
  const [customVolatility, setCustomVolatility] = useState<any>(null);
  const [customAnalysis, setCustomAnalysis] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // 새로운 분석 데이터
  const [recommendation, setRecommendation] = useState<any>(null);
  const [fundamental, setFundamental] = useState<any>(null);
  const [advancedIndicators, setAdvancedIndicators] = useState<any>(null);
  const [patterns, setPatterns] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 즐겨찾기 로드
  useEffect(() => {
    const stored = localStorage.getItem('favoriteTickers');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  }, []);
  
  const handleToggleFavorite = (symbol: string) => {
    const newFavorites = favorites.includes(symbol)
      ? favorites.filter(s => s !== symbol)
      : [...favorites, symbol];
    setFavorites(newFavorites);
    localStorage.setItem('favoriteTickers', JSON.stringify(newFavorites));
  };

  const updateData = async () => {
    try {
      setUpdating(true);
      toast.loading('데이터 수집 중...', { id: 'update-etf' });
      
      toast.success('데이터는 자동으로 수집됩니다.', { id: 'update-etf' });
      await loadData();
    } catch (error: any) {
      toast.error('데이터 수집 중 오류가 발생했습니다.', { id: 'update-etf' });
    } finally {
      setUpdating(false);
    }
  };

  const analyzeCustomSymbol = async () => {
    if (!customSymbol || customSymbol.trim() === '') {
      toast.error('티커를 입력하세요.');
      return;
    }
    
    try {
      setAnalyzing(true);
      setError(null);
      toast.loading(`${customSymbol.toUpperCase()} 분석 중...`, { id: 'analyze-custom' });
      
      const res = await analysisApi.getAnalysis(customSymbol.toUpperCase()).catch((err) => {
        console.error('커스텀 심볼 분석 실패:', err);
        return null;
      });
      
      if (res?.data) {
        const analysis = res.data;
        
        if (!analysis.success || analysis.data?.price?.error) {
          toast.error(`${customSymbol.toUpperCase()} 데이터를 찾을 수 없습니다.`, { id: 'analyze-custom' });
          setError(`${customSymbol.toUpperCase()} 데이터를 찾을 수 없습니다. 심볼을 확인하세요.`);
          setCustomAnalysis(null);
          return;
        }
        
        setCustomAnalysis(analysis);
        
        // 가격 데이터
        if (analysis.data.price && !analysis.data.price.error) {
          setCustomPrice(analysis.data.price);
        }
        
        // 히스토리 + MA 데이터
        if (analysis.data.ma200 && !analysis.data.ma200.error) {
          const ma200 = analysis.data.ma200;
          // 히스토리 데이터도 가져와서 결합
          const historyRes = await etfApi.getHistory(customSymbol.toUpperCase(), 3).catch(() => null);
          if (historyRes?.data?.data) {
            const history = historyRes.data.data;
            const combined = history.map((h: any) => {
              const maItem = ma200.data?.find((m: any) => m.date === h.date);
              return {
                date: h.date,
                price: h.close,
                ma200: maItem ? maItem.ma200 : null,
              };
            }).filter((item: any) => item.ma200 !== null);
            setCustomPriceData(combined);
          }
        }
        
        // RSI 데이터
        if (analysis.data.rsi && !analysis.data.rsi.error) {
          const rsi = analysis.data.rsi;
          setCustomRsiData(rsi.data || []);
        }
        
        // MACD 데이터
        if (analysis.data.macd && !analysis.data.macd.error) {
          const macd = analysis.data.macd;
          setCustomMacdData(macd.data || []);
        }
        
        // 변동성 데이터
        if (analysis.data.volatility && !analysis.data.volatility.error) {
          setCustomVolatility(analysis.data.volatility);
        }
        
        // 새로운 분석 데이터 로드
        const symbolUpper = customSymbol.toUpperCase();
        const [recRes, fundRes, advRes, patRes] = await Promise.all([
          analysisApi.getRecommendation(symbolUpper).catch(() => null),
          analysisApi.getFundamental(symbolUpper).catch(() => null),
          analysisApi.getAdvancedIndicators(symbolUpper).catch(() => null),
          analysisApi.getPatterns(symbolUpper).catch(() => null),
        ]);
        
        if (recRes?.data) setRecommendation(recRes.data);
        if (fundRes?.data) setFundamental(fundRes.data);
        if (advRes?.data) setAdvancedIndicators(advRes.data);
        if (patRes?.data) setPatterns(patRes.data);
        
        toast.success(`${customSymbol.toUpperCase()} 분석 완료`, { id: 'analyze-custom' });
        setSelectedSymbol('CUSTOM');
      } else {
        toast.error('분석 중 오류가 발생했습니다.', { id: 'analyze-custom' });
        setError('분석 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('커스텀 심볼 분석 오류:', error);
      toast.error('분석 중 오류가 발생했습니다.', { id: 'analyze-custom' });
      setError('분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 병렬로 모든 데이터 로드 (에러 발생 시에도 계속 진행)
      const [
        vigPriceRes, vigHistoryRes, vigMaRes, vigRsiRes, vigMacdRes, vigStochRes, vigVolRes, vigMddRes,
        qldPriceRes, qldHistoryRes, qldMaRes, qldRsiRes, qldMacdRes, qldStochRes, qldVolRes, qldMddRes,
        corrRes
      ] = await Promise.all([
        etfApi.getPrice('VIG').catch(() => null),
        etfApi.getHistory('VIG', 3).catch(() => null),
        etfApi.getMA('VIG', 200).catch(() => null),
        etfApi.getRSI('VIG').catch(() => null),
        indicatorApi.getMACD('VIG').catch(() => null),
        indicatorApi.getStochastic('VIG').catch(() => null),
        indicatorApi.getVolatility('VIG', 30).catch(() => null),
        indicatorApi.getMDD('VIG').catch(() => null),
        etfApi.getPrice('QLD').catch(() => null),
        etfApi.getHistory('QLD', 3).catch(() => null),
        etfApi.getMA('QLD', 200).catch(() => null),
        etfApi.getRSI('QLD').catch(() => null),
        indicatorApi.getMACD('QLD').catch(() => null),
        indicatorApi.getStochastic('QLD').catch(() => null),
        indicatorApi.getVolatility('QLD', 30).catch(() => null),
        indicatorApi.getMDD('QLD').catch(() => null),
        indicatorApi.getCorrelation().catch(() => null),
      ]);

      // VIG 가격 + MA 데이터 결합
      if (vigHistoryRes?.data?.data && vigMaRes?.data?.data) {
        const history = vigHistoryRes.data.data;
        const ma = vigMaRes.data.data;
        const combined = history.map((h: any) => {
          const maItem = ma.find((m: any) => m.date === h.date);
          return {
            date: h.date,
            price: h.close,
            ma200: maItem ? maItem.ma200 : null,
          };
        }).filter((item: any) => item.ma200 !== null);
        setVigPriceData(combined);
      } else if (vigHistoryRes?.data?.data) {
        setVigPriceData(vigHistoryRes.data.data.map((h: any) => ({
          date: h.date,
          price: h.close,
        })));
      }

      // QLD 가격 + MA 데이터 결합
      if (qldHistoryRes?.data?.data && qldMaRes?.data?.data) {
        const history = qldHistoryRes.data.data;
        const ma = qldMaRes.data.data;
        const combined = history.map((h: any) => {
          const maItem = ma.find((m: any) => m.date === h.date);
          return {
            date: h.date,
            price: h.close,
            ma200: maItem ? maItem.ma200 : null,
          };
        }).filter((item: any) => item.ma200 !== null);
        setQldPriceData(combined);
      } else if (qldHistoryRes?.data?.data) {
        setQldPriceData(qldHistoryRes.data.data.map((h: any) => ({
          date: h.date,
          price: h.close,
        })));
      }

      if (vigPriceRes?.data) setVigPrice(vigPriceRes.data);
      if (vigRsiRes?.data?.data) setVigRsiData(vigRsiRes.data.data || []);
      if (vigMacdRes?.data?.data) setVigMacdData(vigMacdRes.data.data || []);
      if (vigStochRes?.data?.data) setVigStochData(vigStochRes.data.data || []);
      if (vigVolRes?.data) setVigVolatility(vigVolRes.data);
      if (vigMddRes?.data) setVigMdd(vigMddRes.data);
      
      if (qldPriceRes?.data) setQldPrice(qldPriceRes.data);
      if (qldRsiRes?.data?.data) setQldRsiData(qldRsiRes.data.data || []);
      if (qldMacdRes?.data?.data) setQldMacdData(qldMacdRes.data.data || []);
      if (qldStochRes?.data?.data) setQldStochData(qldStochRes.data.data || []);
      if (qldVolRes?.data) setQldVolatility(qldVolRes.data);
      if (qldMddRes?.data) setQldMdd(qldMddRes.data);
      
      if (corrRes?.data) setCorrelation(corrRes.data);

      // 데이터가 하나도 없으면 에러 표시
      if (!vigPriceRes && !qldPriceRes) {
        setError('데이터를 가져올 수 없습니다. 잠시 후 다시 시도하세요.');
        toast.error('데이터 수집 실패: 서버에서 데이터를 가져올 수 없습니다.', { duration: 5000 });
      }

    } catch (error: any) {
      console.error('데이터 로딩 오류:', error);
      setError('데이터 로딩 중 오류가 발생했습니다.');
      toast.error('데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRsiColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-400';
    if (rsi < 30) return 'text-green-400';
    return 'text-yellow-400';
  };

  const latestVigRsi = vigRsiData.length > 0 ? vigRsiData[vigRsiData.length - 1]?.rsi : null;
  const latestQldRsi = qldRsiData.length > 0 ? qldRsiData[qldRsiData.length - 1]?.rsi : null;
  const latestCustomRsi = customRsiData.length > 0 ? customRsiData[customRsiData.length - 1]?.rsi : null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 티커 입력 UI */}
      <Card title="티커 분석">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  analyzeCustomSymbol();
                }
              }}
              placeholder="티커 입력 (예: AAPL, TSLA, MSFT)"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-light-blue"
            />
          </div>
          <button
            onClick={analyzeCustomSymbol}
            disabled={analyzing || !customSymbol.trim()}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
              analyzing || !customSymbol.trim()
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-light-blue text-deep-navy hover:bg-blue-400'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{analyzing ? '분석 중...' : '분석'}</span>
          </button>
        </div>
        {error && customSymbol && (
          <div className="mt-4 text-red-400 text-sm">{error}</div>
        )}
      </Card>

      {/* 데이터 수집 버튼 */}
      <Card title="데이터 관리">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            데이터는 자동으로 Yahoo Finance에서 수집됩니다.
          </div>
          <button
            onClick={updateData}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              updating
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-light-blue text-deep-navy hover:bg-blue-400'
            }`}
            title="데이터 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>
      </Card>

      {error && !customSymbol && (
        <Card title="오류" className="border-red-400 bg-red-900/20">
          <div className="text-red-400">{error}</div>
        </Card>
      )}

      {/* 커스텀 심볼 분석 결과 */}
      {selectedSymbol === 'CUSTOM' && customAnalysis && (
        <>
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
                currentPrice={customPrice?.close || customPrice?.price}
              />
              
              {/* 전략 추천 카드 */}
              <StrategyRecommendationCard
                strategy={recommendation.strategy}
                trend={
                  recommendation.components?.trend > 0 ? 'up' :
                  recommendation.components?.trend < 0 ? 'down' :
                  'neutral'
                }
                rsi={customRsiData.length > 0 ? customRsiData[customRsiData.length - 1]?.rsi || 50 : 50}
                riskScore={customVolatility?.risk_score || 50}
                volatility={customVolatility?.volatility || 0}
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
          
          <Card title={`${customSymbol.toUpperCase()} 현재 가격`}>
            {customPrice ? (
              <div>
                <div className="text-4xl font-bold mb-2">${customPrice.close?.toFixed(2) || 'N/A'}</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-400">고가: ${customPrice.high?.toFixed(2) || 'N/A'}</span>
                  <span className="text-slate-400">저가: ${customPrice.low?.toFixed(2) || 'N/A'}</span>
                  <span className="text-slate-400">거래량: {customPrice.volume?.toLocaleString() || 'N/A'}</span>
                </div>
                {latestCustomRsi && (
                  <div className="mt-4">
                    <div className="text-sm text-slate-400 mb-1">RSI (14)</div>
                    <div className={`text-2xl font-bold ${getRsiColor(latestCustomRsi)}`}>
                      {latestCustomRsi.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400">데이터 없음</div>
            )}
          </Card>

          {customPriceData.length > 0 && (
            <Card title={`${customSymbol.toUpperCase()} 가격 추세 + MA`}>
              <PriceChart data={customPriceData} symbol={customSymbol.toUpperCase()} />
            </Card>
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
                priceData={customPriceData}
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

          {customRsiData.length > 0 && (
            <Card title={`${customSymbol.toUpperCase()} RSI 트렌드`}>
              <IndicatorChart rsiData={customRsiData} />
            </Card>
          )}

          {customVolatility && (
            <Card title={`${customSymbol.toUpperCase()} 변동성 분석`}>
              <div>
                <div className="text-sm text-slate-400 mb-2">최근 30일 변동성</div>
                <div className="text-2xl font-bold">
                  {customVolatility.volatility?.toFixed(2) || 'N/A'}%
                </div>
              </div>
            </Card>
          )}
          
          {/* 뉴스 감성 고도화 */}
          {customAnalysis?.data?.news && (
            <Card title="뉴스 감성 분석">
              <NewsSentimentEnhanced
                articles={customAnalysis.data.news.articles || []}
              />
            </Card>
          )}
          
          {/* 티커 비교 */}
          <Card title="티커 비교">
            <TickerComparison
              onCompare={async (symbols, period) => {
                try {
                  const res = await analysisApi.compareTickers(symbols, period);
                  if (res?.data) {
                    // 비교 결과를 상태에 저장하거나 표시
                    console.log('비교 결과:', res.data);
                    toast.success('티커 비교 완료');
                  }
                } catch (err) {
                  console.error('비교 오류:', err);
                  toast.error('티커 비교 중 오류가 발생했습니다.');
                }
              }}
            />
          </Card>
        </>
      )}

      {/* 상단 가격 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="VIG 현재 가격">
          {vigPrice ? (
            <div>
              <div className="text-4xl font-bold mb-2">${vigPrice.close.toFixed(2)}</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">고가: ${vigPrice.high.toFixed(2)}</span>
                <span className="text-slate-400">저가: ${vigPrice.low.toFixed(2)}</span>
                <span className="text-slate-400">거래량: {vigPrice.volume.toLocaleString()}</span>
              </div>
              {latestVigRsi && (
                <div className="mt-4">
                  <div className="text-sm text-slate-400 mb-1">RSI (14)</div>
                  <div className={`text-2xl font-bold ${getRsiColor(latestVigRsi)}`}>
                    {latestVigRsi.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400">데이터 없음</div>
          )}
        </Card>

        <Card title="QLD 현재 가격">
          {qldPrice ? (
            <div>
              <div className="text-4xl font-bold mb-2">${qldPrice.close.toFixed(2)}</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">고가: ${qldPrice.high.toFixed(2)}</span>
                <span className="text-slate-400">저가: ${qldPrice.low.toFixed(2)}</span>
                <span className="text-slate-400">거래량: {qldPrice.volume.toLocaleString()}</span>
              </div>
              {latestQldRsi && (
                <div className="mt-4">
                  <div className="text-sm text-slate-400 mb-1">RSI (14)</div>
                  <div className={`text-2xl font-bold ${getRsiColor(latestQldRsi)}`}>
                    {latestQldRsi.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400">데이터 없음</div>
          )}
        </Card>
      </div>

      {/* 가격 추세 차트 */}
      <Card title="VIG/QLD 가격 추세 + MA 비교">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vigPriceData.length > 0 ? (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-light-blue">VIG</h4>
              <PriceChart data={vigPriceData} symbol="VIG" />
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">데이터를 불러올 수 없습니다.</div>
          )}
          
          {qldPriceData.length > 0 ? (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-light-blue">QLD</h4>
              <PriceChart data={qldPriceData} symbol="QLD" />
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">데이터를 불러올 수 없습니다.</div>
          )}
        </div>
      </Card>

      {/* RSI 트렌드 */}
      <Card title="RSI 트렌드">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vigRsiData.length > 0 ? (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-light-blue">VIG RSI</h4>
              <IndicatorChart rsiData={vigRsiData} />
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">데이터를 불러올 수 없습니다.</div>
          )}
          
          {qldRsiData.length > 0 ? (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-light-blue">QLD RSI</h4>
              <IndicatorChart rsiData={qldRsiData} />
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">데이터를 불러올 수 없습니다.</div>
          )}
        </div>
      </Card>

      {/* 변동성 분석 */}
      <Card title="변동성 분석" tooltip="최근 30일 기준 변동성 계산">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-4 text-light-blue">VIG</h4>
            {vigVolatility ? (
              <div>
                <div className="text-sm text-slate-400 mb-2">최근 30일 변동성</div>
                <div className="text-2xl font-bold">
                  {vigVolatility.volatility?.toFixed(2) || 'N/A'}%
                </div>
              </div>
            ) : (
              <div className="text-slate-400">데이터 없음</div>
            )}
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-light-blue">QLD</h4>
            {qldVolatility ? (
              <div>
                <div className="text-sm text-slate-400 mb-2">최근 30일 변동성</div>
                <div className="text-2xl font-bold">
                  {qldVolatility.volatility?.toFixed(2) || 'N/A'}%
                </div>
              </div>
            ) : (
              <div className="text-slate-400">데이터 없음</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
