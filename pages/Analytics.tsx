import React, { useEffect, useState } from 'react';
import { getTransactions, getSettings } from '../services/storage';
import { Transaction, AppSettings, CURRENCY_SYMBOLS } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react';

const Analytics: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  useEffect(() => {
    setTransactions(getTransactions());
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  const currencySymbol = CURRENCY_SYMBOLS[settings.displayCurrency] || '$';
  const now = new Date();

  // Filter Transactions based on Period
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    if (period === 'month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    }
    return tDate.getFullYear() === now.getFullYear();
  });

  // 1. Overview Stats
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netBalance = totalIncome - totalExpense;

  // 2. Balance Trend (Running Balance Logic)
  // We need to calculate the running balance from the beginning of time to get the correct absolute balance
  // Then we slice it for the view.
  const sortedAllTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningBalance = 0;
  const balanceHistory = sortedAllTransactions.map(t => {
    runningBalance += t.type === 'income' ? t.amount : -t.amount;
    return {
      date: t.date,
      balance: runningBalance,
      amount: t.amount,
      merchant: t.description,
      type: t.type
    };
  });

  // Filter balance history points that fall within the selected period
  const balanceTrendData = balanceHistory.filter(item => {
    const tDate = new Date(item.date);
    if (period === 'month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    }
    return tDate.getFullYear() === now.getFullYear();
  });

  // 3. Top Spending Sources (Merchants)
  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  const merchantStats: Record<string, number> = {};
  
  expenses.forEach(t => {
    // Use description as the "Source/Merchant"
    const source = t.description || 'Unknown';
    merchantStats[source] = (merchantStats[source] || 0) + t.amount;
  });

  const topSources = Object.entries(merchantStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  // 4. Category Breakdown
  const categoryStats: Record<string, number> = {};
  expenses.forEach(t => {
    categoryStats[t.category] = (categoryStats[t.category] || 0) + t.amount;
  });

  const pieData = Object.keys(categoryStats).map(cat => ({
    name: cat,
    value: categoryStats[cat]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6 overflow-y-auto no-scrollbar pb-24">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setPeriod('month')} 
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${period === 'month' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            Month
          </button>
          <button 
            onClick={() => setPeriod('year')} 
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${period === 'year' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
             <div className="bg-red-100 p-1.5 rounded text-red-500">
               <TrendingDown size={16} />
             </div>
             <span className="text-xs font-bold text-gray-500 uppercase">Spent</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{currencySymbol}{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
             <div className="bg-blue-100 p-1.5 rounded text-blue-500">
               <TrendingUp size={16} />
             </div>
             <span className="text-xs font-bold text-gray-500 uppercase">Net Balance</span>
          </div>
          <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
            {netBalance >= 0 ? '+' : ''}{currencySymbol}{netBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Balance History Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Balance History</h3>
        <div className="h-48 w-full text-xs">
          {balanceTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).getDate().toString()}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af' }} 
                  minTickGap={10}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100 text-xs z-50">
                          <p className="font-bold text-gray-800 mb-1">{new Date(data.date).toLocaleDateString()}</p>
                          <div className="flex justify-between gap-4 mb-1">
                            <span className="text-gray-500">{data.merchant}</span>
                            <span className={`font-semibold ${data.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                               {data.type === 'income' ? '+' : '-'}{currencySymbol}{data.amount}
                            </span>
                          </div>
                          <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between gap-4">
                            <span className="text-gray-400 font-medium">Balance:</span> 
                            <span className="text-blue-600 font-bold">{currencySymbol}{data.balance.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: '#bfdbfe', strokeWidth: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No transactions in this period
            </div>
          )}
        </div>
      </div>

      {/* Top Spending Sources */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Top Spending Sources</h3>
        <div className="space-y-3">
          {topSources.length > 0 ? (
            topSources.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-gray-100 p-2 rounded-full text-gray-500 shrink-0">
                     <ShoppingBag size={16} />
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-semibold text-gray-700 truncate">{item.name}</p>
                     <p className="text-[10px] text-gray-400">
                       {Math.round((item.value / totalExpense) * 100)}% of total
                     </p>
                   </div>
                </div>
                <p className="font-bold text-gray-800">{currencySymbol}{item.value.toLocaleString()}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 text-xs py-4">No expenses recorded</div>
          )}
        </div>
      </div>

      {/* Category Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Spending by Category</h3>
        {pieData.length > 0 ? (
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${currencySymbol} ${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.slice(0, 4).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs text-gray-600 truncate flex-1">{entry.name}</span>
                  <span className="text-xs font-bold">{Math.round((entry.value / totalExpense) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
           <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data available</div>
        )}
      </div>
    </div>
  );
};

export default Analytics;