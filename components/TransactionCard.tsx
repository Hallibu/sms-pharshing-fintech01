import React from 'react';
import { Transaction, CURRENCY_SYMBOLS } from '../types';
import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';

interface Props {
  transaction: Transaction;
  onDelete: (id: string) => void;
  displayCurrencySymbol: string;
}

const TransactionCard: React.FC<Props> = ({ transaction, onDelete, displayCurrencySymbol }) => {
  const isIncome = transaction.type === 'income';

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3 flex items-center justify-between transition-all hover:shadow-md">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`p-2.5 rounded-full shrink-0 ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {isIncome ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{transaction.description}</h3>
          <div className="flex items-center text-xs text-gray-500 gap-2 mt-0.5">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{transaction.category}</span>
            <span>•</span>
            <span>{new Date(transaction.date).toLocaleDateString()}</span>
          </div>
          {transaction.sender && (
            <p className="text-[10px] text-gray-400 mt-1 truncate">From: {transaction.sender}</p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
        <span className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
          {isIncome ? '+' : '-'}
          {CURRENCY_SYMBOLS[transaction.currency] || transaction.currency} 
          {transaction.amount.toLocaleString()}
        </span>
        <button 
          onClick={() => onDelete(transaction.id)}
          className="text-gray-300 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;