import React from 'react';
import { Moon, Sun, User, RefreshCw } from 'lucide-react';

interface TopbarProps {
  lastUpdate?: string;
  onRefresh?: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  lastUpdate, 
  onRefresh,
  onToggleTheme,
  isDark = true 
}) => {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-slate-800 border-b border-slate-700 z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <span className="text-slate-400">{today}</span>
        {lastUpdate && (
          <span className="text-sm text-slate-500">
            마지막 업데이트: {lastUpdate}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            title="데이터 새로고침"
          >
            <RefreshCw className="w-5 h-5 text-light-blue" />
          </button>
        )}
        
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            title="테마 전환"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-light-blue" />
            )}
          </button>
        )}
        
        <button
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          title="사용자 설정"
        >
          <User className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};



