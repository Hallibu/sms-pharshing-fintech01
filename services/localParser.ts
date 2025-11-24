
import { ParsedSmsResult } from './gemini';
import { CATEGORIES } from '../types';

interface RegexPattern {
  type: 'expense' | 'income';
  regex: RegExp;
  // Indices for capture groups: [Amount, Merchant/Description, Currency(optional)]
  groups: {
    amount: number;
    merchant: number;
    currency?: number;
  };
}

// Common currency symbols/codes mapping for regex
const CURRENCY_MAP: Record<string, string> = {
  '$': 'USD',
  'USD': 'USD',
  '₹': 'INR',
  'INR': 'INR',
  'RS': 'INR',
  'GHS': 'GHS',
  '₵': 'GHS',
  'EUR': 'EUR',
  '€': 'EUR',
  'GBP': 'GBP',
  '£': 'GBP'
};

/**
 * Regex Patterns for common banking SMS formats.
 * We try to be generic but specific enough to catch "Sent $X to Y" or "Spent $X at Y"
 */
const PATTERNS: RegexPattern[] = [
  // Pattern: "Paid USD 12.50 to Starbucks" or "Sent $50 to John"
  {
    type: 'expense',
    regex: /(?:paid|sent|transfer|transferred)\s+([A-Za-z$€£₹]+)?\s?([\d,.]+)\s+(?:to|at)\s+([A-Za-z0-9\s.&]+)(?:\s+on|$)/i,
    groups: { currency: 1, amount: 2, merchant: 3 }
  },
  // Pattern: "Transaction of $12.00 at Amazon" or "Purchase of $50 at Wallmart"
  {
    type: 'expense',
    regex: /(?:transaction|purchase|spent|debited)\s+(?:of|for)?\s+([A-Za-z$€£₹]+)?\s?([\d,.]+)\s+(?:at|to|on)\s+([A-Za-z0-9\s.&]+)/i,
    groups: { currency: 1, amount: 2, merchant: 3 }
  },
  // Pattern: "Acct XX123 debited for $20.00 info: MCDONALDS"
  {
    type: 'expense',
    regex: /(?:debited|withdrawn)\s+(?:for|of)?\s+([A-Za-z$€£₹]+)?\s?([\d,.]+)(?:.*info:|.*at|.*ref:)\s+([A-Za-z0-9\s.&]+)/i,
    groups: { currency: 1, amount: 2, merchant: 3 }
  },
  // Pattern: "Received $500 from Boss" or "Credited with $500"
  {
    type: 'income',
    regex: /(?:received|credited)\s+(?:with)?\s+([A-Za-z$€£₹]+)?\s?([\d,.]+)\s+(?:from|by)\s+([A-Za-z0-9\s.&]+)/i,
    groups: { currency: 1, amount: 2, merchant: 3 }
  },
  // Simple Salary Pattern: "Salary of $5000 credited"
  {
    type: 'income',
    regex: /(?:salary|dividend)\s+(?:of)?\s+([A-Za-z$€£₹]+)?\s?([\d,.]+)\s+(?:credited|received)/i,
    groups: { currency: 1, amount: 2, merchant: 0 } // 0 means hardcode generic
  }
];

const guessCategory = (merchant: string, type: 'income' | 'expense'): string => {
  const lowerM = merchant.toLowerCase();
  
  if (type === 'income') {
    if (lowerM.includes('salary') || lowerM.includes('payroll')) return 'Salary';
    if (lowerM.includes('refund') || lowerM.includes('return')) return 'Other';
    if (lowerM.includes('interest')) return 'Investment';
    return 'Other';
  }

  // Expense Categories
  if (lowerM.includes('uber') || lowerM.includes('lyft') || lowerM.includes('fuel') || lowerM.includes('shell') || lowerM.includes('metro')) return 'Transport';
  if (lowerM.includes('food') || lowerM.includes('burger') || lowerM.includes('pizza') || lowerM.includes('cafe') || lowerM.includes('coffee') || lowerM.includes('starbucks') || lowerM.includes('mcdonald')) return 'Food & Dining';
  if (lowerM.includes('market') || lowerM.includes('mart') || lowerM.includes('grocery') || lowerM.includes('whole foods')) return 'Shopping';
  if (lowerM.includes('netflix') || lowerM.includes('spotify') || lowerM.includes('cinema')) return 'Entertainment';
  if (lowerM.includes('pharmacy') || lowerM.includes('doctor') || lowerM.includes('hospital') || lowerM.includes('cvs')) return 'Health';
  if (lowerM.includes('electric') || lowerM.includes('water') || lowerM.includes('bill') || lowerM.includes('mobile')) return 'Utilities';
  
  return 'Other';
};

const parseDate = (text: string): string => {
  // Attempt to find dates like DD-MM-YYYY or DD/MM or YYYY-MM-DD
  // This is complex in regex, defaulting to today for local parser MVP
  // Enhancing to look for simple DD-MMM format (e.g. 12-Oct)
  const match = text.match(/(\d{1,2})[-/]([A-Za-z]{3}|\d{2})(?:[-/](\d{2,4}))?/);
  if (match) {
    try {
      const day = match[1];
      const monthStr = match[2];
      const year = match[3] || new Date().getFullYear().toString();
      
      const dateStr = `${day} ${monthStr} ${year}`;
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    } catch (e) {
      // Fallback
    }
  }
  return new Date().toISOString().split('T')[0];
};

export const parseSmsLocally = (text: string): ParsedSmsResult | null => {
  const cleanText = text.replace(/\n/g, ' ').trim();

  for (const pattern of PATTERNS) {
    const match = cleanText.match(pattern.regex);
    if (match) {
      // Extract raw strings
      const currencyRaw = pattern.groups.currency ? match[pattern.groups.currency] : '';
      const amountRaw = match[pattern.groups.amount];
      let merchantRaw = pattern.groups.merchant ? match[pattern.groups.merchant] : 'Unknown';
      
      // Special case for hardcoded merchant index 0 (like Salary regex)
      if (pattern.groups.merchant === 0) merchantRaw = 'Employer/Bank';

      // Clean up Amount (remove commas)
      const amount = parseFloat(amountRaw.replace(/,/g, ''));

      // Clean up Currency
      let currency = 'USD'; // Default
      if (currencyRaw) {
        const cClean = currencyRaw.trim().toUpperCase();
        currency = CURRENCY_MAP[cClean] || cClean.substring(0, 3); // Take first 3 chars if unknown
      }

      // Clean up Merchant (remove trailing punctuation)
      const merchant = merchantRaw.trim().replace(/[.,]+$/, '');
      
      // Guess Category
      const category = guessCategory(merchant, pattern.type);

      // Extract Date
      const date = parseDate(cleanText);

      return {
        amount,
        currency,
        merchant,
        category,
        type: pattern.type,
        date
      };
    }
  }

  return null; // No match found
};
