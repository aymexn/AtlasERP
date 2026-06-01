'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AgingChartProps {
  invoices: any[];
}

export function AgingChart({ invoices }: AgingChartProps) {
  // Compute aging buckets
  const now = new Date();
  let b0_30 = 0;
  let b31_60 = 0;
  let b61_90 = 0;
  let b90Plus = 0;

  invoices.forEach(inv => {
    const remaining = Number(inv.amountRemaining || 0);
    if (remaining > 0 && inv.dueDate && new Date() > new Date(inv.dueDate)) {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24));
      
      if (daysOverdue <= 30) b0_30 += remaining;
      else if (daysOverdue <= 60) b31_60 += remaining;
      else if (daysOverdue <= 90) b61_90 += remaining;
      else b90Plus += remaining;
    }
  });

  const data = [
    { label: '0-30 jours', value: b0_30, color: '#f59e0b' },   // Amber
    { label: '31-60 jours', value: b31_60, color: '#f97316' }, // Orange
    { label: '61-90 jours', value: b61_90, color: '#ef4444' }, // Red
    { label: '> 90 jours', value: b90Plus, color: '#b91c1c' }, // Dark Red
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-xl">
          <p className="font-bold text-slate-500 mb-1">{label} de retard</p>
          <p className="text-slate-900 font-black text-lg">
            {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
          />
          <YAxis 
            dataKey="label" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            width={90}
          />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
