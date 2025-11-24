import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsSentimentEnhancedProps {
  articles: Array<{
    title: string;
    summary?: string;
    published_at?: string;
    url?: string;
  }>;
}

export const NewsSentimentEnhanced: React.FC<NewsSentimentEnhancedProps> = ({ articles }) => {
  const sentimentAnalysis = useMemo(() => {
    if (!articles || articles.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        keywords: [] as string[],
      };
    }

    const positive_keywords = ["up", "rise", "gain", "bullish", "positive", "growth", "strong", "surge", "rally", "profit"];
    const negative_keywords = ["down", "fall", "drop", "bearish", "negative", "decline", "weak", "crash", "plunge", "loss"];
    
    let positive_count = 0;
    let negative_count = 0;
    let neutral_count = 0;
    const keyword_count: { [key: string]: number } = {};

    articles.forEach(article => {
      const title = (article.title || '').toLowerCase();
      const summary = (article.summary || '').toLowerCase();
      const text = `${title} ${summary}`;

      let pos_score = 0;
      let neg_score = 0;

      positive_keywords.forEach(kw => {
        const count = (text.match(new RegExp(kw, 'g')) || []).length;
        if (count > 0) {
          pos_score += count;
          keyword_count[kw] = (keyword_count[kw] || 0) + count;
        }
      });

      negative_keywords.forEach(kw => {
        const count = (text.match(new RegExp(kw, 'g')) || []).length;
        if (count > 0) {
          neg_score += count;
          keyword_count[kw] = (keyword_count[kw] || 0) + count;
        }
      });

      if (pos_score > neg_score) {
        positive_count++;
      } else if (neg_score > pos_score) {
        negative_count++;
      } else {
        neutral_count++;
      }
    });

    // 상위 키워드 추출
    const topKeywords = Object.entries(keyword_count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    return {
      positive: positive_count,
      neutral: neutral_count,
      negative: negative_count,
      keywords: topKeywords,
    };
  }, [articles]);

  const pieData = [
    { name: '긍정', value: sentimentAnalysis.positive, color: '#10B981' },
    { name: '중립', value: sentimentAnalysis.neutral, color: '#6B7280' },
    { name: '부정', value: sentimentAnalysis.negative, color: '#EF4444' },
  ].filter(item => item.value > 0);

  const keywordData = sentimentAnalysis.keywords.slice(0, 7);

  return (
    <div className="w-full space-y-4">
      {/* 감성 비율 */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-semibold text-light-blue mb-3">뉴스 감성 분석</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 파이 차트 */}
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* 감성 요약 */}
          <div className="flex flex-col justify-center space-y-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <div className="text-sm text-slate-400">긍정</div>
                <div className="text-2xl font-bold text-green-400">
                  {sentimentAnalysis.positive}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Minus className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <div className="text-sm text-slate-400">중립</div>
                <div className="text-2xl font-bold text-slate-400">
                  {sentimentAnalysis.neutral}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <div className="flex-1">
                <div className="text-sm text-slate-400">부정</div>
                <div className="text-2xl font-bold text-red-400">
                  {sentimentAnalysis.negative}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 주요 키워드 */}
      {keywordData.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-sm font-semibold text-light-blue mb-3">최근 7일 주요 키워드</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={keywordData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="keyword" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Bar dataKey="count" fill="#60A5FA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

