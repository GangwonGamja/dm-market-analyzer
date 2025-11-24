import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading, SkeletonCard } from '../components/common/Loading';
import { newsApi, etfApi } from '../services/api';
import toast from 'react-hot-toast';
import { Newspaper, RefreshCw, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
} from 'recharts';

export const NewsAnalysis: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('VIG');
  const [newsData, setNewsData] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<Array<{keyword: string; count: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 뉴스 수집 함수
  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await newsApi.getAll();
      
      if (response?.data) {
        const data = response.data;
        
        // success=false인 경우 명확히 처리
        if (data.success === false) {
          setNewsData([]);
          setSentiment(null);
          const errorMsg = data.error || '뉴스 데이터를 가져올 수 없습니다.';
          console.error('뉴스 수집 실패:', errorMsg);
          toast.error(errorMsg, { duration: 5000 });
          return;
        }
        
        // success=true이고 articles가 있는 경우
        if (data.success === true && data.articles && data.articles.length > 0) {
          setNewsData(data.articles);
          calculateSentiment(data.articles);
        } else {
          // success=true이지만 articles가 없는 경우
          setNewsData([]);
          setSentiment(null);
          toast.error('뉴스 데이터가 없습니다.', { duration: 5000 });
        }
      } else {
        // 응답이 없는 경우
        setNewsData([]);
        setSentiment(null);
        console.error('뉴스 API 응답이 없습니다.');
        toast.error('뉴스 데이터를 가져올 수 없습니다.', { duration: 5000 });
      }
    } catch (error: any) {
      console.error('뉴스 수집 오류:', error);
      setNewsData([]);
      setSentiment(null);
      const errorMessage = error?.response?.data?.error || error?.message || '뉴스 데이터를 가져올 수 없습니다.';
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // 감성 분석 계산
  const calculateSentiment = (articles: any[]) => {
    if (!articles || articles.length === 0) {
      setSentiment(null);
      return;
    }
    
    const total = articles.length;
    
    // 평균 감성 점수 계산 (score: -1 ~ 1을 0 ~ 100으로 변환)
    const avgScore = articles.reduce((sum, article) => sum + (article.score || 0), 0) / total;
    const overallScore = ((avgScore + 1) * 50); // -1~1을 0~100으로 변환
    
    // 감성 비율 계산
    const avgPos = articles.reduce((sum, article) => sum + (article.sentiment?.pos || 0), 0) / total;
    const avgNeu = articles.reduce((sum, article) => sum + (article.sentiment?.neu || 0), 0) / total;
    const avgNeg = articles.reduce((sum, article) => sum + (article.sentiment?.neg || 0), 0) / total;
    
    // 라벨 기반 카운트 (score 기준)
    const positiveCount = articles.filter(a => (a.score || 0) >= 0.05).length;
    const neutralCount = articles.filter(a => -0.05 <= (a.score || 0) && (a.score || 0) < 0.05).length;
    const negativeCount = articles.filter(a => (a.score || 0) < -0.05).length;
    
    setSentiment({
      overall: round(overallScore, 2),
      positive: round(avgPos * 100, 2),
      neutral: round(avgNeu * 100, 2),
      negative: round(avgNeg * 100, 2),
      positive_count: positiveCount,
      neutral_count: neutralCount,
      negative_count: negativeCount,
      total_news: total,
    });
  };

  const round = (num: number, decimals: number = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  const updateNews = async () => {
    try {
      setUpdating(true);
      toast.loading('뉴스 수집 중...', { id: 'update-news' });
      
      const response = await newsApi.getAll().catch((error) => {
        console.error('뉴스 API 호출 오류:', error);
        return null;
      });
      
      if (response?.data) {
        const data = response.data;
        
        if (data.success && data.articles && data.articles.length > 0) {
          toast.success(`뉴스 ${data.count}개 수집 완료`, { id: 'update-news' });
          setNewsData(data.articles);
          calculateSentiment(data.articles);
        } else {
          const errorMsg = data.error || '뉴스 데이터를 가져올 수 없습니다.';
          console.error('뉴스 수집 실패:', errorMsg);
          toast.error(errorMsg, { id: 'update-news', duration: 5000 });
          setNewsData([]);
          setSentiment(null);
        }
      } else {
        const errorMsg = '뉴스 API 응답이 없습니다.';
        console.error(errorMsg);
        toast.error(errorMsg, { id: 'update-news', duration: 5000 });
        setNewsData([]);
        setSentiment(null);
      }
    } catch (error: any) {
      console.error('뉴스 수집 오류:', error);
      const errorMessage = error?.response?.data?.error || error?.message || '뉴스 수집 중 오류가 발생했습니다.';
      toast.error(errorMessage, { id: 'update-news', duration: 5000 });
      setNewsData([]);
      setSentiment(null);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchNews(symbol);
  }, [symbol]);

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score <= 30) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score <= 30) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 70) return '긍정적';
    if (score <= 30) return '부정적';
    return '중립';
  };

  const getNewsSentimentScore = (article: any) => {
    // score는 -1 ~ 1 범위를 0 ~ 100으로 변환
    if (article && article.score !== undefined) {
      return Math.round(((article.score + 1) * 50));
    }
    return 50;
  };

  const getNewsSentimentLabel = (score: number) => {
    if (score >= 70) return '긍정';
    if (score < 40) return '부정';
    return '중립';
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
      {/* 티커 선택 */}
      <Card title="분석 티커 선택">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="VIG, QLD, AAPL 등"
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-light-blue"
          />
          <button
            onClick={() => fetchNews(symbol)}
            disabled={updating}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              updating
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-light-blue text-deep-navy hover:bg-blue-400'
            }`}
          >
            {updating ? '로딩 중...' : '분석'}
          </button>
        </div>
      </Card>

      {/* 오늘의 뉴스 심리 지수 */}
      <Card title={`${symbol} 뉴스 심리 지수`} tooltip="최신 금융 뉴스의 감성 분석 결과">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-slate-400">
            Marketaux API에서 최신 뉴스 수집
          </div>
          <button
            onClick={updateNews}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              updating
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-light-blue text-deep-navy hover:bg-blue-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            <span>뉴스 수집</span>
          </button>
        </div>

        {sentiment && newsData.length > 0 ? (
          <div className="space-y-6">
            {/* 종합 감성 점수 */}
            <div className="text-center">
              <div className={`text-7xl font-bold mb-4 ${getSentimentColor(sentiment.overall)}`}>
                {sentiment.overall.toFixed(1)}
              </div>
              <div className="text-xl font-semibold mb-4 text-slate-300">
                {getSentimentLabel(sentiment.overall)}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-6 mb-2">
                <div
                  className={`h-6 rounded-full transition-all duration-500 ${getSentimentBgColor(sentiment.overall)}`}
                  style={{ width: `${sentiment.overall}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0 (매우 부정적)</span>
                <span>50 (중립)</span>
                <span>100 (매우 긍정적)</span>
              </div>
              <div className="mt-4 text-sm text-slate-400">
                분석된 뉴스: {sentiment.total_news}개
              </div>
            </div>

            {/* 감성 비율 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">긍정</div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {sentiment.positive.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">
                  {sentiment.positive_count}개 기사
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">중립</div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">
                  {sentiment.neutral.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">
                  {sentiment.neutral_count}개 기사
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-6">
                <div className="text-sm text-slate-400 mb-2">부정</div>
                <div className="text-4xl font-bold text-red-400 mb-2">
                  {sentiment.negative.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">
                  {sentiment.negative_count}개 기사
                </div>
              </div>
            </div>

            {/* 긍·부정 비율 차트 */}
            <div className="bg-slate-900 rounded-lg p-6">
              <div className="text-lg font-semibold mb-4 text-slate-300">감성 분포</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '긍정', value: sentiment.positive, color: '#10B981' },
                      { name: '중립', value: sentiment.neutral, color: '#F59E0B' },
                      { name: '부정', value: sentiment.negative, color: '#EF4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
               ) : (
                 <div className="text-slate-400 text-center py-8">
                   <div className="text-lg font-semibold mb-2 text-red-400">
                     뉴스 데이터 없음
                   </div>
                   <div className="text-sm mb-4">
                     {loading ? '로딩 중...' : '뉴스 수집 버튼을 클릭하여 데이터를 가져오세요.'}
                   </div>
                 </div>
               )}
      </Card>

      {/* 최신 뉴스 목록 */}
      <Card title="최신 뉴스 (최대 15개)" tooltip="Reuters & CNBC에서 수집된 최신 경제·증시 관련 뉴스">
        {newsData.length > 0 ? (
          <div className="space-y-4">
            {newsData.slice(0, 10).map((news: any, index: number) => {
              const sentimentScore = getNewsSentimentScore(news);
              const sentimentLabel = getNewsSentimentLabel(sentimentScore);
              
              return (
                <div
                  key={index}
                  className="p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Newspaper className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {news.published_at || news.published ? new Date(news.published_at || news.published).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '날짜 정보 없음'}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold mb-2 text-white hover:text-light-blue transition-colors">
                        <a
                          href={news.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          {news.title || '제목 없음'}
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                      </h4>
                      {news.summary && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {news.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[80px]">
                      <div className={`text-3xl font-bold ${getSentimentColor(sentimentScore)}`}>
                        {sentimentScore}
                      </div>
                      <div className={`text-xs font-semibold ${getSentimentColor(sentimentScore)}`}>
                        {sentimentLabel}
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getSentimentBgColor(sentimentScore)}`}
                          style={{ width: `${sentimentScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
               ) : (
                 <div className="text-slate-400 text-center py-8">
                   <div className="text-lg font-semibold mb-2 text-red-400">
                     뉴스 데이터 없음
                   </div>
                   <div className="text-sm mb-4">
                     {loading ? '로딩 중...' : '뉴스 수집 버튼을 클릭하여 데이터를 가져오세요.'}
                   </div>
                 </div>
               )}
      </Card>

      {/* 키워드 트렌드 */}
      {keywords.length > 0 && (
        <Card title="주요 키워드 트렌드">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {keywords.map((item, index) => (
              <div
                key={index}
                className="bg-slate-900 rounded-lg p-3 text-center"
              >
                <div className="text-sm text-slate-400 mb-1">{item.keyword}</div>
                <div className="text-2xl font-bold text-light-blue">{item.count}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 가격과 뉴스 이벤트 연동 차트 */}
      {priceData.length > 0 && newsData.length > 0 && (
        <Card title="가격과 뉴스 이벤트 연동">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={priceData.slice(-60)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="price"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#60A5FA"
                strokeWidth={2}
                name="가격"
                dot={false}
              />
              {/* 뉴스 이벤트 마커 */}
              {newsData.slice(0, 10).map((news, index) => {
                const newsDate = news.published_at || news.published;
                if (!newsDate) return null;
                const dateStr = new Date(newsDate).toISOString().split('T')[0];
                const priceItem = priceData.find(p => p.date === dateStr);
                if (!priceItem) return null;
                const sentimentScore = getNewsSentimentScore(news);
                return (
                  <Scatter
                    key={index}
                    yAxisId="price"
                    data={[{ date: dateStr, close: priceItem.close, sentiment: sentimentScore }]}
                    fill={sentimentScore >= 70 ? '#10B981' : sentimentScore <= 30 ? '#EF4444' : '#F59E0B'}
                  >
                    <Cell />
                  </Scatter>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>긍정 뉴스</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>중립 뉴스</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>부정 뉴스</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
