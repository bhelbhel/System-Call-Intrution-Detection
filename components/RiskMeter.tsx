
import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  level: RiskLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ level }) => {
  const levels = [
    { id: RiskLevel.LOW, color: 'bg-emerald-500', label: 'Low' },
    { id: RiskLevel.MEDIUM, color: 'bg-yellow-500', label: 'Medium' },
    { id: RiskLevel.HIGH, color: 'bg-orange-500', label: 'High' },
    { id: RiskLevel.CRITICAL, color: 'bg-red-600', label: 'Critical' }
  ];

  const activeIndex = levels.findIndex(l => l.id === level);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-medium uppercase tracking-wider text-slate-400">
        <span>Risk Severity</span>
        <span className={levels[activeIndex].color.replace('bg-', 'text-')}>
          {levels[activeIndex].label}
        </span>
      </div>
      <div className="flex h-2 w-full gap-1">
        {levels.map((l, idx) => (
          <div
            key={l.id}
            className={`flex-1 rounded-full transition-all duration-500 ${
              idx <= activeIndex ? l.color : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default RiskMeter;
