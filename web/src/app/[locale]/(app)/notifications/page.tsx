'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from '@/navigation';
import {
    Bell,
    Check,
    Trash2,
    AlertTriangle,
    Info,
    Clock,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    CheckSquare,
    Eye,
    RefreshCw
} from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message?: string;
    notificationType: string;
    linkUrl?: string;
    isRead: boolean;
    createdAt: string;
    priority: 'urgent' | 'important' | 'info';
}

const priorityConfig = {
    urgent: {
        icon: AlertTriangle,
        bg: 'bg-rose-50 text-rose-700 border-rose-100',
        iconColor: 'text-rose-500',
        label: 'Critique'
    },
    important: {
        icon: Clock,
        bg: 'bg-amber-50 text-amber-700 border-amber-100',
        iconColor: 'text-amber-500',
        label: 'Important'
    },
    info: {
        icon: Info,
        bg: 'bg-blue-50 text-blue-700 border-blue-100',
        iconColor: 'text-blue-500',
        label: 'Info'
    }
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Filters & Pagination State
    const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'stock' | 'finance' | 'info'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'unread'>('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/notifications');
            if (res && res.data) {
                setNotifications(res.data || []);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        setActionLoading(true);
        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ action: 'mark_all_read' })
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const markRead = async (id: string) => {
        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ action: 'mark_read', notificationId: id })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await apiFetch(`/api/notifications?id=${id}`, {
                method: 'DELETE'
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const deleteReadNotifications = async () => {
        setActionLoading(true);
        try {
            await apiFetch('/api/notifications?clearRead=true', {
                method: 'DELETE'
            });
            setNotifications(prev => prev.filter(n => !n.isRead));
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    // Filter logic
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'all') return true;
        if (activeTab === 'critical') return n.priority === 'urgent';
        if (activeTab === 'stock') return n.notificationType === 'low-stock-alert';
        if (activeTab === 'finance') return n.notificationType === 'unpaid-invoice' || n.notificationType === 'payment-received';
        if (activeTab === 'info') return n.notificationType === 'new-customer';
        return true;
    });

    // Sort logic
    const sortedNotifications = [...filteredNotifications].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'unread') {
            if (a.isRead === b.isRead) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return a.isRead ? 1 : -1;
        }
        return 0;
    });

    // Pagination logic
    const totalItems = sortedNotifications.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedNotifications = sortedNotifications.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 if filter or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, sortBy]);

    const formatFullDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-DZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                        <Bell className="text-blue-600 w-6 h-6" />
                        Centre de Notifications
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Consultez, filtrez et gérez toutes les alertes système, factures impayées et statuts de stocks de cameleon colors.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <button
                        onClick={fetchNotifications}
                        disabled={loading || actionLoading}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualiser
                    </button>
                    <button
                        onClick={markAllRead}
                        disabled={loading || actionLoading || !notifications.some(n => !n.isRead)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 disabled:opacity-50 border border-blue-100"
                    >
                        <CheckSquare size={14} />
                        Tout marquer comme lu
                    </button>
                    <button
                        onClick={deleteReadNotifications}
                        disabled={loading || actionLoading || !notifications.some(n => n.isRead)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 disabled:opacity-50 border border-rose-100"
                    >
                        <Trash2 size={14} />
                        Supprimer les lues
                    </button>
                </div>
            </div>

            {/* Filter and sorting area */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-sm">
                {/* Tabs */}
                <div className="flex overflow-x-auto gap-1.5 pb-2 md:pb-0 scrollbar-none select-none">
                    {[
                        { id: 'all', label: 'Toutes' },
                        { id: 'critical', label: 'Critiques' },
                        { id: 'stock', label: 'Stocks' },
                        { id: 'finance', label: 'Finance' },
                        { id: 'info', label: 'Infos' }
                    ].map((tab) => {
                        const count = notifications.filter(n => {
                            if (tab.id === 'all') return true;
                            if (tab.id === 'critical') return n.priority === 'urgent';
                            if (tab.id === 'stock') return n.notificationType === 'low-stock-alert';
                            if (tab.id === 'finance') return n.notificationType === 'unpaid-invoice' || n.notificationType === 'payment-received';
                            if (tab.id === 'info') return n.notificationType === 'new-customer';
                            return false;
                        }).length;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                                }`}
                            >
                                {tab.label}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.id
                                        ? 'bg-white/25 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Trier par :</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="recent">Plus récentes</option>
                        <option value="oldest">Plus anciennes</option>
                        <option value="unread">Non lues en premier</option>
                    </select>
                </div>
            </div>

            {/* List section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-slate-100">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-6 flex gap-4 animate-pulse">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                    <div className="h-2 bg-slate-100 rounded w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : paginatedNotifications.length === 0 ? (
                    <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                            <Bell size={28} />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Aucune notification trouvée</h3>
                            <p className="text-xs text-slate-400">
                                Il n'y a pas de notifications correspondant aux filtres ou catégories sélectionnés.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {paginatedNotifications.map((n) => {
                            const config = priorityConfig[n.priority as keyof typeof priorityConfig] || priorityConfig.info;
                            const Icon = config.icon;

                            return (
                                <div
                                    key={n.id}
                                    className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group ${
                                        !n.isRead ? 'bg-blue-50/20' : ''
                                    }`}
                                >
                                    <div className="flex gap-4 items-start min-w-0 flex-1">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-4 ring-slate-50 bg-white border border-slate-100 shrink-0`}>
                                            <Icon size={18} className={config.iconColor} />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className={`text-sm leading-snug ${!n.isRead ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                    {n.title}
                                                </h3>
                                                {!n.isRead && (
                                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                                                )}
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${config.bg}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            {n.message && (
                                                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{n.message}</p>
                                            )}
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                                <span>{formatFullDate(n.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons on hover / focus */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {!n.isRead && (
                                            <button
                                                onClick={() => markRead(n.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Marquer comme lu"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        {n.linkUrl && (
                                            <button
                                                onClick={() => router.push(n.linkUrl as any)}
                                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                                title="Consulter le lien"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(n.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Supprimer la notification"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination footer */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/20 select-none">
                        <span className="text-xs font-bold text-slate-400">
                            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalItems)} sur {totalItems}
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-black text-slate-700 px-3">
                                Page {currentPage} sur {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
