import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';
import { Save, RefreshCw } from 'lucide-react';
import { etfApi } from '../services/api';

export const Settings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState({
    alphaVantage: '',
    fearGreed: '',
  });
  const [updateInterval, setUpdateInterval] = useState<number>(24); // 시간
  const [chartRefreshInterval, setChartRefreshInterval] = useState<number>(60); // 초
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    // 로컬 스토리지에서 설정 불러오기
    const savedApiKeys = localStorage.getItem('apiKeys');
    const savedUpdateInterval = localStorage.getItem('updateInterval');
    const savedChartRefresh = localStorage.getItem('chartRefreshInterval');

    if (savedApiKeys) {
      setApiKeys(JSON.parse(savedApiKeys));
    }
    if (savedUpdateInterval) {
      setUpdateInterval(parseInt(savedUpdateInterval));
    }
    if (savedChartRefresh) {
      setChartRefreshInterval(parseInt(savedChartRefresh));
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    localStorage.setItem('updateInterval', updateInterval.toString());
    localStorage.setItem('chartRefreshInterval', chartRefreshInterval.toString());
    toast.success('설정이 저장되었습니다.');
  };

  const handleUpdateData = async (symbol: string) => {
    try {
      setUpdating(symbol);
      await etfApi.updateData(symbol);
      toast.success(`${symbol} 데이터 업데이트 완료`);
    } catch (error: any) {
      toast.error(`${symbol} 데이터 업데이트 실패`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* API 키 설정 */}
      <Card title="API 키 설정">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">
              Alpha Vantage API Key
            </label>
            <input
              type="password"
              value={apiKeys.alphaVantage}
              onChange={(e) => setApiKeys({ ...apiKeys, alphaVantage: e.target.value })}
              placeholder="Alpha Vantage API 키를 입력하세요"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
            />
            <p className="text-xs text-slate-400 mt-1">
              선택 사항: Alpha Vantage API를 사용하려면 키를 입력하세요.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">
              Fear & Greed API Key
            </label>
            <input
              type="password"
              value={apiKeys.fearGreed}
              onChange={(e) => setApiKeys({ ...apiKeys, fearGreed: e.target.value })}
              placeholder="Fear & Greed API 키를 입력하세요"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
            />
            <p className="text-xs text-slate-400 mt-1">
              선택 사항: 기본적으로 무료 API를 사용합니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 데이터 업데이트 설정 */}
      <Card title="데이터 업데이트 설정">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">
              자동 업데이트 주기 (시간)
            </label>
            <select
              value={updateInterval}
              onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
            >
              <option value={1}>1시간</option>
              <option value={6}>6시간</option>
              <option value={12}>12시간</option>
              <option value={24}>24시간 (1일)</option>
              <option value={48}>48시간 (2일)</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              ETF 데이터를 자동으로 업데이트하는 주기입니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">
              차트 리프레시 주기 (초)
            </label>
            <select
              value={chartRefreshInterval}
              onChange={(e) => setChartRefreshInterval(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
            >
              <option value={30}>30초</option>
              <option value={60}>60초 (1분)</option>
              <option value={300}>300초 (5분)</option>
              <option value={600}>600초 (10분)</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              차트 데이터를 자동으로 새로고침하는 주기입니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 수동 데이터 업데이트 */}
      <Card title="수동 데이터 업데이트">
        <div className="space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            필요시 수동으로 ETF 데이터를 업데이트할 수 있습니다.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleUpdateData('VIG')}
              disabled={updating === 'VIG'}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                updating === 'VIG'
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {updating === 'VIG' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>업데이트 중...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>VIG 업데이트</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleUpdateData('QLD')}
              disabled={updating === 'QLD'}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                updating === 'QLD'
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {updating === 'QLD' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>업데이트 중...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>QLD 업데이트</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* 테마 설정 */}
      <Card title="테마 설정">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-1">다크 모드</div>
              <div className="text-xs text-slate-400">
                현재 다크모드가 기본으로 설정되어 있습니다.
              </div>
            </div>
            <div className="px-4 py-2 bg-slate-700 rounded-lg text-slate-300">
              활성화됨
            </div>
          </div>
        </div>
      </Card>

      {/* 기본 티커 설정 */}
      <Card title="기본 설정">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-300">
              기본 분석 티커
            </label>
            <input
              type="text"
              defaultValue={localStorage.getItem('defaultTicker') || 'VIG'}
              onChange={(e) => localStorage.setItem('defaultTicker', e.target.value.toUpperCase())}
              placeholder="VIG, QLD, AAPL 등"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-light-blue"
            />
            <p className="text-xs text-slate-400 mt-1">
              대시보드에서 기본으로 분석할 티커를 설정합니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 알림 설정 */}
      <Card title="알림 설정">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-1">스위칭 시그널 알림</div>
              <div className="text-xs text-slate-400">
                스위칭 시그널 발생 시 알림을 받습니다.
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked={localStorage.getItem('alertSwitching') !== 'false'}
              onChange={(e) => localStorage.setItem('alertSwitching', String(e.target.checked))}
              className="w-5 h-5 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-1">가격 변동 알림</div>
              <div className="text-xs text-slate-400">
                큰 가격 변동 시 알림을 받습니다.
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked={localStorage.getItem('alertPrice') !== 'false'}
              onChange={(e) => localStorage.setItem('alertPrice', String(e.target.checked))}
              className="w-5 h-5 rounded"
            />
          </div>
        </div>
      </Card>

      {/* 저장 버튼 */}
      <button
        onClick={handleSaveSettings}
        className="w-full px-6 py-4 rounded-lg font-semibold bg-light-blue text-deep-navy hover:bg-blue-400 transition-all flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        <span>설정 저장</span>
      </button>
    </div>
  );
};



