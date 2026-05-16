'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { apiFetch } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { 
  MoreHorizontal, 
  Plus, 
  Clock, 
  User as UserIcon, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', title: 'À Faire', color: 'bg-gray-100 text-gray-500' },
  { id: 'IN_PROGRESS', title: 'En Cours', color: 'bg-blue-50 text-blue-600' },
  { id: 'IN_REVIEW', title: 'En Révision', color: 'bg-purple-50 text-purple-600' },
  { id: 'DONE', title: 'Terminé', color: 'bg-green-50 text-green-600' },
];

export default function KanbanClient({ projectId }: { projectId: string }) {
  const [board, setBoard] = useState<any>({
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const data = await apiFetch(`/projects/${projectId}/kanban`);
        setBoard(data);
      } catch (error) {
        toast.error("Erreur chargement Kanban");
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();

    if (socket) {
      socket.emit('join_project', projectId);
      
      socket.on('task_updated', (updatedTask) => {
          fetchBoard();
      });

      socket.on('task_moved', (data) => {
          // One client moved a task, others should refresh or update locally
          fetchBoard();
      });

      socket.on('task_created', (newTask) => {
          fetchBoard();
      });

      return () => {
        socket.emit('leave_project', projectId);
        socket.off('task_updated');
        socket.off('task_moved');
        socket.off('task_created');
      };
    }
  }, [projectId, socket]);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Snapshot for rollback
    const originalBoard = { ...board };

    // Local optimistic update
    const sourceCol = Array.from(board[source.droppableId]);
    const destCol = Array.from(board[destination.droppableId]);
    const [movedTask] = sourceCol.splice(source.index, 1) as any[];
    
    if (source.droppableId === destination.droppableId) {
        sourceCol.splice(destination.index, 0, movedTask);
        setBoard({ ...board, [source.droppableId]: sourceCol });
    } else {
        movedTask.boardColumn = destination.droppableId;
        destCol.splice(destination.index, 0, movedTask);
        setBoard({ ...board, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });
    }

    try {
      await apiFetch(`/tasks/${draggableId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({
          boardColumn: destination.droppableId,
          displayOrder: destination.index,
        }),
      });
      toast.success("Position mise à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      // Rollback
      setBoard(originalBoard);
    }
  };

  const [showQuickAdd, setShowQuickAdd] = useState<string | null>(null);

  const handleQuickAdd = async (columnId: string, title: string) => {
      try {
          await apiFetch('/tasks', {
              method: 'POST',
              body: JSON.stringify({
                  projectId,
                  title,
                  boardColumn: columnId,
                  status: columnId === 'DONE' ? 'DONE' : 'IN_PROGRESS',
                  displayOrder: board[columnId].length
              }),
          });
          toast.success("Tâche ajoutée");
          setShowQuickAdd(null);
          // fetchBoard() will be triggered by socket but we can call it manually for faster feedback
          const data = await apiFetch(`/projects/${projectId}/kanban`);
          setBoard(data);
      } catch (err) {
          toast.error("Erreur lors de l'ajout");
      }
  };

  if (loading) return <div className="h-96 flex items-center justify-center font-black text-gray-400 animate-pulse uppercase tracking-[0.2em]">Chargement du Board...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px]">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex-1 min-w-[300px] flex flex-col gap-4">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider ${col.color}`}>
                  {col.title}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {board[col.id]?.length || 0}
                </span>
              </div>
              <button 
                onClick={() => setShowQuickAdd(col.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Add Form */}
            {showQuickAdd === col.id && (
                <div className="px-2 animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={(e: any) => {
                        e.preventDefault();
                        const title = e.target.title.value;
                        if (title) handleQuickAdd(col.id, title);
                    }} className="bg-white p-3 rounded-xl border-2 border-blue-200 shadow-lg">
                        <input 
                            name="title" 
                            autoFocus 
                            placeholder="Titre de la tâche..." 
                            className="w-full text-sm font-bold outline-hidden mb-2"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowQuickAdd(null)} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-600">Annuler</button>
                            <button type="submit" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700">Ajouter</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Droppable Area */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 flex flex-col gap-3 p-2 rounded-2xl transition-colors duration-200 ${
                    snapshot.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-100 ring-inset' : 'bg-gray-50/30'
                  }`}
                >
                  {board[col.id]?.map((task: any, index: number) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all ${
                            snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 ring-offset-2 rotate-2 scale-105 z-50' : 'hover:border-blue-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {task.taskNumber}
                            </span>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm("Supprimer cette tâche ?")) {
                                            try {
                                                await apiFetch(`/tasks/${task.id}`, { method: 'DELETE' });
                                                toast.success("Tâche supprimée");
                                                const data = await apiFetch(`/projects/${projectId}/kanban`);
                                                setBoard(data);
                                            } catch (err) {
                                                toast.error("Erreur suppression");
                                            }
                                        }
                                    }}
                                    className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-md transition-colors"
                                >
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-black text-gray-900 leading-tight mb-3">
                            {task.title}
                          </h4>

                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-3">
                                {task.dueDate && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                        <Clock size={12} />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                            
                            <div className="h-6 w-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] font-black text-gray-500 overflow-hidden">
                                {task.assignedTo?.employee ? (
                                    <span title={task.assignedTo.email}>
                                        {task.assignedTo.employee.firstName[0]}{task.assignedTo.employee.lastName[0]}
                                    </span>
                                ) : (
                                    <UserIcon size={12} />
                                )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
