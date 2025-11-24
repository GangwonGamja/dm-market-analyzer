import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
  onRefresh?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onRefresh }) => {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 마지막 업데이트 시간 가져오기
    const saved = localStorage.getItem('lastUpdate');
    if (saved) {
      setLastUpdate(new Date(saved).toLocaleString('ko-KR'));
    }
  }, []);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      const now = new Date().toISOString();
      localStorage.setItem('lastUpdate', now);
      setLastUpdate(new Date(now).toLocaleString('ko-KR'));
    }
  };

  const handleToggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-deep-navy">
      <Sidebar />
      <Topbar 
        lastUpdate={lastUpdate} 
        onRefresh={handleRefresh}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
      />
      <main className="ml-64 mt-16 p-6">
        {children}
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-slate-800 text-white border border-slate-700',
        }}
      />
    </div>
  );
};



