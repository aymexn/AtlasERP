import { Metadata } from 'next';
import AiChatClient from './ai-chat-client';

export const metadata: Metadata = {
  title: 'Assistant AI | AtlasERP',
  description: 'Posez vos questions à l\'assistant intelligent d\'AtlasERP.',
};

export default function AiChatPage() {
  return <AiChatClient />;
}
