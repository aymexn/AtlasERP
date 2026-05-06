import CustomerAgingClient from './customer-aging-client';

export const metadata = {
  title: 'Détail Balance Agée | AtlasERP',
  description: 'Analyse détaillée des créances par client.',
};

export default function CustomerAgingPage({ params }: { params: { id: string } }) {
  return <CustomerAgingClient id={params.id} />;
}
