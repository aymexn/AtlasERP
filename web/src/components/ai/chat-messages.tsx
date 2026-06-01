'use client';

import React from 'react';

interface ChatMessageContentProps {
  content: string;
}

type RenderBlock = 
  | { type: 'text'; content: string }
  | { type: 'kpi_group'; cards: { color: string; label: string; value: string }[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] };

const currencyRegex = /(\d+(?:[\s,.]\d+)*\s*DA)/gi;

// Helper to format text with bold segments and Algerian Dinar inline flex badges
export const formatTextWithCurrency = (textStr: string) => {
  if (!textStr) return null;
  
  // Split by bold markup **text**
  const boldParts = textStr.split(/\*\*(.*?)\*\*/g);
  return boldParts.map((boldPart, bIdx) => {
    const isBold = bIdx % 2 === 1;
    
    // Now split the bold (or non-bold) part by currency
    const currencyParts = boldPart.split(currencyRegex);
    const content = currencyParts.map((part, cIdx) => {
      const isCurrency = cIdx % 2 === 1;
      if (isCurrency) {
        return (
          <span
            key={cIdx}
            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 text-indigo-400 border border-indigo-100/50 mx-0.5 whitespace-nowrap"
          >
            {part}
          </span>
        );
      }
      return part;
    });

    if (isBold) {
      return (
        <strong key={bIdx} className="font-extrabold text-slate-900 dark:text-white">
          {content}
        </strong>
      );
    }
    return <span key={bIdx}>{content}</span>;
  });
};

const parseKpiLine = (line: string) => {
  // Pattern 1: • Label : XXXXX DA
  const kpiMatch1 = line.match(/^\s*[-•]\s*(.*?)\s*:\s*([\d\s,.]+\s*DA)\s*$/i);
  if (kpiMatch1) {
    const label = kpiMatch1[1].trim();
    const value = kpiMatch1[2].trim();
    
    let color = 'blue';
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('facturé') || lowerLabel.includes('bénéfice')) {
      color = 'blue';
    } else if (lowerLabel.includes('encaissé') || lowerLabel.includes('disponible')) {
      color = 'emerald';
    } else if (lowerLabel.includes('encours') || lowerLabel.includes('dette') || lowerLabel.includes('manquant')) {
      color = 'amber';
    }
    
    return { label, value, color };
  }

  // Pattern 2: [KPI_CARD:COLOR] Label : Value
  const kpiMatch2 = line.match(/^\[KPI_CARD:(\w+)\]\s*(.*?)\s*:\s*(.*)$/i);
  if (kpiMatch2) {
    const colorCode = kpiMatch2[1].toLowerCase();
    const label = kpiMatch2[2].trim();
    const value = kpiMatch2[3].trim();
    
    let color = 'blue';
    const lowerLabel = label.toLowerCase();
    if (colorCode === 'green' || colorCode === 'emerald' || lowerLabel.includes('encaissé') || lowerLabel.includes('disponible')) {
      color = 'emerald';
    } else if (colorCode === 'red' || colorCode === 'amber' || lowerLabel.includes('encours') || lowerLabel.includes('dette') || lowerLabel.includes('manquant')) {
      color = 'amber';
    } else {
      color = 'blue';
    }
    
    return { label, value, color };
  }

  return null;
};

export const parseMessageContent = (text: string): RenderBlock[] => {
  const lines = text.split('\n');
  const blocks: RenderBlock[] = [];
  
  let currentKpiGroup: { color: string; label: string; value: string }[] = [];
  let currentTableRows: string[][] = [];
  let currentTableHeaders: string[] = [];
  let isInTable = false;
  let currentListItems: string[] = [];
  let isInList = false;

  const flushKpis = () => {
    if (currentKpiGroup.length > 0) {
      blocks.push({ type: 'kpi_group', cards: currentKpiGroup });
      currentKpiGroup = [];
    }
  };

  const flushTable = () => {
    if (currentTableRows.length > 0 || currentTableHeaders.length > 0) {
      blocks.push({ type: 'table', headers: currentTableHeaders, rows: currentTableRows });
      currentTableHeaders = [];
      currentTableRows = [];
    }
    isInTable = false;
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      blocks.push({ type: 'list', items: currentListItems });
      currentListItems = [];
    }
    isInList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Detect KPI Card
    const kpiData = parseKpiLine(line);
    if (kpiData) {
      flushTable();
      flushList();
      currentKpiGroup.push(kpiData);
      continue;
    } else {
      flushKpis();
    }

    // 2. Detect Table row
    if (trimmed.startsWith('|')) {
      flushList();
      const parts = trimmed.split('|').map(p => p.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSeparator = parts.every(p => p.startsWith('---') || p.match(/^-+$/));
      
      if (isSeparator) {
        isInTable = true;
        continue;
      }

      if (!isInTable) {
        currentTableHeaders = parts;
        isInTable = true;
      } else {
        currentTableRows.push(parts);
      }
      continue;
    } else {
      if (isInTable) {
        flushTable();
      }
    }

    // 3. Detect Normal List Item
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
    if (isBullet) {
      flushTable();
      isInList = true;
      currentListItems.push(trimmed.substring(1).trim());
      continue;
    } else if (isInList) {
      flushList();
    }

    // 4. Plain Text block
    if (trimmed !== '') {
      blocks.push({ type: 'text', content: line });
    }
  }

  flushKpis();
  flushTable();
  flushList();

  return blocks;
};

export default function ChatMessageContent({ content }: ChatMessageContentProps) {
  if (!content) return null;
  const blocks = parseMessageContent(content);

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        if (block.type === 'kpi_group') {
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              {block.cards.map((card, cidx) => {
                const colors: Record<string, string> = {
                  blue: 'border-l-blue-600',
                  emerald: 'border-l-emerald-600',
                  amber: 'border-l-amber-500'
                };
                const borderAccent = colors[card.color] || 'border-l-slate-400';

                return (
                  <div
                    key={cidx}
                    className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm border-l-4 ${borderAccent} p-4 flex flex-col justify-center`}
                  >
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      {card.label}
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {formatTextWithCurrency(card.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={idx} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 my-4 shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-850">
                    {block.headers.map((header, hidx) => (
                      <th
                        key={hidx}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase"
                      >
                        {formatTextWithCurrency(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {block.rows.map((row, ridx) => (
                    <tr
                      key={ridx}
                      className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-950/40 hover:bg-slate-100/30 dark:hover:bg-slate-850 transition-colors"
                    >
                      {row.map((cell, cidx) => (
                        <td
                          key={cidx}
                          className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300"
                        >
                          {formatTextWithCurrency(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={idx} className="list-disc pl-5 my-2 space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-355">
              {block.items.map((item, iidx) => (
                <li key={iidx} className="marker:text-indigo-500 font-medium">
                  {formatTextWithCurrency(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-sm leading-relaxed my-1.5 text-slate-700 dark:text-slate-300 font-medium">
            {formatTextWithCurrency(block.content)}
          </p>
        );
      })}
    </div>
  );
}
