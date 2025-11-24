import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsSentimentPanelProps {
  news: any[];
  fgi?: {
    score: number;
    rating?: string;
  };
}

export const NewsSentimentPanel: React.FC<NewsSentimentPanelProps> = ({
  news = [],
  fgi,
}) => {
  const getFGIColor = (score: number) => {
    if (score < 25) return 'text-red-400';
    if (score < 45) return 'text-orange-400';
    if (score < 55) return 'text-yellow-400';
    if (score < 75) return 'text-green-400';
    return 'text-emerald-400';
  };

  const getFGIRating = (rating?: string) => {
    if (!rating) return 'N/A';
    const ratingMap: { [key: string]: string } = {
      'Extreme Fear': '극공포',
      'Fear': '공포',
      'Neutral': '중립',
      'Greed': '탐욕',
      'Extreme Greed': '극탐욕',
    };
    return ratingMap[rating] || rating;
  };

  return (
    <div className="space-y-4">
      {/* Fear & Greed Index */}
      {fgi && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-sm font-semibold text-light-blue mb-3">CNN Fear & Greed Index</div>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-bold ${getFGIColor(fgi.score)}`}>
                {fgi.score}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {getFGIRating(fgi.rating)}
              </div>
            </div>
            <div className="w-32 bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  fgi.score < 25 ? 'bg-red-500' :
                  fgi.score < 45 ? 'bg-orange-500' :
                  fgi.score < 55 ? 'bg-yellow-500' :
                  fgi.score < 75 ? 'bg-green-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${fgi.score}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 뉴스 리스트 */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-semibold text-light-blue mb-3">
          관련 뉴스 ({news.length}개)
        </div>
        {news.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-4">
            뉴스 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {news.slice(0, 10).map((article, index) => (
              <div
                key={index}
                className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <a
                      href={article.url || article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-200 hover:text-light-blue transition-colors line-clamp-2"
                    >
                      {article.title || article.headline}
                    </a>
                    <div className="text-xs text-slate-500 mt-1">
                      {article.source || 'Unknown'} · {article.published_at || article.date}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

