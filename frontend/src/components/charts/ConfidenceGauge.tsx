import React from 'react';

interface ConfidenceGaugeProps {
  confidence: number; // 0-1
  size?: number;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  confidence,
  size = 200,
}) => {
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence * circumference);
  const percentage = confidence * 100;

  const getColor = () => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    if (percentage >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getLabel = () => {
    if (percentage >= 80) return '매우 높음';
    if (percentage >= 60) return '높음';
    if (percentage >= 40) return '보통';
    return '낮음';
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#374151"
            strokeWidth="16"
            fill="none"
          />
          {/* 진행 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth="16"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color: getColor() }}>
            {percentage.toFixed(0)}%
          </div>
          <div className="text-sm text-slate-400 mt-1">{getLabel()}</div>
        </div>
      </div>
    </div>
  );
};

