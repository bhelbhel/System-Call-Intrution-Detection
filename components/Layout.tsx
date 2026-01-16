
import React from 'react';
import { 
  ShieldCheck, 
  Upload, 
  LayoutDashboard, 
  History, 
  Settings, 
  User, 
  Bell, 
  Search,
  Terminal,
  Activity,
  LogOut,
  AlertOctagon
} from 'lucide-react';
import { ViewState, SecurityAlert } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  setView: (view: ViewState) => void;
  onLogout?: () => void;
  alerts: SecurityAlert[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onLogout, alerts }) => {
  const unreadCount = alerts.filter(a => !a.read).length;
  
  const menuItems = [
    { id: 'UPLOAD', label: 'Ingestion', icon: Upload },
    { id: 'DASHBOARD', label: 'Analysis', icon: LayoutDashboard },
    { id: 'ALERTS', label: 'Alert Center', icon: Bell, count: unreadCount },
    { id: 'HISTORY', label: 'Archived Logs', icon: History },
    { id: 'SETTINGS', label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-sky-500/20 p-2 rounded-lg border border-sky-500/30">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">SysGuard <span className="text-sky-500">IDS</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-2 pb-2 tracking-widest">Navigation</div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                activeView === item.id 
                  ? 'bg-sky-600/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] text-center">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
           <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-400 font-mono">SYSTEM READY</span>
             </div>
             <div className="flex justify-between items-center">
                <Activity className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-mono text-slate-500">LOAD: 12.4%</span>
             </div>
           </div>
           
           <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-semibold text-white">Admin Analyst</p>
                <p className="text-[10px] text-slate-500">Tier 3 Security</p>
              </div>
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 flex-1">
             <div className="relative max-w-md w-full hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search logs, syscalls, or nodes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all text-slate-300"
                />
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('ALERTS')}
              className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
              )}
            </button>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Terminal className="w-4 h-4" />
              <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">OS_LAB_ENV-v2.1</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
          
          <footer className="mt-12 pt-8 border-t border-slate-800 flex justify-between items-center text-slate-500 text-xs">
            <p>© 2024 OS Lab Mini Project - System Call IDS Dashboard</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-300 cursor-help">Technical Documentation</span>
              <span className="hover:text-slate-300 cursor-help">Kernel Hooks API</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
