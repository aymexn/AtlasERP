'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { 
  Circle, 
  MessageSquare, 
  CheckCircle2, 
  PlusCircle, 
  FileText, 
  Calendar,
  User as UserIcon,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ActivityClient({ projectId }: { projectId?: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const url = projectId ? `/collaboration/activity?projectId=${projectId}` : '/collaboration/activity';
        const data = await apiFetch(url);
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activity", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();

    if (socket) {
      socket.on('new_activity', (activity) => {
        if (!projectId || activity.projectId === projectId) {
          setActivities(prev => [activity, ...prev].slice(0, 50));
        }
      });

      return () => {
        socket.off('new_activity');
      };
    }
  }, [projectId, socket]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_created': return <PlusCircle size={16} className="text-blue-500" />;
      case 'task_updated': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'comment_added': return <MessageSquare size={16} className="text-purple-500" />;
      case 'document_uploaded': return <FileText size={16} className="text-orange-500" />;
      case 'event_created': return <Calendar size={16} className="text-red-500" />;
      default: return <Circle size={16} className="text-gray-400" />;
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-xl" />)}
  </div>;

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" />

      <div className="space-y-8">
        {activities.map((activity) => (
          <div key={activity.id} className="relative flex gap-6 items-start group">
            {/* Icon Bubble */}
            <div className="relative z-10 h-12 w-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:border-blue-200 transition-all duration-300">
                {getIcon(activity.activityType)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <p className="text-sm text-gray-600 font-medium">
                  <span className="font-black text-gray-900">{activity.userName}</span>
                  {' '}
                  {activity.description}
                  {activity.resourceTitle && (
                      <>
                        {' : '}
                        <span className="font-black text-blue-600">{activity.resourceTitle}</span>
                      </>
                  )}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                  <Clock size={12} />
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: fr })}
                </div>
              </div>

              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100/50 text-xs text-gray-500 font-medium italic">
                      {JSON.stringify(activity.metadata)}
                  </div>
              )}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
            <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon size={24} className="text-gray-300" />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">Aucune activité</h3>
                <p className="text-xs text-gray-400 font-bold">Les actions de votre équipe apparaîtront ici</p>
            </div>
        )}
      </div>
    </div>
  );
}
