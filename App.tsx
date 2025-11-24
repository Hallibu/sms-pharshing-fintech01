import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Shortcuts from './pages/Shortcuts';

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/shortcuts" element={<Shortcuts />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;