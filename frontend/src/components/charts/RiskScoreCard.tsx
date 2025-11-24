import React from 'react';

interface RiskScoreCardProps {
  riskScore: number; // 0-100
  riskGrade: 'Low' | 'Medium' | 'High';
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  riskScore,
  riskGrade,
}) => {
  const getColor = () => {
    if (riskScore <= 30) return '#10B981'; // Green
    if (riskScore <= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getGradeColor = () => {
    if (riskGrade === 'Low') return 'text-green-400';
    if (riskGrade === 'Medium') return 'text-yellow-400';
    return 'text-red-400';
  };

  // 원형 그래프를 위한 계산
  const circumference = 2 * Math.PI * 90; // 반지름 90
  const offset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48">
          {/* 배경 원 */}
          <circle
            cx="96"
            cy="96"
            r="90"
            stroke="#374151"
            strokeWidth="12"
            fill="none"
          />
          {/* 진행 원 */}
          <circle
            cx="96"
            cy="96"
            r="90"
            stroke={getColor()}
            strokeWidth="12"
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
            {riskScore.toFixed(0)}
          </div>
          <div className={`text-lg font-semibold mt-2 ${getGradeColor()}`}>
            {riskGrade}
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-sm text-slate-400 mb-1">Risk Score</div>
        <div className="text-xs text-slate-500">
          {riskScore <= 30 && '저위험 - 안정적인 투자 환경'}
          {riskScore > 30 && riskScore <= 70 && '중위험 - 주의 깊은 관찰 필요'}
          {riskScore > 70 && '고위험 - 신중한 투자 결정 권장'}
        </div>
      </div>
    </div>
  );
};

