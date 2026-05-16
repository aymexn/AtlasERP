'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from '@/navigation';
import { 
  Folder, 
  Plus, 
  MoreVertical, 
  Clock, 
  BarChart2, 
  Users,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectsClient() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/projects');
      setProjects(data);
    } catch (error) {
      toast.error("Erreur chargement projets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-50 text-green-600 border-green-100';
      case 'PLANNING': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ON_HOLD': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Folder className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Projets</h1>
            <p className="text-sm text-gray-500 font-medium">Suivez l'avancement de vos chantiers et initiatives</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={18} />
          Nouveau Projet
        </button>
      </div>

      {/* Project Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200 shadow-2xl">
                  <h2 className="text-xl font-black text-gray-900 mb-6">Nouveau Projet</h2>
                  <form className="space-y-4" onSubmit={async (e: any) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const payload = {
                          name: formData.get('name'),
                          code: formData.get('code'),
                          description: formData.get('description'),
                          priority: formData.get('priority'),
                          status: 'PLANNING',
                      };

                      try {
                          setLoading(true);
                          await apiFetch('/projects', {
                              method: 'POST',
                              body: JSON.stringify(payload),
                          });
                          toast.success("Projet créé avec succès");
                          setShowModal(false);
                          fetchProjects();
                      } catch (err) {
                          toast.error("Erreur lors de la création du projet");
                      } finally {
                          setLoading(false);
                      }
                  }}>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Nom du Projet</label>
                          <input name="name" type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden" placeholder="Transformation Digitale..." required />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Code (Optionnel)</label>
                          <input name="code" type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden" placeholder="PRJ-2024-001" />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Description</label>
                          <textarea name="description" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden" placeholder="Détails du projet..." rows={3} />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Priorité</label>
                          <select name="priority" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden appearance-none">
                              <option value="LOW">Basse</option>
                              <option value="MEDIUM">Moyenne</option>
                              <option value="HIGH">Haute</option>
                              <option value="CRITICAL">Critique</option>
                          </select>
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">Annuler</button>
                          <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50">
                              {loading ? 'Création...' : 'Créer le Projet'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un projet..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
            <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                <Filter size={18} />
            </button>
            <div className="h-10 w-px bg-gray-100 mx-1" />
            <div className="flex p-1 bg-gray-100 rounded-lg">
                <button className="p-2 bg-white rounded-md shadow-sm text-blue-600"><Grid size={16} /></button>
                <button className="p-2 text-gray-400"><List size={16} /></button>
            </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse" />)}
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => router.push(`/collaboration/projects/${project.id}` as any)}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/30 transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="flex items-start justify-between mb-6">
                <span className={`px-2.5 py-1 rounded-lg border font-black text-[10px] uppercase tracking-wider ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <button className="text-gray-300 hover:text-gray-600">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Title & Info */}
              <div className="space-y-2 mb-6">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{project.code || 'PRJ'}</div>
                <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {project.name}
                </h3>
                <p className="text-sm text-gray-400 font-medium line-clamp-2">
                    {project.description || 'Aucune description fournie pour ce projet.'}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-400">Progression</span>
                  <span className="text-blue-600">{Math.round(project.progress || 0)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-1000" 
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-400">
                                U{i}
                            </div>
                        ))}
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                        {project._count?.tasks || 0} tâches
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <Clock size={12} />
                  {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'Pas de date'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Folder size={48} className="text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-black text-gray-900 mb-2">Aucun projet trouvé</h2>
              <p className="text-gray-400 font-bold max-w-xs mx-auto">
                  Commencez par créer votre premier projet pour organiser votre travail.
              </p>
          </div>
      )}
    </div>
  );
}
