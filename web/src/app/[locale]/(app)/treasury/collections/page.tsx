import CollectionsClient from './collections-client';

export const metadata = {
  title: 'File de Recouvrement | AtlasERP',
  description: 'Priorisation des appels de recouvrement par score de risque.',
};

export default function CollectionsPage() {
  return <CollectionsClient />;
}
