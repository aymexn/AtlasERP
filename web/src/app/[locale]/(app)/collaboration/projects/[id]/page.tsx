import KanbanClient from './kanban-client';
import { use } from 'react';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <KanbanClient projectId={id} />;
}
