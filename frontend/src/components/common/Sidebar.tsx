import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BarChart3, 
  Signal, 
  Briefcase,
  Calculator,
  Newspaper,
  Bell,
  Settings 
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '대시보드', icon: LayoutDashboard },
  { path: '/etf-analysis', label: 'ETF 분석', icon: TrendingUp },
  { path: '/market-sentiment', label: '시장 심리', icon: BarChart3 },
  { path: '/switching-signal', label: '스위칭 시그널', icon: Signal },
  { path: '/portfolio', label: '포트폴리오', icon: Briefcase },
  { path: '/backtest', label: '백테스트', icon: Calculator },
  { path: '/news-analysis', label: '뉴스 분석', icon: Newspaper },
  { path: '/alerts', label: '알림 센터', icon: Bell },
  { path: '/settings', label: '설정', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-700 z-10">
      <div className="p-6">
        <h1 className="text-xl font-bold text-light-blue mb-8">DM 시황 분석기</h1>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-light-blue text-deep-navy font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

