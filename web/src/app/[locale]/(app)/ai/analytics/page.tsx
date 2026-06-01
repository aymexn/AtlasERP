import { Metadata } from 'next';
import AiAnalyticsClient from './ai-analytics-client';

export const metadata: Metadata = {
  title: 'Analytique Avancée AI | AtlasERP',
  description: 'Segmentation clients, cohortes et analyses d\'associations par l\'IA.',
};

export default function AiAnalyticsPage() {
  return <AiAnalyticsClient />;
}
