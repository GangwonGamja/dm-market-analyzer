import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading, SkeletonCard } from '../components/common/Loading';
import { SignalResultCard } from '../components/charts/SignalResultCard';
import { PriceChart } from '../components/charts/PriceChart';
import { ReturnComparisonChart } from '../components/charts/ReturnComparisonChart';
import { SignalHistoryChart } from '../components/charts/SignalHistoryChart';
import { signalApi, marketApi, etfApi, indicatorApi } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowRight, Info, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Shield, Zap } from 'lucide-react';

export const SwitchingSignal: React.FC = () => {
  const [currentETF, setCurrentETF] = useState<string>('VIG');
  const [targetETF, setTargetETF] = useState<string>('QLD');
  const [signal, setSignal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 시장 상태 데이터
  const [rsi, setRsi] = useState<number | null>(null);
  const [ma200, setMa200] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [goldenCross, setGoldenCross] = useState<boolean>(false);
  const [deathCross, setDeathCross] = useState<boolean>(false);
  const [divergence, setDivergence] = useState<'bullish' | 'bearish' | 'none'>('none');
  const [riskScore, setRiskScore] = useState<number>(50);
  const [riskGrade, setRiskGrade] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [fgi, setFgi] = useState<number>(50);

  // 비교 차트 데이터
  const [currentPriceData, setCurrentPriceData] = useState<any[]>([]);
  const [targetPriceData, setTargetPriceData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y'>('3M');
  
  // 시그널 히스토리 (최근 12개월)
  const [signalHistory, setSignalHistory] = useState<any[]>([]);

  const loadSignal = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 모든 데이터 병렬 로드
      const [
        currentPriceRes, currentMa200Res, currentRsiRes,
        currentCrossRes, currentDivergenceRes, currentRiskRes,
        targetPriceRes, targetHistoryRes, currentHistoryRes,
        fgiRes
      ] = await Promise.all([
        etfApi.getPrice(currentETF).catch(() => null),
        etfApi.getMA(currentETF, 200).catch(() => null),
        etfApi.getRSI(currentETF).catch(() => null),
        indicatorApi.getGoldenDeathCross(currentETF).catch(() => null),
        indicatorApi.getDivergence(currentETF).catch(() => null),
        indicatorApi.getRiskScore(currentETF).catch(() => null),
        etfApi.getPrice(targetETF).catch(() => null),
        etfApi.getHistory(targetETF, 3).catch(() => null),
        etfApi.getHistory(currentETF, 3).catch(() => null),
        marketApi.getFgi().catch(() => null),
      ]);

      // 현재 ETF 데이터
      if (currentPriceRes?.data) {
        setCurrentPrice(currentPriceRes.data.close || currentPriceRes.data.price);
      }

      if (currentMa200Res?.data?.data && currentMa200Res.data.data.length > 0) {
        const latestMA = currentMa200Res.data.data[currentMa200Res.data.data.length - 1];
        setMa200(latestMA.ma200);
      }

      if (currentRsiRes?.data?.data && currentRsiRes.data.data.length > 0) {
        const latestRSI = currentRsiRes.data.data[currentRsiRes.data.data.length - 1];
        setRsi(latestRSI.rsi);
      }

      if (currentCrossRes?.data) {
        setGoldenCross(currentCrossRes.data.golden_cross || false);
        setDeathCross(currentCrossRes.data.death_cross || false);
      }

      if (currentDivergenceRes?.data) {
        setDivergence(currentDivergenceRes.data.divergence || 'none');
      }

      if (currentRiskRes?.data) {
        setRiskScore(currentRiskRes.data.risk_score || 50);
        setRiskGrade(currentRiskRes.data.risk_grade || 'Medium');
      }

      // FGI
      if (fgiRes?.data) {
        const fgiData = fgiRes.data;
        if (fgiData.success || fgiData.score !== null) {
          setFgi(fgiData.score || 50);
        }
      }

      // 확장된 시그널 계산
      if (currentPrice !== null && ma200 !== null && rsi !== null) {
        const signalRes = currentETF === 'VIG'
          ? await signalApi.getSwitchingSignalVtoG(currentPrice, ma200, rsi, fgi, currentETF).catch(() => null)
          : await signalApi.getSwitchingSignalGtoV(currentPrice, ma200, rsi, fgi, currentETF).catch(() => null);

        if (signalRes?.data) {
          setSignal(signalRes.data);
          // 시그널 히스토리에 추가 (간단한 구현)
          const newHistory = [
            ...signalHistory,
            {
              date: new Date().toISOString().split('T')[0],
              signal: signalRes.data.signal,
              confidence: signalRes.data.confidence,
            }
          ].slice(-12); // 최근 12개만 유지
          setSignalHistory(newHistory);
        }
      }

      // 비교 차트 데이터
      if (currentHistoryRes?.data?.data) {
        setCurrentPriceData(currentHistoryRes.data.data.map((h: any) => ({
          date: h.date,
          price: h.close,
        })));
      }

      if (targetHistoryRes?.data?.data) {
        setTargetPriceData(targetHistoryRes.data.data.map((h: any) => ({
          date: h.date,
          price: h.close,
        })));
      }

    } catch (error: any) {
      console.error('시그널 로딩 오류:', error);
      setError('시그널 생성 중 오류가 발생했습니다.');
      toast.error('시그널 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateData = async () => {
    try {
      setUpdating(true);
      toast.loading('데이터 새로고침 중...', { id: 'update' });
      await loadSignal();
      toast.success('데이터 새로고침 완료', { id: 'update' });
    } catch (error: any) {
      toast.error('데이터 새로고침 중 오류가 발생했습니다.', { id: 'update' });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadSignal();
  }, [currentETF, targetETF]);

  const getSignalText = () => {
    if (!signal) return '분석 중...';
    
    // 개별 종목 모드 (VIG/QLD가 아닌 경우)
    if (signal.switch_mode === false) {
      if (signal.signal === 'buy') return '매수 권장';
      if (signal.signal === 'sell') return '매도/중립 권장';
      return '중립';
    }
    
    // 스위칭 모드 (VIG/QLD)
    if (signal.signal === 'buy') {
      return currentETF === 'VIG' ? 'VIG 유지 권장' : 'QLD 유지 권장';
    }
    if (signal.signal === 'sell') {
      return currentETF === 'VIG' ? 'VIG → QLD 전환 권장' : 'QLD → VIG 전환 권장';
    }
    return '현재 포지션 유지';
  };

  // VIG/QLD 스위칭 모드 여부 확인
  const isSwitchingMode = signal?.switch_mode !== false && (currentETF === 'VIG' || currentETF === 'QLD');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 현재 보유 ETF 선택 */}
      <Card title={isSwitchingMode ? "스위칭 분석 설정" : "단일 종목 분석 설정"}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-2">현재 보유</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentETF('VIG')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    currentETF === 'VIG'
                      ? 'bg-light-blue text-deep-navy'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  VIG
                </button>
                <button
                  onClick={() => setCurrentETF('QLD')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    currentETF === 'QLD'
                      ? 'bg-light-blue text-deep-navy'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  QLD
                </button>
              </div>
            </div>
            {isSwitchingMode && (
              <div>
                <div className="text-sm text-slate-400 mb-2">전환 대상</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTargetETF('VIG')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      targetETF === 'VIG'
                        ? 'bg-light-blue text-deep-navy'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    VIG
                  </button>
                  <button
                    onClick={() => setTargetETF('QLD')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      targetETF === 'QLD'
                        ? 'bg-light-blue text-deep-navy'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    QLD
                  </button>
                </div>
              </div>
            )}
            {!isSwitchingMode && signal?.message && (
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-300">{signal.message}</div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={updateData}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              updating
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-light-blue text-deep-navy hover:bg-blue-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>
      </Card>

      {error && (
        <Card title="오류" className="border-red-400 bg-red-900/20">
          <div className="text-red-400">{error}</div>
        </Card>
      )}

      {/* 좌측: 시장 상태 요약 & 우측: 스위칭 판단 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 현재 시장 상태 요약 */}
        <Card title="현재 시장 상태 요약">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">RSI</div>
                <div className={`text-2xl font-bold ${
                  rsi && rsi > 70 ? 'text-red-400' :
                  rsi && rsi < 30 ? 'text-green-400' :
                  'text-yellow-400'
                }`}>
                  {rsi ? rsi.toFixed(1) : 'N/A'}
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">MA200 위치</div>
                <div className={`text-lg font-bold flex items-center gap-2 ${
                  currentPrice && ma200
                    ? currentPrice > ma200 ? 'text-green-400' : 'text-red-400'
                    : 'text-slate-400'
                }`}>
                  {currentPrice && ma200 ? (
                    <>
                      {currentPrice > ma200 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      {currentPrice > ma200 ? '상회' : '하회'}
                    </>
                  ) : 'N/A'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">크로스</div>
                <div className="flex gap-2">
                  {goldenCross && (
                    <div className="px-2 py-1 bg-green-500/20 border border-green-500 rounded text-green-400 text-xs">
                      ✨ Golden
                    </div>
                  )}
                  {deathCross && (
                    <div className="px-2 py-1 bg-red-500/20 border border-red-500 rounded text-red-400 text-xs">
                      ⚠️ Death
                    </div>
                  )}
                  {!goldenCross && !deathCross && (
                    <div className="text-slate-400 text-sm">없음</div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Divergence</div>
                <div className="flex items-center gap-2">
                  {divergence === 'bullish' && (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      상승
                    </div>
                  )}
                  {divergence === 'bearish' && (
                    <div className="flex items-center gap-1 text-red-400 text-sm">
                      <TrendingDown className="w-4 h-4" />
                      하락
                    </div>
                  )}
                  {divergence === 'none' && (
                    <div className="text-slate-400 text-sm">없음</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Risk Score
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${
                  riskScore <= 30 ? 'text-green-400' :
                  riskScore <= 70 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {riskScore.toFixed(0)}
                </div>
                <div className={`text-sm font-semibold ${
                  riskGrade === 'Low' ? 'text-green-400' :
                  riskGrade === 'Medium' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {riskGrade}
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
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

        {/* 우측: 스위칭 판단 박스 또는 개별 종목 의견 */}
        <Card title={isSwitchingMode ? "스위칭 판단" : "투자 의견"}>
          {signal ? (
            <div className="space-y-4">
              {/* 개별 종목 모드 안내 */}
              {!isSwitchingMode && signal.message && (
                <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-300">{signal.message}</div>
                  </div>
                </div>
              )}
              
              {/* 스위칭 모드일 때만 전환 추천 문구 표시 */}
              {isSwitchingMode && (
                <>
                  {/* 추천 문구 강화 */}
                  {(signal.death_cross || signal.risk_score >= 70) && signal.signal === 'sell' && (
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-red-400 font-semibold mb-1">⚠ 방어적 전환 추천</div>
                          <div className="text-sm text-slate-300">
                            {signal.death_cross && '데드크로스 발생'}
                            {signal.death_cross && signal.risk_score >= 70 && ' + '}
                            {signal.risk_score >= 70 && 'Risk Score High'}
                            {' → 방어적 ETF(VIG) 전환 추천'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(signal.golden_cross || signal.divergence === 'bullish') && signal.signal === 'buy' && (
                    <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-green-400 font-semibold mb-1">📈 공격적 유지 추천</div>
                          <div className="text-sm text-slate-300">
                            {signal.golden_cross && '골든크로스 발생'}
                            {signal.golden_cross && signal.divergence === 'bullish' && ' + '}
                            {signal.divergence === 'bullish' && '상승 다이버전스'}
                            {' → 공격적 ETF(QLD) 유지 추천'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <SignalResultCard
                signal={signal.signal}
                confidence={signal.confidence}
                reasons={signal.reason ? signal.reason.split('; ').filter((r: string) => r.trim()) : []}
                goldenCross={signal.golden_cross}
                deathCross={signal.death_cross}
                divergence={signal.divergence}
                riskScore={signal.risk_score}
                riskGrade={signal.risk_grade}
              />
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">시그널 데이터를 불러올 수 없습니다.</div>
          )}
        </Card>
      </div>

      {/* 하단: 비교 차트 (스위칭 모드일 때만 표시) */}
      {isSwitchingMode && (
        <Card title={`${currentETF} vs ${targetETF} 수익률 비교`}>
          <div className="mb-4 flex gap-2">
            {(['1M', '3M', '6M', '1Y', '3Y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  chartPeriod === period
                    ? 'bg-light-blue text-deep-navy'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          {currentPriceData.length > 0 && targetPriceData.length > 0 ? (
            <ReturnComparisonChart
              customSymbol={currentETF}
              customData={currentPriceData}
              vigData={currentETF === 'VIG' ? currentPriceData : targetETF === 'VIG' ? targetPriceData : []}
              qldData={currentETF === 'QLD' ? currentPriceData : targetETF === 'QLD' ? targetPriceData : []}
              period={chartPeriod}
            />
          ) : (
            <div className="text-slate-400 text-center py-8">비교 데이터를 불러올 수 없습니다.</div>
          )}
        </Card>
      )}

      {/* 스위칭 전략 설명 (스위칭 모드일 때만 표시) */}
      {isSwitchingMode && (
        <Card title="스위칭 전략 가이드">
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <strong className="text-light-blue">유지:</strong> 현재 보유 ETF를 그대로 유지합니다.
              시장이 불안정하거나 방어적 자산이 필요한 상황에서 권장됩니다.
            </div>
            <div>
              <strong className="text-light-blue">스위칭:</strong> 현재 보유 ETF에서 다른 ETF로 완전 전환합니다.
              모멘텀이 강화되고 추세 전환이 명확할 때 권장됩니다.
            </div>
            <div>
              <strong className="text-light-blue">부분 전환:</strong> 일부만 전환하여 리스크를 분산합니다.
              불확실한 상황에서 신중한 접근이 필요할 때 권장됩니다.
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
