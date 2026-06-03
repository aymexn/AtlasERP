'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [checkingToken, setCheckingToken] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError("Le lien d'invitation est invalide ou manquant.");
      setCheckingToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/validate-invitation?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Le lien d'invitation est invalide ou a expiré.");
        }
        setEmail(data.email || '');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      toast.success('Compte activé avec succès. Redirection vers la page de connexion...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-8 text-center bg-blue-600 text-white relative">
          <h1 className="text-3xl font-black tracking-tight">AtlasERP</h1>
          <p className="mt-2 text-blue-100 font-medium">Acceptez votre invitation</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="p-4 mb-6 text-red-600 bg-red-50 rounded-xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          {checkingToken ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Vérification de l'invitation...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Adresse E-mail</span>
                <span className="text-sm font-black text-slate-900">{email}</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Définissez un mot de passe
                </label>
                <input
                  type="password"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Confirmez le mot de passe
                </label>
                <input
                  type="password"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all font-bold"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name || !password || !confirmPassword}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center gap-2 font-black shadow-lg shadow-blue-100 transition-all uppercase tracking-widest"
              >
                {loading ? 'Validation...' : 'Activer mon compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
