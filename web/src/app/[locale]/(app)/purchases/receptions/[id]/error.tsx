'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReceptionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[ReceptionDetail Error]:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 rounded-[2.5rem] bg-red-50 text-red-600 flex items-center justify-center mb-10 shadow-2xl shadow-red-100">
        <AlertCircle size={48} />
      </div>
      
      <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
        Oups ! Une erreur est survenue
      </h2>
      
      <p className="max-w-md text-slate-500 font-bold leading-relaxed mb-12">
        Nous n'avons pas pu charger les détails de cette réception. Cela peut être dû à un lien expiré ou à un problème de connexion.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-slate-200"
        >
          <RotateCcw size={18} />
          Réessayer
        </button>
        
        <button
          onClick={() => router.push('/fr/purchases/receptions')}
          className="h-16 px-10 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3"
        >
          <Home size={18} />
          Retour au registre
        </button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-16 p-6 bg-slate-50 rounded-3xl border border-slate-100 max-w-2xl overflow-auto text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Détails Techniques</p>
          <code className="text-xs text-red-600 font-mono break-all">{error.message}</code>
        </div>
      )}
    </div>
  );
}
