
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquare, Edit3, Check, Loader2, Sparkles, WifiOff, Smartphone, CloudLightning } from 'lucide-react';
import { CATEGORIES, Transaction, TransactionType, Currency, CURRENCY_SYMBOLS, SmsSenderRule } from '../types';
import { saveTransaction, getSettings, getWhitelist } from '../services/storage';
import { parseSmsWithGemini } from '../services/gemini';
import { parseSmsLocally } from '../services/localParser';

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'sms'>('sms');
  const [isLoading, setIsLoading] = useState(false);
  const [senderWhitelist, setSenderWhitelist] = useState<SmsSenderRule[]>([]);

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<string>(Currency.USD);

  // SMS State
  const [smsText, setSmsText] = useState('');
  const [smsSender, setSmsSender] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [methodUsed, setMethodUsed] = useState<'local' | 'ai' | null>(null);

  useEffect(() => {
    const settings = getSettings();
    setCurrency(settings.displayCurrency);
    setSenderWhitelist(getWhitelist());
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: uuidv4(),
      amount: parseFloat(amount),
      currency,
      description,
      category,
      type,
      date,
    };
    saveTransaction(newTransaction);
    navigate('/');
  };

  const fillForm = (result: any, method: 'local' | 'ai') => {
    setAmount(result.amount.toString());
    setCurrency(result.currency.toUpperCase());
    setDescription(result.merchant);
    setCategory(result.category);
    setType(result.type);
    setDate(result.date);
    
    setMethodUsed(method);
    setMode('manual'); // Switch to form view for verification
    setFeedback(`Success! Parsed using ${method === 'local' ? 'Offline Regex' : 'Gemini AI'}. Please verify and save.`);
  };

  const handleSmsParse = async () => {
    if (!smsText.trim()) {
      setFeedback("Please paste SMS content.");
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    setMethodUsed(null);

    // 1. Try Local Regex Parser First (Fast, Offline)
    try {
      const localResult = parseSmsLocally(smsText);
      
      // Check whitelist to override category if exists
      const matchedRule = senderWhitelist.find(r => 
        smsSender && r.senderName.toLowerCase() === smsSender.toLowerCase()
      );

      if (localResult) {
        if (matchedRule?.defaultCategory) {
          localResult.category = matchedRule.defaultCategory;
        }
        
        // Add delay purely for UX so it doesn't feel glitchy
        setTimeout(() => {
          fillForm(localResult, 'local');
          setIsLoading(false);
        }, 500);
        return;
      }
    } catch (e) {
      console.warn("Local parse failed", e);
    }

    // 2. If Local fails, check online status for AI
    if (!navigator.onLine) {
        setFeedback("Could not auto-detect format offline. Please enter details manually.");
        setIsLoading(false);
        return;
    }

    // 3. Try Gemini AI
    try {
      const matchedRule = senderWhitelist.find(r => 
        smsSender && r.senderName.toLowerCase() === smsSender.toLowerCase()
      );

      const result = await parseSmsWithGemini(smsText, smsSender);
      
      // Override category if rule exists
      const finalCategory = matchedRule?.defaultCategory || result.category;

      fillForm({ ...result, category: finalCategory }, 'ai');

    } catch (error) {
      setFeedback("Could not understand the SMS. Please try manual entry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Add Transaction</h1>
        <p className="text-sm text-gray-500">Log your income or expenses</p>
      </div>

      <div className="p-4 overflow-y-auto pb-24">
        <div className="bg-gray-200 p-1 rounded-lg flex mb-6">
          <button
            onClick={() => setMode('sms')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${
              mode === 'sms' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <MessageSquare size={16} />
            Parse SMS
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${
              mode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Edit3 size={16} />
            Manual
          </button>
        </div>

        {mode === 'sms' ? (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                <Sparkles size={18} />
                <span>Smart Parser</span>
              </div>
              <p className="text-sm text-blue-600">
                Paste your bank SMS. The app will try to parse it locally first (offline). If that fails, it uses AI.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender (Optional)</label>
              <input
                type="text"
                value={smsSender}
                onChange={(e) => setSmsSender(e.target.value)}
                placeholder="e.g. BankOfAmerica, HDFC"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Paste SMS here... e.g. 'Acct XX123 debited for $12.50 at Starbucks on 12-Oct'"
                className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {feedback && (
              <div className={`text-sm p-3 rounded-lg flex items-start gap-2 ${feedback.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                 <span className="mt-0.5 shrink-0">
                  {feedback.includes('Offline') && <WifiOff size={16} />}
                  {feedback.includes('Gemini') && <CloudLightning size={16} />}
                  {feedback.includes('Regex') && <Smartphone size={16} />}
                 </span>
                {feedback}
              </div>
            )}

            <button
              onClick={handleSmsParse}
              disabled={isLoading || !smsText}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze Text'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 animate-fade-in">
            
            {methodUsed && (
              <div className="bg-green-50 border border-green-100 text-green-800 text-xs px-3 py-2 rounded-lg flex items-center justify-between mb-2">
                 <span>Data extracted via {methodUsed === 'local' ? 'Offline Parser' : 'Gemini AI'}. Please verify.</span>
                 <Check size={14} />
              </div>
            )}

            <div className="flex gap-4">
               <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
               </div>
               <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                />
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">{CURRENCY_SYMBOLS[currency] || '$'}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                placeholder="e.g. Starbucks, Salary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              <Check size={20} />
              Save Transaction
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddTransaction;
