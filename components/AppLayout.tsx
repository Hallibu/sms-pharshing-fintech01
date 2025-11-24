import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, PieChart, Settings, MessageSquare } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Main Content Area */}
      <main className="pb-24 max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center w-full h-full justify-center ${isActive('/') ? 'text-blue-600' : 'text-gray-400'}`}>
            <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
            <span className="text-[10px] mt-1">Home</span>
          </Link>
          
          <Link to="/analytics" className={`flex flex-col items-center w-full h-full justify-center ${isActive('/analytics') ? 'text-blue-600' : 'text-gray-400'}`}>
            <PieChart size={24} strokeWidth={isActive('/analytics') ? 2.5 : 2} />
            <span className="text-[10px] mt-1">Analytics</span>
          </Link>

          <Link to="/add" className="relative -top-5">
            <div className="bg-blue-600 text-white rounded-full p-4 shadow-lg transform transition-transform active:scale-95">
              <PlusCircle size={32} />
            </div>
          </Link>

          <Link to="/shortcuts" className={`flex flex-col items-center w-full h-full justify-center ${isActive('/shortcuts') ? 'text-blue-600' : 'text-gray-400'}`}>
            <MessageSquare size={24} strokeWidth={isActive('/shortcuts') ? 2.5 : 2} />
            <span className="text-[10px] mt-1">Rules</span>
          </Link>

          <Link to="/settings" className={`flex flex-col items-center w-full h-full justify-center ${isActive('/settings') ? 'text-blue-600' : 'text-gray-400'}`}>
            <Settings size={24} strokeWidth={isActive('/settings') ? 2.5 : 2} />
            <span className="text-[10px] mt-1">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;