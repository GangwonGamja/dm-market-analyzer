import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, X, Clock } from 'lucide-react';

interface TickerInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: (symbol: string) => void;
  placeholder?: string;
  favorites?: string[];
  onToggleFavorite?: (symbol: string) => void;
}

export const TickerInput: React.FC<TickerInputProps> = ({
  value,
  onChange,
  onAnalyze,
  placeholder = '티커 입력 (예: AAPL, TSLA, NVDA)',
  favorites = [],
  onToggleFavorite,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // localStorage에서 최근 검색 목록 불러오기
  useEffect(() => {
    const stored = localStorage.getItem('recentTickerSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // 자동완성 (간단한 구현 - 실제로는 API 호출 필요)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toUpperCase();
    onChange(inputValue);
    
    if (inputValue.length > 0) {
      // 일반적인 티커 목록 (실제로는 API에서 가져와야 함)
      const commonTickers = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'VIG', 'QLD',
        'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'AGG'
      ];
      
      const filtered = commonTickers.filter(ticker => 
        ticker.startsWith(inputValue)
      ).slice(0, 5);
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectTicker = (ticker: string) => {
    onChange(ticker);
    setShowSuggestions(false);
    
    // 최근 검색에 추가
    const updated = [ticker, ...recentSearches.filter(s => s !== ticker)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentTickerSearches', JSON.stringify(updated));
    
    onAnalyze(ticker);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      handleSelectTicker(value.trim());
    }
  };

  const isFavorite = favorites.includes(value.toUpperCase());

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                if (suggestions.length > 0 || recentSearches.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // 약간의 지연을 두어 클릭 이벤트가 먼저 발생하도록
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={placeholder}
              className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-light-blue"
            />
            {value && (
              <button
                onClick={() => {
                  onChange('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* 자동완성 및 최근 검색 드롭다운 */}
          {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-slate-400 px-2 py-1">추천</div>
                  {suggestions.map((ticker) => (
                    <button
                      key={ticker}
                      onClick={() => handleSelectTicker(ticker)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded text-sm text-slate-200 flex items-center justify-between"
                    >
                      <span>{ticker}</span>
                      {favorites.includes(ticker) && (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {recentSearches.length > 0 && (
                <div className="p-2 border-t border-slate-700">
                  <div className="text-xs text-slate-400 px-2 py-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    최근 검색
                  </div>
                  {recentSearches.map((ticker) => (
                    <button
                      key={ticker}
                      onClick={() => handleSelectTicker(ticker)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded text-sm text-slate-200 flex items-center justify-between"
                    >
                      <span>{ticker}</span>
                      {favorites.includes(ticker) && (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 즐겨찾기 버튼 */}
        {value && onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(value.toUpperCase())}
            className={`p-2 rounded-lg transition-all ${
              isFavorite
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
            title={isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400' : ''}`} />
          </button>
        )}
        
        {/* 분석 버튼 */}
        <button
          onClick={() => value.trim() && handleSelectTicker(value.trim())}
          disabled={!value.trim()}
          className="px-6 py-2 bg-light-blue text-deep-navy rounded-lg font-semibold hover:bg-blue-400 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          분석하기
        </button>
      </div>
      
      {/* 즐겨찾기 목록 */}
      {favorites.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400">즐겨찾기:</span>
          {favorites.map((ticker) => (
            <button
              key={ticker}
              onClick={() => handleSelectTicker(ticker)}
              className="px-2 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-xs text-yellow-400 hover:bg-yellow-500/30 transition-all flex items-center gap-1"
            >
              <Star className="w-3 h-3 fill-yellow-400" />
              {ticker}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

