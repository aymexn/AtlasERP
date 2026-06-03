'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface PermissionCheckboxProps {
  id: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string | null;
}

export default function PermissionCheckbox({
  id,
  checked,
  disabled,
  onChange,
  label,
  description
}: PermissionCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all select-none ${
        disabled
          ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
          : 'bg-white border-slate-100 hover:border-slate-200 cursor-pointer'
      }`}
    >
      <div className="relative flex items-center mt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer appearance-none h-5 w-5 rounded-md border-2 border-slate-200 checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition-all cursor-pointer disabled:cursor-not-allowed"
        />
        {checked && (
          <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none stroke-[3]" />
        )}
      </div>
      <div className="text-left">
        <span className="block font-black text-slate-900 text-xs tracking-tight">{label}</span>
        {description && (
          <span className="block text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">{description}</span>
        )}
      </div>
    </label>
  );
}
