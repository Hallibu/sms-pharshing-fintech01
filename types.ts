
export type TransactionType = 'income' | 'expense';

export enum Currency {
  USD = 'USD',
  INR = 'INR',
  GHS = 'GHS',
  EUR = 'EUR',
  GBP = 'GBP'
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string; // Merchant or Description
  category: string;
  type: TransactionType;
  date: string; // ISO Date String
  rawSms?: string;
  sender?: string;
}

export interface SmsSenderRule {
  id: string;
  senderName: string; // e.g., "HDFC-BANK", "Venmo"
  autoProcess: boolean;
  defaultCategory?: string;
}

export interface AppSettings {
  displayCurrency: Currency;
  theme: 'light' | 'dark';
}

export const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Health',
  'Salary',
  'Investment',
  'Transfer',
  'Other'
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  GHS: '₵',
  EUR: '€',
  GBP: '£'
};
