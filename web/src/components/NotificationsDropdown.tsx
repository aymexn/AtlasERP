'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from '@/navigation';
import {
    Bell,
    X,
    CheckCheck,
    AlertTriangle,
    Info,
    ChevronRight,
    Clock
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

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return "A l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
}

const priorityConfig = {
    urgent: {
        icon: AlertTriangle,
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-700 border-red-200',
        label: 'Urgent',
        iconColor: 'text-red-500',
        ringColor: 'ring-red-100',
    },
    important: {
        icon: Clock,
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        label: 'Important',
        iconColor: 'text-amber-500',
        ringColor: 'ring-amber-100',
    },
    info: {
        icon: Info,
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        label: 'Info',
        iconColor: 'text-emerald-500',
        ringColor: 'ring-emerald-100',
    }
};

export default function NotificationsDropdown() {
    // Short-circuit routing on intensive creation forms to avoid thread blocking
    if (typeof window !== 'undefined' && window.location.pathname.includes('/new')) {
        return null; // Instantly kill and skip background polling execution loops
    }

    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async (force = false) => {
        // Skip if not forced and user is active on an input to avoid interrupting typing or causing timeouts
        if (!force && typeof document !== 'undefined' && document.activeElement) {
            const el = document.activeElement;
            const isInput = el.tagName === 'INPUT' || 
                            el.tagName === 'TEXTAREA' || 
                            el.hasAttribute('contenteditable') || 
                            el.closest('[contenteditable="true"]');
            if (isInput) {
                return;
            }
        }
        try {
            const res = await apiFetch('/api/notifications');
            if (res && res.data) {
                setNotifications(res.data || []);
                setUnreadCount(res.unreadCount || 0);
            }
        } catch {
            // Silent fail
        }
    };

    useEffect(() => {
        fetchNotifications(true); // Force fetch on mount
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAllRead = async () => {
        setLoading(true);
        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ action: 'mark_all_read' })
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    };

    const markRead = async (id: string) => {
        try {
            await apiFetch('/api/notifications', {
                method: 'PUT',
                body: JSON.stringify({ action: 'mark_read', notificationId: id })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // Silent fail
        }
    };

    const handleClick = (n: Notification) => {
        markRead(n.id);
        if (n.linkUrl) router.push(n.linkUrl as any);
        setOpen(false);
    };

    const urgentCount = notifications.filter(n => !n.isRead && n.priority === 'urgent').length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id="notifications-bell"
                onClick={() => setOpen(prev => !prev)}
                className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black text-white border-2 border-white ${urgentCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-slate-500" />
                            <span className="font-black text-slate-800 text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {unreadCount} non lues
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    disabled={loading}
                                    className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    <CheckCheck size={12} />
                                    Tout lire
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[400px]">
                        {notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center gap-3 text-slate-300">
                                <Bell size={32} />
                                <p className="text-[11px] font-black uppercase tracking-widest">Aucune notification</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((n) => {
                                    const config = priorityConfig[n.priority] || priorityConfig.info;
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => handleClick(n)}
                                            className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-slate-50 transition-all group ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ring-2 ${config.ringColor} bg-white`}>
                                                <Icon size={16} className={config.iconColor} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm leading-tight ${!n.isRead ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'}`}>
                                                        {n.title}
                                                    </p>
                                                    {!n.isRead && (
                                                        <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${config.dot}`} />
                                                    )}
                                                </div>
                                                {n.message && (
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${config.badge}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                                                </div>
                                            </div>
                                            {n.linkUrl && (
                                                <ChevronRight size={14} className="flex-shrink-0 text-slate-300 group-hover:text-slate-500 mt-2 transition-colors" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => { router.push('/collaboration/activity' as any); setOpen(false); }}
                                className="w-full text-center text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                            >
                                Voir toutes les activites
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
