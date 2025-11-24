import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading, SkeletonCard } from '../components/common/Loading';
import { marketApi } from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const MarketSentiment: React.FC = () => {
  const [fearGreed, setFearGreed] = useState<any>(null);
  const [fgiHistory, setFgiHistory] = useState<any[]>([]);
  const [compositeSentiment, setCompositeSentiment] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        fgiRes,
        fgiHistoryRes,
        fgiStatsRes,
        aggregateSentimentRes,
      ] = await Promise.all([
        marketApi.getFgi().catch(() => null),
        marketApi.getFgiHistory(365).catch(() => null),
        marketApi.getFgiStatistics().catch(() => null),
        marketApi.getAggregateSentiment().catch(() => null),
      ]);

      // FGI 현재 값
      if (fgiRes?.data) {
        const fgi = fgiRes.data;
        if (fgi.success === true || (fgi.score !== null && fgi.score !== undefined)) {
          setFearGreed({
            value: fgi.score,
            classification: fgi.rating || fgi.classification,
            score: fgi.score,
            rating: fgi.rating || fgi.classification,
          });
        }
      }

      // FGI 히스토리
      if (fgiHistoryRes?.data?.success && fgiHistoryRes.data.data) {
        setFgiHistory(fgiHistoryRes.data.data);
      } else {
        setFgiHistory([]);
      }

      // 종합 심리지수 (백엔드에서 계산된 값 사용)
      if (aggregateSentimentRes?.data?.success) {
        const sentiment = aggregateSentimentRes.data;
        const score = sentiment.score;
        if (score !== null && score !== undefined && !isNaN(score)) {
          setCompositeSentiment(Math.round(score));
        } else {
          setCompositeSentiment(50); // fallback
        }
      } else {
        // 백엔드 실패 시 fallback
        setCompositeSentiment(50);
      }

    } catch (error: any) {
      console.error('데이터 로딩 오류:', error);
      const errorMessage = error?.message || '데이터 로딩 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      // 에러 발생 시에도 로딩 중단
      setFearGreed(null);
      setFgiHistory([]);
      setCompositeSentiment(50);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const getClassificationColor = (classification: string) => {
    const colors: { [key: string]: string } = {
      'Extreme Fear': '#EF4444',
      'Fear': '#F59E0B',
      'Neutral': '#EAB308',
      'Greed': '#10B981',
      'Extreme Greed': '#059669',
    };
    return colors[classification] || '#6B7280';
  };

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
      {/* 현재 Fear & Greed Index */}
      <Card title="CNN Fear & Greed Index (실시간)" tooltip="CNN에서 실시간 스크래핑하는 공포/탐욕 지수">
        {fearGreed ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-6xl font-bold text-light-blue">
                    {fearGreed.value}
                  </div>
                  {fearGreed.change !== undefined && fearGreed.change !== 0 && (
                    <div className={`flex flex-col items-center gap-1 ${
                      fearGreed.change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {fearGreed.change > 0 ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : (
                        <TrendingDown className="w-6 h-6" />
                      )}
                      <span className="text-lg font-bold">
                        {Math.abs(fearGreed.change)}
                      </span>
                      <span className="text-xs">
                        ({fearGreed.change > 0 ? '+' : ''}{fearGreed.change_rate?.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xl font-semibold mb-2" style={{ color: getClassificationColor(fearGreed.classification) }}>
                  {fearGreed.classification === 'Extreme Fear' ? '극공포' :
                   fearGreed.classification === 'Fear' ? '공포' :
                   fearGreed.classification === 'Neutral' ? '중립' :
                   fearGreed.classification === 'Greed' ? '탐욕' :
                   fearGreed.classification === 'Extreme Greed' ? '극탐욕' :
                   fearGreed.classification}
                </div>
                <div className="text-sm text-slate-400 mb-4">
                  {new Date(fearGreed.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {fearGreed.previous_value !== undefined && (
                  <div className="text-xs text-slate-500">
                    전일: {fearGreed.previous_value}
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-6 mb-2">
              <div
                className="h-6 rounded-full transition-all duration-500"
                style={{
                  width: `${fearGreed.value}%`,
                  backgroundColor: getClassificationColor(fearGreed.classification),
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-slate-400 mt-2 mb-4">
              <span>0 (극공포)</span>
              <span>50 (중립)</span>
              <span>100 (극탐욕)</span>
            </div>

            {/* 트리거 신호 및 행동 가이드 */}
            {fearGreed.trigger_signals && fearGreed.trigger_signals.length > 0 && (
              <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-light-blue" />
                  <span className="font-semibold text-light-blue">트리거 신호 및 행동 가이드</span>
                </div>
                <div className="space-y-2">
                  {fearGreed.trigger_signals.map((signal: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-light-blue mt-1">•</span>
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
                {fearGreed.confidence_boost !== undefined && fearGreed.confidence_boost > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                    신뢰도 향상: +{(fearGreed.confidence_boost * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-400">데이터 없음</div>
        )}
      </Card>

      {/* Fear & Greed Index 히스토리 */}
      <Card title="Fear & Greed Index 히스토리 (1년)" tooltip="최근 1년간의 Fear & Greed Index 추이">
        {fgiHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={fgiHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9CA3AF"
              />
              <YAxis stroke="#9CA3AF" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                }}
                labelFormatter={formatDate}
                formatter={(value: number, name: string, props: any) => [
                  `${value} (${props.payload.classification})`,
                  'Fear & Greed Index'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Fear & Greed Index"
                stroke="#38BDF8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-slate-400 text-center py-8">히스토리 데이터가 없습니다.</div>
        )}
      </Card>

      {/* 분류별 통계 */}
      <Card title="분류별 통계 (최근 1년)" tooltip="최근 1년간 분류별 비율">
        {fgiHistory.length > 0 ? (
          <div>
            {(() => {
              const classificationCount: { [key: string]: number } = {};
              fgiHistory.forEach((item) => {
                const classification = item.classification;
                classificationCount[classification] = (classificationCount[classification] || 0) + 1;
              });

              const chartData = Object.entries(classificationCount).map(([key, value]) => ({
                name: key,
                count: value,
                percentage: ((value / fgiHistory.length) * 100).toFixed(1),
                color: getClassificationColor(key),
              }));

              return (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value}일 (${props.payload.percentage}%)`,
                        '일수'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="일수"
                      fill="#38BDF8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        ) : (
          <div className="text-slate-400 text-center py-8">통계 데이터가 없습니다.</div>
        )}
      </Card>

      {/* 종합 심리지수 */}
      <Card title="종합 심리지수" tooltip="FGI + VIX + 시장 RSI + 뉴스 감성을 종합한 심리 점수">
        {compositeSentiment !== null && !isNaN(compositeSentiment) ? (
          <div className="text-center">
            <div className="text-7xl font-bold mb-4 text-light-blue">
              {compositeSentiment}
            </div>
            <div className="text-xl font-semibold mb-6 text-slate-300">
              {compositeSentiment >= 70 ? '매우 긍정적' :
               compositeSentiment >= 55 ? '긍정적' :
               compositeSentiment >= 45 ? '중립' :
               compositeSentiment >= 30 ? '부정적' : '매우 부정적'}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4 mb-2">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  compositeSentiment >= 70 ? 'bg-green-500' :
                  compositeSentiment >= 55 ? 'bg-green-400' :
                  compositeSentiment >= 45 ? 'bg-yellow-400' :
                  compositeSentiment >= 30 ? 'bg-orange-400' : 'bg-red-500'
                }`}
                style={{ width: `${compositeSentiment}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>0 (매우 부정적)</span>
              <span>50 (중립)</span>
              <span>100 (매우 긍정적)</span>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-center py-8">데이터 없음</div>
        )}
      </Card>


      {/* 에러 메시지 */}
      {error && (
        <Card title="오류" className="border-red-400 bg-red-900/20">
          <div className="text-red-400">{error}</div>
        </Card>
      )}

      {/* 시장 심리 설명 */}
      <Card title="시장 심리 지표 설명">
        <div className="space-y-4 text-sm text-slate-300">
          <div>
            <strong className="text-light-blue">Fear & Greed Index:</strong> 시장 심리를 0(Extreme Fear)부터 100(Extreme Greed)까지의 척도로 측정합니다. CNN에서 실시간으로 제공하는 지수입니다.
          </div>
          <div>
            <strong className="text-light-blue">종합 심리지수:</strong> FGI + VIX + 시장 RSI + 뉴스 감성을 종합하여 0-100 점수로 제공합니다. 높을수록 긍정적인 시장 심리를 나타냅니다.
          </div>
        </div>
      </Card>
    </div>
  );
};

