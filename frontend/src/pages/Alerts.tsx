import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Loading } from '../components/common/Loading';
import toast from 'react-hot-toast';
import { Bell, CheckCircle, AlertCircle, Info, Settings } from 'lucide-react';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadAlerts();
    // 실시간 알림 체크 (30초마다)
    const interval = setInterval(() => {
      checkNewAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // 실제 알림은 백엔드에서 가져오지만, 현재는 로컬 스토리지 사용
      const savedAlerts = localStorage.getItem('alerts');
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      } else {
        // 초기 더미 알림
        const initialAlerts: Alert[] = [
          {
            id: '1',
            type: 'success',
            title: 'RSI 30 돌파',
            message: 'VIG의 RSI가 30 이하로 떨어져 단기 반등 신호가 발생했습니다.',
            timestamp: new Date().toISOString(),
            read: false,
          },
          {
            id: '2',
            type: 'warning',
            title: '200MA 상향 돌파',
            message: 'QLD가 200일 이동평균선을 상향 돌파했습니다. QLD 스위칭 가능성이 상승했습니다.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false,
          },
        ];
        setAlerts(initialAlerts);
        localStorage.setItem('alerts', JSON.stringify(initialAlerts));
      }
    } catch (error: any) {
      toast.error('알림 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkNewAlerts = async () => {
    // 실제로는 백엔드에서 새로운 알림을 확인
    // 여기서는 시뮬레이션
  };

  const markAsRead = (id: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    );
    setAlerts(updatedAlerts);
    localStorage.setItem('alerts', JSON.stringify(updatedAlerts));
  };

  const markAllAsRead = () => {
    const updatedAlerts = alerts.map(alert => ({ ...alert, read: true }));
    setAlerts(updatedAlerts);
    localStorage.setItem('alerts', JSON.stringify(updatedAlerts));
    toast.success('모든 알림을 읽음으로 표시했습니다.');
  };

  const deleteAlert = (id: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== id);
    setAlerts(updatedAlerts);
    localStorage.setItem('alerts', JSON.stringify(updatedAlerts));
    toast.success('알림이 삭제되었습니다.');
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-light-blue" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-400 bg-green-900/20';
      case 'warning':
        return 'border-yellow-400 bg-yellow-900/20';
      case 'error':
        return 'border-red-400 bg-red-900/20';
      default:
        return 'border-light-blue bg-blue-900/20';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read;
    if (filter === 'read') return alert.read;
    return true;
  });

  const unreadCount = alerts.filter(alert => !alert.read).length;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* 알림 필터 및 관리 */}
      <Card title="알림 센터" tooltip="시장 신호 및 중요 이벤트 알림">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-light-blue text-deep-navy'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              전체 ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all relative ${
                filter === 'unread'
                  ? 'bg-light-blue text-deep-navy'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              읽지 않음
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'read'
                  ? 'bg-light-blue text-deep-navy'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              읽음
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all text-sm"
            >
              모두 읽음으로 표시
            </button>
          )}
        </div>
      </Card>

      {/* 알림 목록 */}
      <Card title={`알림 목록 (${filteredAlerts.length}개)`}>
        {filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  alert.read
                    ? 'bg-slate-800 border-slate-700 opacity-70'
                    : getAlertColor(alert.type)
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {alert.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {new Date(alert.timestamp).toLocaleString('ko-KR')}
                        </span>
                        {!alert.read && (
                          <span className="px-2 py-1 text-xs bg-light-blue text-deep-navy rounded">
                            새
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">
                      {alert.message}
                    </p>
                    <div className="flex gap-2">
                      {!alert.read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-all"
                        >
                          읽음 표시
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-3 py-1 text-xs bg-red-900/50 text-red-400 rounded hover:bg-red-900/70 transition-all"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>알림이 없습니다</p>
          </div>
        )}
      </Card>

      {/* 알림 설정 */}
      <Card title="알림 설정" tooltip="알림 유형 및 채널 설정">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3 text-slate-300">알림 유형</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">RSI 신호 알림</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">200MA 돌파 알림</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">FGI 급변 알림</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">스위칭 신호 알림</span>
              </label>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-700">
            <h4 className="font-semibold mb-3 text-slate-300">알림 채널</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">PC 알림</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">이메일 알림</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">Telegram 알림 (개발 중)</span>
              </label>
            </div>
          </div>

          <button className="w-full mt-6 px-4 py-3 rounded-lg bg-light-blue text-deep-navy font-semibold hover:bg-blue-400 transition-all">
            설정 저장
          </button>
        </div>
      </Card>
    </div>
  );
};



