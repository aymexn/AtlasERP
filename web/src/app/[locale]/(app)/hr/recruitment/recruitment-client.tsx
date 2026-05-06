'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { hrService } from '@/services/hr';
import {
    Plus,
    Search,
    UserPlus,
    Briefcase,
    Calendar,
    ChevronRight,
    Loader2,
    Filter,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    Mail,
    Phone,
    FileText,
    MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RecruitmentClient() {
    const t = useTranslations('hr');
    const ct = useTranslations('common');

    const [jobs, setJobs] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'jobs' | 'pipeline'>('pipeline');

    const stages = [
        { id: 'APPLIED', label: t('recruitment.stages.applied'), color: 'bg-blue-500' },
        { id: 'SCREENING', label: t('recruitment.stages.screening'), color: 'bg-amber-500' },
        { id: 'INTERVIEW', label: t('recruitment.stages.interview'), color: 'bg-purple-500' },
        { id: 'OFFER', label: t('recruitment.stages.offer'), color: 'bg-emerald-500' },
        { id: 'HIRED', label: t('recruitment.stages.hired'), color: 'bg-blue-600' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [jobsData, appsData] = await Promise.all([
                hrService.listJobs(),
                hrService.listApplications()
            ]);
            setJobs(jobsData || []);
            setApplications(appsData || []);
        } catch (err) {
            console.error('Failed to load recruitment data', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{ct('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">{t('recruitment.title')}</h1>
                    <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded-2xl flex">
                        <button 
                            onClick={() => setView('pipeline')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${view === 'pipeline' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            PIPELINE
                        </button>
                        <button 
                            onClick={() => setView('jobs')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${view === 'jobs' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            OFFRES
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                        <Plus size={20} />
                        Publier une offre
                    </button>
                </div>
            </div>

            {view === 'pipeline' ? (
                /* Kanban Pipeline View */
                <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
                    {stages.map((stage) => (
                        <div key={stage.id} className="min-w-[320px] flex-1 flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{stage.label}</h3>
                                </div>
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {applications.filter(a => a.stage === stage.id).length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-4 min-h-[500px] bg-slate-50/50 rounded-3xl p-3 border border-dashed border-slate-200">
                                {applications.filter(a => a.stage === stage.id).map((app) => (
                                    <div key={app.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 leading-tight">{app.candidate.firstName} {app.candidate.lastName}</span>
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{app.jobPosting.title}</span>
                                            </div>
                                            <button className="text-slate-300 group-hover:text-slate-400"><MoreVertical size={16}/></button>
                                        </div>

                                        <div className="flex flex-col gap-2 mb-4">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                <Mail size={12} />
                                                {app.candidate.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                <Phone size={12} />
                                                {app.candidate.phone}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300">
                                                <Clock size={12} />
                                                {format(new Date(app.applicationDate), 'dd MMM')}
                                            </div>
                                            <div className="flex -space-x-2">
                                                <div className="h-6 w-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600">JD</div>
                                                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">+1</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {applications.filter(a => a.stage === stage.id).length === 0 && (
                                    <div className="h-full flex items-center justify-center opacity-20 grayscale">
                                        <UserPlus size={48} className="text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Jobs List View */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-1">
                         <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Offre</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Département</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidats</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{job.title}</span>
                                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                    <MapPin size={10} /> {job.location || 'Remote'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-700">{job.department}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{job.employmentType}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-xs">
                                                    {job._count.applications}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Postulants</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                </div>
            )}
        </div>
    );
}
