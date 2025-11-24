import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings, clearAllData, getTransactions } from '../services/storage';
import { AppSettings, Currency, CURRENCY_SYMBOLS } from '../types';
import { Trash2, Shield, Info, Globe, ChevronRight, DownloadCloud, FileText } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettingsState] = useState<AppSettings>({ displayCurrency: Currency.USD, theme: 'light' });

  useEffect(() => {
    setSettingsState(getSettings());
  }, []);

  const updateCurrency = (c: Currency) => {
    const newSettings = { ...settings, displayCurrency: c };
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const handleClearData = () => {
    if (confirm("Are you sure? This will delete ALL transactions and rules. This cannot be undone.")) {
      clearAllData();
      alert("Data cleared.");
      window.location.reload();
    }
  };

  const handleExportCSV = () => {
    const transactions = getTransactions();
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = ["Date", "Amount", "Currency", "Type", "Category", "Description", "Sender"];
    const rows = transactions.map(t => [
      t.date,
      t.amount,
      t.currency,
      t.type,
      t.category,
      `"${t.description}"`, // Quote description to handle commas
      t.sender || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="p-6 flex flex-col gap-6 overflow-y-auto pb-24">
        
        {/* Currency Section */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">Preferences</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Globe size={20} />
                </div>
                <span className="font-medium text-gray-700">Currency</span>
              </div>
              <select 
                value={settings.displayCurrency}
                onChange={(e) => updateCurrency(e.target.value as Currency)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none focus:border-blue-500"
              >
                {Object.keys(Currency).map(c => (
                  <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">Data & Privacy</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <button 
              onClick={handleExportCSV}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
             >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <FileText size={20} />
                </div>
                <span className="font-medium text-gray-700">Export to CSV</span>
              </div>
              <DownloadCloud size={16} className="text-gray-300" />
             </button>

             <button 
              onClick={handleClearData}
              className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors text-left"
             >
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                  <Trash2 size={20} />
                </div>
                <span className="font-medium text-red-600">Clear All Data</span>
              </div>
              <ChevronRight size={16} className="text-red-300" />
             </button>
          </div>
        </section>

        {/* About */}
        <section>
           <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">About</h2>
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 text-sm text-gray-600">
              <div className="flex items-start gap-3 mb-4">
                <Shield size={20} className="text-green-600 shrink-0 mt-0.5" />
                <p>Data is stored locally on your device. We do not send your transactions to any external server other than the AI processing step.</p>
              </div>
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <p>Powered by Gemini 2.5 Flash for intelligent SMS parsing.</p>
              </div>
           </div>
        </section>
        
        <div className="mt-auto text-center pb-4">
            <p className="text-xs text-gray-400">Version 1.1.0</p>
        </div>

      </div>
    </div>
  );
};

export default Settings;