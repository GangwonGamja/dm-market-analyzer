import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading, SkeletonCard } from '../components/common/Loading';
import { BacktestChart } from '../components/charts/BacktestChart';
import { backtestApi } from '../services/api';
import toast from 'react-hot-toast';
import { Play, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export const Backtest: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('VIG');
  const [strategy, setStrategy] = useState<'signal' | 'buy_and_hold' | 'ma_cross'>('signal');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const runBacktest = async () => {
    try {
      setRunning(true);
      setLoading(true);
      
      const response = await backtestApi.runBacktest({
        symbol,
        start_date: startDate,
        end_date: endDate,
        initial_investment: initialInvestment,
        strategy,
      });
      
      if (response.data) {
        setResults(response.data);
        toast.success('백테스트가 완료되었습니다.');
      }

    } catch (error: any) {
      console.error('백테스트 오류:', error);
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || '백테스트 실행 중 오류가 발생했습니다.';
      toast.error(`백테스트 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRunning(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* 백테스트 옵션 */}
      <Card title="백테스트 옵션">
        <div className="space-y-6">
          {/* 티커 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-300">
              분석 티커
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="VIG, QLD, AAPL 등"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
            />
          </div>

          {/* 전략 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-300">
              백테스트 전략
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setStrategy('signal')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  strategy === 'signal'
                    ? 'bg-light-blue text-deep-navy'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                시그널 기반
              </button>
              <button
                onClick={() => setStrategy('buy_and_hold')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  strategy === 'buy_and_hold'
                    ? 'bg-light-blue text-deep-navy'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Buy & Hold
              </button>
              <button
                onClick={() => setStrategy('ma_cross')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  strategy === 'ma_cross'
                    ? 'bg-light-blue text-deep-navy'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                MA 크로스
              </button>
            </div>
          </div>

          {/* 기간 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
              />
            </div>
          </div>

          {/* 초기 투자금 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-300">
              초기 투자금 (USD)
            </label>
            <input
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(parseFloat(e.target.value) || 10000)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
              min="1000"
              step="1000"
            />
          </div>

          {/* 실행 버튼 */}
          <button
            onClick={runBacktest}
            disabled={running}
            className={`w-full px-6 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              running
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-light-blue text-deep-navy hover:bg-blue-400'
            }`}
          >
            {running ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-deep-navy"></div>
                <span>백테스트 실행 중...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>백테스트 실행</span>
              </>
            )}
          </button>

          {/* 진행률 표시 */}
          {running && (
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-light-blue h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          )}
        </div>
      </Card>

      {/* 결과 */}
      {results && results.success && (
        <>
          {/* 백테스트 결과 카드 */}
          <Card title={`${results.symbol} 백테스트 결과 (${results.strategy})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">최종 가치</div>
                <div className="text-3xl font-bold text-light-blue">
                  ${results.final_equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">총 수익률</div>
                <div className={`text-3xl font-bold flex items-center gap-2 ${
                  results.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {results.total_return_pct >= 0 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                  {formatPercent(results.total_return_pct)}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">CAGR</div>
                <div className="text-3xl font-bold text-light-blue">
                  {formatPercent(results.cagr)}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">MDD</div>
                <div className="text-3xl font-bold text-red-400">
                  {formatPercent(-results.max_drawdown)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">승률</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {results.win_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  승리: {results.winning_trades} / 패배: {results.losing_trades}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">총 거래 횟수</div>
                <div className="text-2xl font-bold text-slate-300">
                  {results.total_trades}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">총 수익</div>
                <div className={`text-2xl font-bold ${
                  results.total_return >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${results.total_return.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </Card>

          {/* 차트 */}
          {results.equity_curve && results.equity_curve.length > 0 && (
            <Card title="자산 가치 추이">
              <BacktestChart data={results.equity_curve.map((item: any) => ({
                date: item.date,
                equity: item.equity,
                price: item.price
              }))} />
            </Card>
          )}
        </>
      )}

      {/* 로딩 상태 */}
      {loading && !results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
    </div>
  );
};

