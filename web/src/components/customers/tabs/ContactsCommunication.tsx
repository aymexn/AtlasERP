'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Mail, FileText, Plus, MessageSquare } from 'lucide-react';
import { customersService, CustomerContact } from '@/services/customers';
import { toast } from 'sonner';

export function ContactsCommunication({ customerId }: { customerId: string }) {
    const [contacts, setContacts] = useState<CustomerContact[]>([]);
    const [interactions, setInteractions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showContactForm, setShowContactForm] = useState(false);
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [newContact, setNewContact] = useState<Partial<CustomerContact>>({ isPrimary: false });
    const [newInteraction, setNewInteraction] = useState<any>({ type: 'NOTE', direction: 'OUTBOUND' });

    useEffect(() => {
        loadData();
    }, [customerId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const contactsData = await customersService.getAll(customerId); // Assuming we can fetch by customerId, actually I should use getOne or specific endpoints.
            // Oh, wait, I added getInteractions and getContacts is just getOne().contacts? Actually, I built /api/customers/[id]/contacts
            // Let's just fetch them directly since I added it to the API, wait, I didn't add getContacts to customersService. 
            // I'll fetch via apiFetch directly here or use getOne().
            const res = await fetch(`/api/customers/${customerId}/contacts`);
            const cData = await res.json();
            setContacts(cData);

            const iData = await customersService.getInteractions(customerId);
            setInteractions(iData);
        } catch (error) {
            console.error("Failed to load contacts/interactions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await customersService.addContact(customerId, newContact);
            toast.success('Contact ajouté');
            setShowContactForm(false);
            setNewContact({ isPrimary: false });
            loadData();
        } catch (error) {
            toast.error('Erreur lors de l\'ajout du contact');
        }
    };

    const handleAddInteraction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await customersService.createInteraction(customerId, newInteraction);
            toast.success('Interaction ajoutée');
            setShowInteractionForm(false);
            setNewInteraction({ type: 'NOTE', direction: 'OUTBOUND' });
            loadData();
        } catch (error) {
            toast.error('Erreur');
        }
    };

    if (loading) {
        return <div className="h-48 flex items-center justify-center animate-pulse text-slate-400">Chargement du CRM...</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contacts Column */}
            <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                        <Users size={16} /> Contacts ({contacts.length})
                    </h3>
                    <button 
                        onClick={() => setShowContactForm(!showContactForm)}
                        className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {showContactForm && (
                    <Card className="border-primary shadow-lg shadow-primary/10">
                        <CardContent className="p-4">
                            <form onSubmit={handleAddContact} className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Prénom</label>
                                        <input type="text" required value={newContact.firstName || ''} onChange={e => setNewContact({...newContact, firstName: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Nom</label>
                                        <input type="text" required value={newContact.lastName || ''} onChange={e => setNewContact({...newContact, lastName: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Poste</label>
                                        <input type="text" value={newContact.position || ''} onChange={e => setNewContact({...newContact, position: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Email</label>
                                        <input type="email" value={newContact.email || ''} onChange={e => setNewContact({...newContact, email: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Téléphone</label>
                                    <input type="tel" value={newContact.phone || ''} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl" />
                                </div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <input type="checkbox" checked={newContact.isPrimary || false} onChange={e => setNewContact({...newContact, isPrimary: e.target.checked})} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                    Contact Principal
                                </label>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setShowContactForm(false)} className="px-3 py-1.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Annuler</button>
                                    <button type="submit" className="px-3 py-1.5 bg-primary text-white font-bold rounded-lg shadow-sm">Enregistrer</button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {contacts.map((contact, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${contact.isPrimary ? 'border-primary shadow-md shadow-primary/10 bg-white' : 'border-slate-100 bg-slate-50'} relative`}>
                            {contact.isPrimary && (
                                <Badge className="absolute -top-2 -right-2 bg-primary text-[9px]">PRINCIPAL</Badge>
                            )}
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                {contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`}
                            </h4>
                            <p className="text-xs font-bold text-slate-400 mb-3">{contact.position || 'Poste non renseigné'}</p>
                            
                            <div className="space-y-2 text-sm text-slate-600">
                                {contact.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-slate-400" />
                                        <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-slate-400" />
                                        <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {contacts.length === 0 && (
                        <div className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-slate-100">Aucun contact</div>
                    )}
                </div>
            </div>

            {/* Interactions Timeline */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                        <MessageSquare size={16} /> Fil d'Interactions
                    </h3>
                    <button 
                        onClick={() => setShowInteractionForm(!showInteractionForm)}
                        className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm shadow-primary/20 hover:bg-primary/90 flex items-center gap-2"
                    >
                        <Plus size={14} /> Nouvelle Interaction
                    </button>
                </div>

                {showInteractionForm && (
                    <Card className="border-primary shadow-lg shadow-primary/10">
                        <CardContent className="p-6">
                            <form onSubmit={handleAddInteraction} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Type</label>
                                        <select value={newInteraction.type} onChange={e => setNewInteraction({...newInteraction, type: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                                            <option value="NOTE">Note Interne</option>
                                            <option value="CALL">Appel Téléphonique</option>
                                            <option value="EMAIL">Email</option>
                                            <option value="MEETING">Réunion</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Direction</label>
                                        <select value={newInteraction.direction} onChange={e => setNewInteraction({...newInteraction, direction: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                                            <option value="OUTBOUND">Sortant (Vers le client)</option>
                                            <option value="INBOUND">Entrant (Depuis le client)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Sujet</label>
                                    <input type="text" required value={newInteraction.subject || ''} onChange={e => setNewInteraction({...newInteraction, subject: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl text-sm" placeholder="Résumé de l'échange..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Contenu / Compte-rendu</label>
                                    <textarea required value={newInteraction.content || ''} onChange={e => setNewInteraction({...newInteraction, content: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm h-32 resize-none" placeholder="Détails de l'interaction..."></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowInteractionForm(false)} className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-100 rounded-xl">Annuler</button>
                                    <button type="submit" className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm shadow-primary/20">Enregistrer l'interaction</button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {interactions.map((interaction, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex gap-4">
                            <div className={`p-3 rounded-xl h-fit ${
                                interaction.type === 'CALL' ? 'bg-blue-50 text-blue-600' :
                                interaction.type === 'EMAIL' ? 'bg-indigo-50 text-indigo-600' :
                                interaction.type === 'MEETING' ? 'bg-purple-50 text-purple-600' :
                                'bg-amber-50 text-amber-600'
                            }`}>
                                {interaction.type === 'CALL' ? <Phone size={20} /> :
                                 interaction.type === 'EMAIL' ? <Mail size={20} /> :
                                 interaction.type === 'MEETING' ? <Users size={20} /> :
                                 <FileText size={20} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-800">{interaction.subject}</h4>
                                        <Badge variant="default" className="text-[9px] px-1.5 py-0">
                                            {interaction.direction === 'OUTBOUND' ? 'SORTANT' : 'ENTRANT'}
                                        </Badge>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">
                                        {new Date(interaction.createdAt).toLocaleString('fr-FR', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{interaction.content}</p>
                            </div>
                        </div>
                    ))}
                    {interactions.length === 0 && (
                        <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                            <MessageSquare className="mx-auto text-slate-300 mb-3" size={32} />
                            <p className="text-sm font-bold text-slate-500">Aucune interaction enregistrée</p>
                            <p className="text-xs text-slate-400 mt-1">Créez votre première note ou compte-rendu pour ce client.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
