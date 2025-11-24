import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getWhitelist, saveWhitelistRule, deleteWhitelistRule } from '../services/storage';
import { SmsSenderRule, CATEGORIES } from '../types';
import { Plus, Trash2, ToggleLeft, ToggleRight, MessageSquareCode, Apple, Download, ExternalLink } from 'lucide-react';

const Shortcuts: React.FC = () => {
  const [whitelist, setWhitelist] = useState<SmsSenderRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Rule Form
  const [newSender, setNewSender] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    setWhitelist(getWhitelist());
  }, []);

  const handleSaveRule = () => {
    if (!newSender.trim()) return;
    const rule: SmsSenderRule = {
      id: uuidv4(),
      senderName: newSender.trim(),
      autoProcess: true,
      defaultCategory: newCategory
    };
    saveWhitelistRule(rule);
    setWhitelist(getWhitelist());
    setNewSender('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    deleteWhitelistRule(id);
    setWhitelist(getWhitelist());
  };

  const toggleAutoProcess = (rule: SmsSenderRule) => {
    saveWhitelistRule({ ...rule, autoProcess: !rule.autoProcess });
    setWhitelist(getWhitelist());
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">SMS Rules & Automation</h1>
        <p className="text-sm text-gray-500">Manage trusted senders and iOS shortcuts</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-24">
        
        {/* iOS Automation Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white shadow-lg mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Apple size={20} /> iOS Automation
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                Automatically parse SMS when you open the app.
              </p>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <MessageSquareCode size={24} />
            </div>
          </div>
          
          <div className="space-y-3 text-xs text-gray-300 mb-4">
            <p>1. Download our iOS Shortcut.</p>
            <p>2. Set it to run when you receive a message from your bank.</p>
            <p>3. It will copy the SMS to your clipboard and open this app.</p>
          </div>

          <a 
            href="#" // In a real app, this would be an iCloud link (e.g., https://www.icloud.com/shortcuts/...)
            onClick={(e) => { e.preventDefault(); alert("In a real deployment, this would open the Apple Shortcuts app to install the automation."); }}
            className="w-full bg-white text-gray-900 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Download size={16} />
            Download Shortcut
          </a>
        </div>

        {/* Add New Rule Section */}
        <div className="flex items-center justify-between mb-3 ml-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trusted Senders</h2>
          {!isAdding && (
             <button 
               onClick={() => setIsAdding(true)}
               className="text-blue-600 text-xs font-bold flex items-center gap-1"
             >
               <Plus size={14} /> Add New
             </button>
          )}
        </div>

        {isAdding && (
          <div className="bg-white p-4 rounded-xl shadow-lg border border-blue-100 mb-6 animate-fade-in">
             <h3 className="font-bold text-gray-700 mb-3">Add Trusted Sender</h3>
             <input 
              type="text"
              placeholder="Sender Name (e.g. HDFC-BANK)"
              value={newSender}
              onChange={(e) => setNewSender(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg mb-3 outline-none focus:border-blue-500 text-sm"
             />
             <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg mb-4 outline-none text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 text-gray-500 font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRule}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md text-sm"
                >
                  Save Rule
                </button>
              </div>
          </div>
        )}

        <div className="space-y-3">
          {whitelist.length === 0 && !isAdding ? (
            <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm">No trusted senders yet.</p>
            </div>
          ) : (
            whitelist.map(rule => (
              <div key={rule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{rule.senderName}</h4>
                  <p className="text-xs text-gray-500">Category: {rule.defaultCategory}</p>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => toggleAutoProcess(rule)}
                    className={`${rule.autoProcess ? 'text-green-500' : 'text-gray-300'}`}
                   >
                     {rule.autoProcess ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                   </button>
                   <button 
                    onClick={() => handleDelete(rule.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Shortcuts;