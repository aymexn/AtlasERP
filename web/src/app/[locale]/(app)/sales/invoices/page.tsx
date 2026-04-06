import { InvoicesClient } from './invoices-client';

export const metadata = {
  title: 'Facturation - AtlasERP',
  description: 'Gestion des factures clients et règlements',
};

export default function InvoicesPage() {
  return <InvoicesClient />;
}
