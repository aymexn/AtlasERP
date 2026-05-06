import AgedReceivablesClient from './aged-receivables-client';

export const metadata = {
  title: 'Balance Agée | AtlasERP',
  description: 'Gestion de la balance agée et recouvrement des créances.',
};

export default function AgedReceivablesPage() {
  return <AgedReceivablesClient />;
}
