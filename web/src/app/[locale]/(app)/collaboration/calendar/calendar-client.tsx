'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { Calendar as CalendarIcon, Plus, Users, MapPin, Clock, Trash2, Edit2, X, Bell } from 'lucide-react';
import { toast } from 'sonner';

const localizer = momentLocalizer(moment);

const EVENT_TYPE_COLORS: Record<string, string> = {
  MEETING: '#3b82f6',
  TASK: '#8b5cf6',
  DEADLINE: '#ef4444',
  VACATION: '#10b981',
};

export default function CalendarClient() {
  const t = useTranslations('collaboration');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const fetchEvents = async (start: Date, end: Date) => {
    try {
      const data = await apiFetch(`/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`);
      setEvents(data.map((e: any) => ({
        ...e,
        title: e.title,
        start: new Date(e.startDatetime),
        end: new Date(e.endDatetime),
      })));
    } catch (error) {
      toast.error("Erreur lors du chargement des événements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const start = moment().startOf('month').subtract(1, 'month').toDate();
    const end = moment().endOf('month').add(1, 'month').toDate();
    fetchEvents(start, end);
  }, []);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedRange({ start, end });
    setIsEdit(false);
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      setLoading(true);
      await apiFetch(`/calendar/events/${eventId}`, {
        method: 'DELETE',
      });
      toast.success("Événement supprimé");
      setShowDetailModal(false);
      const start = moment().startOf('month').subtract(1, 'month').toDate();
      const end = moment().endOf('month').add(1, 'month').toDate();
      await fetchEvents(start, end);
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (event: any) => {
    setSelectedEvent(event);
    setSelectedRange({ start: event.start, end: event.end });
    setShowDetailModal(false);
    setIsEdit(true);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <CalendarIcon className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Calendrier d'Équipe</h1>
            <p className="text-sm text-gray-500 font-medium">Gérez vos réunions et échéances importantes</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedEvent(null);
            setIsEdit(false);
            setSelectedRange(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={18} />
          Nouvel Événement
        </button>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 overflow-hidden">
        <div className="h-[700px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            style={{ height: '100%' }}
            messages={{
                next: "Suivant",
                previous: "Précédent",
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
                agenda: "Agenda"
            }}
            eventPropGetter={(event: any) => ({
                style: {
                    backgroundColor: event.color || EVENT_TYPE_COLORS[event.eventType] || '#3b82f6',
                    borderRadius: '8px',
                    border: 'none',
                    padding: '4px 8px',
                    fontWeight: 'bold',
                    fontSize: '11px'
                }
            })}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200 shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                          <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ backgroundColor: selectedEvent.color || EVENT_TYPE_COLORS[selectedEvent.eventType] || '#3b82f6' }}>
                              {selectedEvent.eventType || 'MEETING'}
                          </span>
                          <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedEvent.title}</h2>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-sm text-gray-600 font-semibold">
                          <Clock size={16} className="text-gray-400 shrink-0" />
                          <div>
                              <p>{moment(selectedEvent.start).format('DD MMMM YYYY')}</p>
                              <p className="text-xs text-gray-400 font-medium">
                                  {moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                              </p>
                          </div>
                      </div>
                      
                      {selectedEvent.description && (
                          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 font-medium whitespace-pre-line border border-gray-100">
                              {selectedEvent.description}
                          </div>
                      )}

                      {selectedEvent.reminderMinutes && selectedEvent.reminderMinutes.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50/50 border border-amber-100 px-3 py-2 rounded-xl">
                              <Bell size={14} /> Rappel: {selectedEvent.reminderMinutes[0] < 60 ? `${selectedEvent.reminderMinutes[0]} minutes` : `${selectedEvent.reminderMinutes[0]/60} heure(s)`} avant
                          </div>
                      )}
                  </div>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => handleEditClick(selectedEvent)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
                      >
                          <Edit2 size={14} /> Modifier
                      </button>
                      <button 
                          onClick={() => handleDeleteEvent(selectedEvent.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border border-rose-100"
                      >
                          <Trash2 size={14} /> Supprimer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Event Form Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200 shadow-2xl">
                  <h2 className="text-xl font-black text-gray-900 mb-6">
                      {isEdit ? "Modifier l'Événement" : "Nouvel Événement"}
                  </h2>
                  <form className="space-y-4" onSubmit={async (e: any) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const reminderVal = formData.get('reminder');
                      const reminderMinutes = reminderVal ? [parseInt(reminderVal as string)] : [];
                      
                      const payload = {
                          title: formData.get('title'),
                          startDatetime: new Date(formData.get('start') as string).toISOString(),
                          endDatetime: new Date(formData.get('end') as string).toISOString(),
                          description: formData.get('description'),
                          color: formData.get('color') || '#3b82f6',
                          eventType: formData.get('eventType') || 'MEETING',
                          reminderMinutes,
                      };

                      try {
                          setLoading(true);
                          if (isEdit && selectedEvent) {
                              await apiFetch(`/calendar/events/${selectedEvent.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify(payload),
                              });
                              toast.success("Événement modifié avec succès");
                          } else {
                              await apiFetch('/calendar/events', {
                                  method: 'POST',
                                  body: JSON.stringify(payload),
                              });
                              toast.success("Événement créé avec succès");
                          }
                          setShowModal(false);
                          const start = moment().startOf('month').subtract(1, 'month').toDate();
                          const end = moment().endOf('month').add(1, 'month').toDate();
                          await fetchEvents(start, end);
                      } catch (err) {
                          toast.error("Erreur lors de l'enregistrement de l'événement");
                      } finally {
                          setLoading(false);
                      }
                  }}>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Titre</label>
                          <input name="title" type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden" placeholder="Réunion d'équipe..." defaultValue={isEdit && selectedEvent ? selectedEvent.title : ''} required />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Type d'Événement</label>
                          <select name="eventType" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden appearance-none" defaultValue={isEdit && selectedEvent ? selectedEvent.eventType : 'MEETING'}>
                              <option value="MEETING">Réunion (Meeting)</option>
                              <option value="TASK">Tâche (Task)</option>
                              <option value="DEADLINE">Échéance (Deadline)</option>
                              <option value="VACATION">Congés (Vacation)</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Description</label>
                          <textarea name="description" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden" placeholder="Détails de la réunion..." rows={3} defaultValue={isEdit && selectedEvent ? selectedEvent.description : ''} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Début</label>
                              <input name="start" type="datetime-local" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" defaultValue={selectedRange?.start ? moment(selectedRange.start).format('YYYY-MM-DDTHH:mm') : (isEdit && selectedEvent ? moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'))} required />
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Fin</label>
                              <input name="end" type="datetime-local" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" defaultValue={selectedRange?.end ? moment(selectedRange.end).format('YYYY-MM-DDTHH:mm') : (isEdit && selectedEvent ? moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'))} required />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Rappel</label>
                          <select name="reminder" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden appearance-none" defaultValue={isEdit && selectedEvent?.reminderMinutes?.length > 0 ? String(selectedEvent.reminderMinutes[0]) : ''}>
                              <option value="">Pas de rappel</option>
                              <option value="15">15 minutes avant</option>
                              <option value="30">30 minutes avant</option>
                              <option value="60">1 heure avant</option>
                              <option value="1440">1 jour avant</option>
                              <option value="10080">1 semaine avant</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Couleur</label>
                          <div className="flex gap-2">
                              {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                                  <label key={c} className="cursor-pointer">
                                      <input type="radio" name="color" value={c} className="peer hidden" defaultChecked={c === (isEdit && selectedEvent ? selectedEvent.color : '#3b82f6')} />
                                      <div className="h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-gray-900 transition-all" style={{ backgroundColor: c }} />
                                  </label>
                              ))}
                          </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all">Annuler</button>
                          <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50">
                              {loading ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
