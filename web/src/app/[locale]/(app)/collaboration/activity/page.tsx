import ActivityClient from './activity-client';

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
            <Clock className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Fil d'Activité</h1>
            <p className="text-sm text-gray-500 font-medium">Tracez toutes les actions effectuées par votre équipe</p>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 p-8">
        <ActivityClient />
      </div>
    </div>
  );
}

import { Clock } from 'lucide-react';
