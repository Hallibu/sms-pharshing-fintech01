import React, { useEffect, useState } from 'react';
import { getTransactions, getSettings, deleteTransaction } from '../services/storage';
import { Transaction, AppSettings, CURRENCY_SYMBOLS } from '../types';
import TransactionCard from '../components/TransactionCard';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const loadData = () => {
    const data = getTransactions();
    const storedSettings = getSettings();
    setTransactions(data);
    setSettings(storedSettings);
  };

  useEffect(() => {
    loadData();
    // Listen for focus to refresh data if user came from another tab
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Delete this transaction?')) {
      deleteTransaction(id);
      loadData();
    }
  };

  if (!settings) return null;

  const currencySymbol = CURRENCY_SYMBOLS[settings.displayCurrency] || '$';

  // Filter transactions
  const displayedTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  // Calculate Totals (Naive approach: converting everything 1:1 for display if multi-currency, 
  // normally would need exchange rates. Here we just sum numbers for the demo)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header Section */}
      <div className="bg-blue-600 pt-8 pb-8 px-6 rounded-b-[2.5rem] shadow-xl text-white relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-blue-100 text-sm font-medium mb-1">Total Balance</h1>
            <div className="text-4xl font-bold tracking-tight">
              {currencySymbol} {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-blue-500/30 p-2 rounded-lg backdrop-blur-sm">
            <Wallet size={24} className="text-blue-100" />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-blue-700/40 backdrop-blur-md rounded-xl p-3 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-green-400/20 p-1 rounded-md">
                <TrendingUp size={14} className="text-green-300" />
              </div>
              <span className="text-xs text-blue-100">Income</span>
            </div>
            <p className="font-semibold text-lg">{currencySymbol} {totalIncome.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-blue-700/40 backdrop-blur-md rounded-xl p-3 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-red-400/20 p-1 rounded-md">
                <TrendingDown size={14} className="text-red-300" />
              </div>
              <span className="text-xs text-blue-100">Expenses</span>
            </div>
            <p className="font-semibold text-lg">{currencySymbol} {totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 px-6 flex gap-4 overflow-x-auto no-scrollbar">
        {(['all', 'expense', 'income'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}s
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Recent Transactions</h2>
        {displayedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p>No transactions found.</p>
            <p className="text-xs mt-1">Tap + to add one.</p>
          </div>
        ) : (
          displayedTransactions.map(t => (
            <TransactionCard 
              key={t.id} 
              transaction={t} 
              onDelete={handleDelete}
              displayCurrencySymbol={currencySymbol}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;