import React, { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface CardProps {
  title?: string;
  children: ReactNode;
  tooltip?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, tooltip, className = '' }) => {
  return (
    <div className={`card card-hover ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-light-blue">{title}</h3>
          {tooltip && (
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-slate-900 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};



