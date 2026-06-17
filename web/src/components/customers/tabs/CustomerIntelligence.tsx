'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    MessageSquare, 
    ArrowRight, 
    Package, 
    Clock, 
    Plus, 
    Phone, 
    Mail, 
    Users, 
    FileText 
} from 'lucide-react';
import { customersService } from '@/services/customers';
import { toast } from 'sonner';

export function CustomerIntelligence({ customerId }: { customerId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        type: 'CALL',
        direction: 'OUTBOUND',
        subject: '',
        content: '',
        durationMinutes: ''
    });

    useEffect(() => {
        fetchIntel();
    }, [customerId]);

    const fetchIntel = async () => {
        try {
            const res = await customersService.getIntelligence(customerId);
            setData(res);
        } catch (error) {
            console.error("Failed to load intelligence", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.content.trim()) {
            toast.error("Le sujet et le contenu sont requis.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/customers/${customerId}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: form.type,
                    direction: form.direction,
                    subject: form.subject,
                    content: form.content,
                    durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erreur de sauvegarde de l'interaction");
            }
            toast.success("Interaction enregistrée avec succès.");
            setShowModal(false);
            setForm({
                type: 'CALL',
                direction: 'OUTBOUND',
                subject: '',
                content: '',
                durationMinutes: ''
            });
            
            // Silent refresh of the intelligence view
            const updated = await customersService.getIntelligence(customerId);
            setData(updated);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erreur lors de l'enregistrement");
        } finally {
            setSubmitting(false);
        }
    };

    const getInteractionIcon = (type: string) => {
        switch (type) {
            case 'CALL':
                return <Phone size={14} className="text-blue-600 group-hover:text-white" />;
            case 'EMAIL':
                return <Mail size={14} className="text-emerald-600 group-hover:text-white" />;
            case 'MEETING':
                return <Users size={14} className="text-indigo-600 group-hover:text-white" />;
            case 'NOTE':
            default:
                return <FileText size={14} className="text-slate-600 group-hover:text-white" />;
        }
    };

    const getInteractionColor = (type: string) => {
        switch (type) {
            case 'CALL':
                return 'bg-blue-50 group-hover:bg-blue-600';
            case 'EMAIL':
                return 'bg-emerald-50 group-hover:bg-emerald-600';
            case 'MEETING':
                return 'bg-indigo-50 group-hover:bg-indigo-600';
            case 'NOTE':
            default:
                return 'bg-slate-100 group-hover:bg-slate-600';
        }
    };

    if (loading) {
        return <div className="h-48 flex items-center justify-center animate-pulse text-slate-400">Analyse de l'intelligence client en cours...</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* AI Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 flex gap-4 items-start shadow-sm">
                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                    <Brain size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-indigo-950 mb-2 flex items-center gap-2">
                        Synthèse IA
                        <Badge variant="default" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">BETA</Badge>
                    </h3>
                    <p className="text-indigo-900/80 leading-relaxed font-medium">
                        {data.summary}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health & Sentiment */}
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                            <TrendingUp size={16} /> Santé Globale
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-slate-600">Score de Santé</span>
                                <span className="text-2xl font-black text-slate-800">{data.healthScore}/100</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${data.healthScore > 80 ? 'bg-green-500' : data.healthScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${data.healthScore}%` }}
                                />
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-600">Sentiment Récent</span>
                            <Badge variant="success" className="border-green-200 text-green-700 bg-green-50 px-3 py-1">
                                {data.sentiment || 'NEUTRE'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                            <Package size={16} /> Top Produits Achetés
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(data.topProducts || []).length > 0 ? data.topProducts.map((p: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-slate-700 truncate mr-2">{p.name}</span>
                                    <span className="font-bold text-primary whitespace-nowrap">{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(p.revenue)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.max(10, (p.revenue / (data.topProducts[0]?.revenue || 1)) * 100)}%` }} />
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-slate-400 text-center py-4">Aucun produit acheté récemment</div>
                        )}
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="md:col-span-2 border-none shadow-xl shadow-slate-200/40">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                            <Clock size={16} /> Dernières Interactions
                        </CardTitle>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95"
                        >
                            <Plus size={14} />
                            Ajouter une interaction
                        </button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {(data.recentInteractions || []).length > 0 ? data.recentInteractions.map((interaction: any, i: number) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Marker */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${getInteractionColor(interaction.type)} text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm transition-colors duration-300`}>
                                        {getInteractionIcon(interaction.type)}
                                    </div>
                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm group-hover:border-primary/20 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                {interaction.type} ({interaction.direction === 'INBOUND' ? 'Reçu' : 'Envoyé'})
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{new Date(interaction.createdAt).toLocaleDateString('fr-DZ')}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{interaction.subject}</h4>
                                        <p className="text-sm text-slate-500 whitespace-pre-wrap">{interaction.content}</p>
                                        {interaction.durationMinutes && (
                                            <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                <Clock size={10} /> Durée : {interaction.durationMinutes} minutes
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-sm text-slate-400 text-center py-8">Aucune interaction enregistrée</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Dialog */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                ➕ Nouvelle interaction
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Type d'interaction</label>
                                    <select 
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-bold text-slate-800 text-sm appearance-none cursor-pointer"
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}
                                    >
                                        <option value="CALL">📞 Appel</option>
                                        <option value="EMAIL">✉️ Email</option>
                                        <option value="MEETING">🤝 Réunion</option>
                                        <option value="NOTE">📝 Note</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Direction</label>
                                    <select 
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-bold text-slate-800 text-sm appearance-none cursor-pointer"
                                        value={form.direction}
                                        onChange={e => setForm({ ...form, direction: e.target.value })}
                                    >
                                        <option value="OUTBOUND">Sortant (Nous → Client)</option>
                                        <option value="INBOUND">Entrant (Client → Nous)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sujet</label>
                                <input 
                                    type="text"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-bold text-slate-800 text-sm transition-all"
                                    placeholder="Ex: Négociation tarifaire"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Détails / Contenu</label>
                                <textarea 
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-bold text-slate-800 text-sm min-h-[120px] transition-all"
                                    placeholder="Résumé de l'interaction..."
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                    required
                                />
                            </div>

                            {(form.type === 'CALL' || form.type === 'MEETING') && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Durée (minutes)</label>
                                    <input 
                                        type="number"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-bold text-slate-800 text-sm transition-all"
                                        placeholder="Ex: 15"
                                        value={form.durationMinutes}
                                        onChange={e => setForm({ ...form, durationMinutes: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-95 text-sm"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
