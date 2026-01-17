
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { SyscallData } from '../types';

interface SyscallChartProps {
  data: SyscallData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-sm">
        <p className="font-bold text-white mb-1">{label}</p>
        <p className="text-slate-300">Baseline: <span className="font-mono">{payload[0].value}</span></p>
        <p className="text-sky-400">Test: <span className="font-mono">{payload[1].value}</span></p>
        <p className="text-orange-400">Deviation: <span className="font-mono">{payload[1].payload.deviation.toFixed(2)}%</span></p>
      </div>
    );
  }
  return null;
};

const SyscallChart: React.FC<SyscallChartProps> = ({ data }) => {
  return (
    <div className="h-[400px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
          />
          <Bar 
            name="Baseline" 
            dataKey="baseline" 
            fill="#334155" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            name="Test Frequency" 
            dataKey="test" 
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.deviation > 30 ? '#ef4444' : '#0ea5e9'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SyscallChart;
