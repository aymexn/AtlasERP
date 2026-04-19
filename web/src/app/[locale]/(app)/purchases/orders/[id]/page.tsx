import { use } from 'react';
import OrderDetailClient from './order-detail-client';

export const metadata = {
  title: 'Détail BCF - AtlasERP',
  description: 'Détail de la commande fournisseur et suivi des réceptions',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: PageProps) {
  const { id } = use(params);
  return <OrderDetailClient id={id} />;
}
