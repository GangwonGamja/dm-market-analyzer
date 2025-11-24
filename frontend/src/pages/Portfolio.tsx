import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading, SkeletonCard } from '../components/common/Loading';
import { portfolioApi } from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, Info, RefreshCw } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

export const Portfolio: React.FC = () => {
  const [allocation, setAllocation] = useState<any>(null);
  const [customAllocation, setCustomAllocation] = useState({
    vig: 50,
    qld: 50,
    cash: 0,
  });
  const [totalValue, setTotalValue] = useState<number>(10000);
  const [riskScore, setRiskScore] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await portfolioApi.getAllocation().catch(() => null);
      if (response?.data) {
        setAllocation(response.data);
      } else {
        toast.error('포트폴리오 데이터를 가져올 수 없습니다.');
      }
    } catch (error: any) {
      toast.error('데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateData = async () => {
    try {
      setUpdating(true);
      toast.loading('데이터 업데이트 중...', { id: 'update-portfolio' });
      await loadData();
      toast.success('데이터 업데이트 완료', { id: 'update-portfolio' });
    } catch (error: any) {
      toast.error('데이터 업데이트 실패', { id: 'update-portfolio' });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const COLORS = ['#38BDF8', '#F59E0B'];
  const pieData = allocation
    ? [
        { name: 'VIG', value: allocation.vig_allocation },
        { name: 'QLD', value: allocation.qld_allocation },
      ]
    : [];

  const handleAllocationChange = (type: 'vig' | 'qld' | 'cash', value: number) => {
    const newAllocation = { ...customAllocation, [type]: value };
    const total = newAllocation.vig + newAllocation.qld + newAllocation.cash;
    if (total <= 100) {
      setCustomAllocation(newAllocation);
    }
  };

  const calculateRiskScore = () => {
    // VIG는 낮은 리스크(30), QLD는 높은 리스크(70)로 가정
    const vigRisk = 30;
    const qldRisk = 70;
    const cashRisk = 0;
    
    const weightedRisk = (
      (customAllocation.vig / 100) * vigRisk +
      (customAllocation.qld / 100) * qldRisk +
      (customAllocation.cash / 100) * cashRisk
    );
    
    setRiskScore(Math.round(weightedRisk));
  };

  useEffect(() => {
    calculateRiskScore();
  }, [customAllocation]);

  return (
    <div className="space-y-6">
      {/* 자산 입력 */}
      <Card title="포트폴리오 자산 입력">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">
              총 자산 가치 (USD)
            </label>
            <input
              type="number"
              value={totalValue}
              onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
              min="0"
              step="100"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                VIG 비중 (%)
              </label>
              <input
                type="number"
                value={customAllocation.vig}
                onChange={(e) => handleAllocationChange('vig', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
                min="0"
                max="100"
              />
              <div className="text-xs text-slate-400 mt-1">
                ${((totalValue * customAllocation.vig) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                QLD 비중 (%)
              </label>
              <input
                type="number"
                value={customAllocation.qld}
                onChange={(e) => handleAllocationChange('qld', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
                min="0"
                max="100"
              />
              <div className="text-xs text-slate-400 mt-1">
                ${((totalValue * customAllocation.qld) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                현금 비중 (%)
              </label>
              <input
                type="number"
                value={customAllocation.cash}
                onChange={(e) => handleAllocationChange('cash', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
                min="0"
                max="100"
              />
              <div className="text-xs text-slate-400 mt-1">
                ${((totalValue * customAllocation.cash) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
            <span className="text-sm text-slate-400">총 비중</span>
            <span className={`text-lg font-bold ${
              customAllocation.vig + customAllocation.qld + customAllocation.cash === 100
                ? 'text-green-400'
                : 'text-red-400'
            }`}>
              {customAllocation.vig + customAllocation.qld + customAllocation.cash}%
            </span>
          </div>
        </div>
      </Card>

      {/* 위험 점수 */}
      <Card title="포트폴리오 위험 점수">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">위험 점수</div>
              <div className={`text-3xl font-bold ${
                riskScore <= 30 ? 'text-green-400' :
                riskScore <= 70 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {riskScore}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {riskScore <= 30 ? '낮은 위험' :
                 riskScore <= 70 ? '중간 위험' :
                 '높은 위험'}
              </div>
            </div>
            <div className="w-32 h-32 relative">
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
                  className={
                    riskScore <= 30 ? 'text-green-400' :
                    riskScore <= 70 ? 'text-yellow-400' :
                    'text-red-400'
                  }
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </Card>

      {/* AI 포트폴리오 비중 추천 */}
      <Card title="AI 포트폴리오 비중 추천" tooltip="시장 지표를 기반으로 한 AI 자동 비중 추천">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-slate-400">
            시장 상황을 분석하여 최적의 비중을 추천합니다.
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
            <span>업데이트</span>
          </button>
        </div>

        {allocation ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 파이 차트 */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 추천 비중 */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-light-blue">VIG 비중</span>
                  <span className="text-3xl font-bold text-light-blue">
                    {allocation.vig_allocation}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4">
                  <div
                    className="bg-light-blue h-4 rounded-full transition-all duration-500"
                    style={{ width: `${allocation.vig_allocation}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-yellow-400">QLD 비중</span>
                  <span className="text-3xl font-bold text-yellow-400">
                    {allocation.qld_allocation}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4">
                  <div
                    className="bg-yellow-400 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${allocation.qld_allocation}%` }}
                  ></div>
                </div>
              </div>

              {/* 신뢰도 */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">AI 신뢰도</span>
                  <span className="text-lg font-bold">
                    {(allocation.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-green-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${allocation.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400">데이터 없음</div>
        )}
      </Card>

      {/* 추천 이유 */}
      {allocation && (
        <Card title="추천 이유" tooltip="AI가 비중을 추천한 주요 이유">
          <div className="space-y-3">
            {allocation.reasons && allocation.reasons.length > 0 ? (
              allocation.reasons.map((reason: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg"
                >
                  <Info className="w-5 h-5 text-light-blue mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{reason}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400">추천 이유 없음</div>
            )}
          </div>
        </Card>
      )}

      {/* 시장 데이터 */}
      {allocation?.market_data && (
        <Card title="시장 지표" tooltip="비중 추천에 사용된 시장 지표">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allocation.market_data.vix !== null && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">VIX</div>
                <div className="text-2xl font-bold text-purple-400">
                  {allocation.market_data.vix}
                </div>
                <div className="text-xs text-slate-500 mt-1">변동성 지수</div>
              </div>
            )}
            {allocation.market_data.fgi !== null && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Fear & Greed</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {allocation.market_data.fgi}
                </div>
                <div className="text-xs text-slate-500 mt-1">시장 심리 지수</div>
              </div>
            )}
            {allocation.market_data.tnx !== null && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">10년 금리</div>
                <div className="text-2xl font-bold text-blue-400">
                  {allocation.market_data.tnx}%
                </div>
                <div className="text-xs text-slate-500 mt-1">미국 국채 금리</div>
              </div>
            )}
            {allocation.market_data.dxy !== null && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">DXY</div>
                <div className="text-2xl font-bold text-green-400">
                  {allocation.market_data.dxy}
                </div>
                <div className="text-xs text-slate-500 mt-1">달러 인덱스</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 점수 상세 */}
      {allocation?.scores && (
        <Card title="자산별 점수" tooltip="AI가 계산한 각 자산의 점수">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-light-blue">VIG 점수</span>
                <span className="text-2xl font-bold text-light-blue">
                  {allocation.scores.vig_score}점
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-light-blue h-3 rounded-full transition-all duration-500"
                  style={{ width: `${allocation.scores.vig_score}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-yellow-400">QLD 점수</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {allocation.scores.qld_score}점
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${allocation.scores.qld_score}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};



