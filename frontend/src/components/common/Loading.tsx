import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-blue"></div>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-700 rounded ${className}`}></div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="card">
      <Skeleton className="h-4 w-1/4 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
};



