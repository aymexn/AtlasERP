import { apiFetch } from '@/lib/api';

export interface AgedReceivablesSummary {
  totalOutstanding: number;
  current: number;
  late30: number;
  late60: number;
  late90: number;
}

export interface AgedCustomer {
  id: string;
  name: string;
  totalOutstanding: number;
  current: number;
  late30: number;
  late60: number;
  late90: number;
  paymentBehavior: string;
  avgPaymentDelay: number;
}

export interface AgedReceivablesData {
  summary: AgedReceivablesSummary;
  customers: AgedCustomer[];
}

export const treasuryService = {
  getAgedReceivables: (): Promise<AgedReceivablesData> => 
    apiFetch('/treasury/aged-receivables'),

  getCustomerAging: (id: string): Promise<any> => 
    apiFetch(`/treasury/customers/${id}/aging`),

  sendReminder: (invoiceId: string) => 
    apiFetch(`/treasury/reminders/send/${invoiceId}`, { method: 'POST' }),

  sendDailyReminders: () => 
    apiFetch('/treasury/reminders/send-daily', { method: 'POST' }),

  getCollectionPriority: (): Promise<any[]> => 
    apiFetch('/treasury/collections/priority'),

  logCollectionActivity: (data: any) => 
    apiFetch('/treasury/collections/activities', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getCollectionActivities: (customerId: string): Promise<any[]> => 
    apiFetch(`/treasury/collections/activities/${customerId}`),

  getForecast: (): Promise<any[]> => 
    apiFetch('/treasury/forecast'),
};
