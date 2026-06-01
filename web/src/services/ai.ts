import { apiFetch } from '@/lib/api';

export interface AiInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'prediction' | 'recommendation';
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impactValue: number;
  confidenceScore: number;
  data?: any;
  createdAt: string;
}

export interface AiPredictionData {
  date: string;
  actual: number;
  predicted: number;
}

export interface AiRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  impactScore: number;
  potentialGain: number;
  actionUrl?: string;
  actionPayload?: any;
  status: string;
  createdAt: string;
}

export interface AiAutomation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun?: string;
  runsCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const aiService = {
  async getInsights(): Promise<AiInsight[]> {
    return apiFetch('/api/ai/insights');
  },

  async getAnalytics(): Promise<any> {
    return apiFetch('/api/ai/analytics');
  },

  async getPredictions(): Promise<{
    status: 'SUCCESS' | 'PENDING_DATA';
    series: AiPredictionData[];
    kpis: {
      predictedRevenue: number;
      predictedCashFlow: number;
      optimalStockAdjustmentsCount: number;
      confidenceScore: number;
    } | null;
  }> {
    return apiFetch('/api/ai/predictions');
  },

  async getRecommendations(): Promise<AiRecommendation[]> {
    return apiFetch('/api/ai/recommendations');
  },

  async getAutomations(): Promise<AiAutomation[]> {
    return apiFetch('/api/ai/automations');
  },

  async toggleAutomation(id: string): Promise<AiAutomation> {
    return apiFetch(`/api/ai/automations/${id}/toggle`, {
      method: 'POST'
    });
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const history = await apiFetch('/api/ai/chat');
    return (history || []).map((h: any) => ({
      id: h.id,
      role: h.role,
      content: h.message || "",
      createdAt: h.createdAt
    }));
  },

  async sendChatMessage(message: string): Promise<{ response: string; messageId: string; suggestions?: string[] }> {
    const res = await apiFetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return {
      response: res?.assistantMessage?.message || "",
      messageId: res?.assistantMessage?.id || "",
      suggestions: res?.suggestions || []
    };
  }
};
