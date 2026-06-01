'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError("Le lien d'invitation est invalide ou manquant.");
    }
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
        body: JSON.stringify({ token, password }),
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
        <div className="p-8 text-center bg-blue-600 text-white">
          <h1 className="text-3xl font-black tracking-tight">AtlasERP</h1>
          <p className="mt-2 text-blue-100 font-medium">Acceptez votre invitation</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="p-4 mb-6 text-red-600 bg-red-50 rounded-xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          {!token ? (
            <div className="text-center">
              <p className="text-slate-500 font-medium mb-6">Le lien d'invitation est invalide ou manquant.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
              >
                Retour à l'accueil
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={loading || !password || !confirmPassword}
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
