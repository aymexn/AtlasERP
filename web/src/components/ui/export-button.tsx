'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns: { header: string; key: string }[];
}

export function ExportButton({ data, filename, columns }: ExportButtonProps) {
  const t = useTranslations('common');

  const handleExport = () => {
    if (!data || data.length === 0) return;

    // CSV Header
    const headers = columns.map(c => c.header).join(',');
    
    // CSV Rows
    const rows = data.map(item => {
      return columns.map(col => {
        let value = item[col.key];
        
        // Handle nested objects (simple level)
        if (col.key.includes('.')) {
          const keys = col.key.split('.');
          value = keys.reduce((obj, key) => obj?.[key], item);
        }

        // Escape commas and quotes
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
    >
      <Download size={14} />
      {t('export' as any) || 'Exporter CSV'}
    </button>
  );
}
