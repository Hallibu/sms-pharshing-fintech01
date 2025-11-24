import { Transaction, SmsSenderRule, AppSettings, Currency } from '../types';

const TRANSACTIONS_KEY = 'smsexpense_transactions';
const WHITELIST_KEY = 'smsexpense_whitelist';
const SETTINGS_KEY = 'smsexpense_settings';

// --- Transactions ---
export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  // Add to beginning
  const updated = [transaction, ...transactions];
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions();
  const updated = transactions.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
};

export const clearAllData = (): void => {
  localStorage.removeItem(TRANSACTIONS_KEY);
  localStorage.removeItem(WHITELIST_KEY);
  // Keep settings usually, but for "Clear Data" feature we might wipe transactions only or everything.
  // Implementing wipe everything for safety.
  localStorage.removeItem(SETTINGS_KEY);
};

// --- Whitelist ---
export const getWhitelist = (): SmsSenderRule[] => {
  const data = localStorage.getItem(WHITELIST_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveWhitelistRule = (rule: SmsSenderRule): void => {
  const list = getWhitelist();
  const existingIndex = list.findIndex(r => r.id === rule.id);
  
  let updated;
  if (existingIndex >= 0) {
    updated = [...list];
    updated[existingIndex] = rule;
  } else {
    updated = [...list, rule];
  }
  localStorage.setItem(WHITELIST_KEY, JSON.stringify(updated));
};

export const deleteWhitelistRule = (id: string): void => {
  const list = getWhitelist();
  const updated = list.filter(r => r.id !== id);
  localStorage.setItem(WHITELIST_KEY, JSON.stringify(updated));
};

// --- Settings ---
export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : { displayCurrency: Currency.USD, theme: 'light' };
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};