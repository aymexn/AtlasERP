import { Metadata } from 'next';
import AiRecommendationsClient from './ai-recommendations-client';

export const metadata: Metadata = {
  title: 'Recommandations AI | AtlasERP',
  description: 'Centre d\'actions et de décisions guidées par l\'IA d\'AtlasERP.',
};

export default function AiRecommendationsPage() {
  return <AiRecommendationsClient />;
}
