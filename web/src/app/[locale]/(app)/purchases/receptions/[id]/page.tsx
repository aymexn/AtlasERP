import { use } from 'react';
import ReceptionDetailClient from './reception-detail-client';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default function ReceptionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  return <ReceptionDetailClient id={id} />;
}
