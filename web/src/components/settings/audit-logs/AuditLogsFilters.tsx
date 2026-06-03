'use client';

import React, { useState } from 'react';
import { Search, Calendar, User, Shield, RefreshCw } from 'lucide-react';
import { User as UserType } from '../users/UsersTable';

interface AuditLogsFiltersProps {
  users: UserType[];
  onFilterChange: (filters: {
    userId: string;
    action: string;
    module: string;
    from: string;
    to: string;
    q: string;
  }) => void;
}

export default function AuditLogsFilters({ users, onFilterChange }: AuditLogsFiltersProps) {
  const [q, setQ] = useState('');
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [module, setModule] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ q, userId, action, module, from, to });
  };

  const handleReset = () => {
    setQ('');
    setUserId('');
    setAction('');
    setModule('');
    setFrom('');
    setTo('');
    onFilterChange({ q: '', userId: '', action: '', module: '', from: '', to: '' });
  };

  // Modules catalog based on our DB entities
  const modules = [
    { value: 'User', label: 'Utilisateurs' },
    { value: 'Role', label: 'Rôles & Permissions' },
    { value: 'Product', label: 'Articles & Catalogue' },
    { value: 'SalesOrder', label: 'Commandes Clients' },
    { value: 'PurchaseOrder', label: 'Commandes Fournisseurs' },
    { value: 'StockMovement', label: 'Mouvements Stocks' },
    { value: 'Supplier', label: 'Fournisseurs' },
    { value: 'Customer', label: 'Clients' }
  ];

  return (
    <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par description, ID..."
            className="w-full h-11 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none transition-all font-bold text-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* User Select */}
        <div className="relative">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full h-11 px-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none font-bold text-xs text-slate-700 transition-all appearance-none cursor-pointer"
          >
            <option value="">Tous les utilisateurs</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>
        </div>

        {/* Action Select */}
        <div className="relative">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full h-11 px-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none font-bold text-xs text-slate-700 transition-all appearance-none cursor-pointer"
          >
            <option value="">Toutes les actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="EXPORT">EXPORT</option>
          </select>
        </div>

        {/* Module Select */}
        <div className="relative">
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="w-full h-11 px-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl outline-none font-bold text-xs text-slate-700 transition-all appearance-none cursor-pointer"
          >
            <option value="">Tous les modules</option>
            {modules.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="relative flex items-center bg-slate-50 border-2 border-transparent focus-within:bg-white focus-within:border-blue-600 rounded-2xl px-4 h-11">
          <Calendar size={14} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="date"
            placeholder="Du"
            className="bg-transparent border-none outline-none font-bold text-xs text-slate-700 w-full"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="relative flex items-center bg-slate-50 border-2 border-transparent focus-within:bg-white focus-within:border-blue-600 rounded-2xl px-4 h-11">
          <Calendar size={14} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="date"
            placeholder="Au"
            className="bg-transparent border-none outline-none font-bold text-xs text-slate-700 w-full"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {/* Search & Reset Buttons */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex gap-2">
          <button
            type="submit"
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-tighter transition-all"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="h-11 w-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center transition-all"
            title="Réinitialiser"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
