import { Metadata } from 'next';
import AiInsightsClient from './ai-insights-client';

export const metadata: Metadata = {
  title: 'Insights & Prédictions | AtlasERP',
  description: 'Prévisions financières, tendances de ventes et insights décisionnels.',
};

export default function AiInsightsPage() {
  return <AiInsightsClient />;
}
