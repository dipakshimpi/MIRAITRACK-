import React, { useState } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';
import SubmissionForm from './SubmissionForm';
import Leaderboard from './Leaderboard';
import Analytics from './Analytics';
import AttendanceSystem from './AttendanceSystem';
import NotificationSystem from './NotificationSystem';
import PendingApproval from './PendingApproval';
import ApprovalsManager from './ApprovalsManager';
import MonthlyReport from './MonthlyReport';
import { UserProfile } from './types';
import keycloak from './lib/keycloak';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';

import { 
  LayoutDashboard, 
  PlusCircle, 
  Trophy, 
  BarChart3, 
  LogOut, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'submit' | 'leaderboard' | 'analytics' | 'approvals' | 'monthly';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await keycloak.logout();
    setUser(null);
  };


  if (!user) {
    return <Auth onUserChange={setUser} />;
  }

  if (user.status === 'pending' && !user.is_super_profile) {
    return <PendingApproval />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'submit', label: 'Submit Report', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    ...(user.is_super_profile ? [
      { id: 'approvals', label: 'Approvals', icon: <ShieldCheck className="w-5 h-5" /> },
      { id: 'monthly', label: 'Monthly Report', icon: <BarChart3 className="w-5 h-5" /> }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AttendanceSystem />
      <NotificationSystem />
      <Toaster position="top-right" expand={true} richColors />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Mirai Track</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-900 truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 truncate uppercase font-bold tracking-widest">Member</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <h1 className="text-lg font-black text-slate-900">Mirai Track</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-[61px] bg-white z-40 p-6 space-y-4"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-lg font-bold ${
                  activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="pt-6 border-t border-slate-100">
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full h-12 rounded-xl"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'submit' && <SubmissionForm user={user} />}
            {activeTab === 'leaderboard' && <Leaderboard />}
            {activeTab === 'analytics' && <Analytics />}
            {user.is_super_profile && activeTab === 'approvals' && <ApprovalsManager />}
            {user.is_super_profile && activeTab === 'monthly' && <MonthlyReport />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
