import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import SponsorshipManager from './SponsorshipManager';
import OrganizerTasksManager from './OrganizerTasksManager';
import TeamRegistrationManager from './TeamRegistrationManager';
import ParticipantPrivateManager from './ParticipantPrivateManager';
import CheckInStation from './CheckInStation';
import TableRoomManager from './TableRoomManager';
import NotificationDispatcher from './NotificationDispatcher';
import JsonExportCenter from './JsonExportCenter';
import Toast from '../common/Toast';
import { 
  LayoutDashboard, 
  DollarSign, 
  CheckSquare, 
  Users, 
  HeartPulse, 
  UserCheck, 
  MapPin, 
  Bell, 
  FileJson,
  ArrowLeft,
  Shield,
  Terminal
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Executive Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/sponsorships', label: 'Sponsorships Ledger', icon: DollarSign, badge: 'Private' },
    { path: '/admin/tasks', label: 'Committee Tasks', icon: CheckSquare, badge: 'Ops' },
    { path: '/admin/teams', label: 'Team Approvals', icon: Users, badge: 'Review' },
    { path: '/admin/participants', label: 'Participant Health & CV', icon: HeartPulse, badge: 'Confidential' },
    { path: '/admin/checkins', label: 'Desk Check-In Station', icon: UserCheck, badge: 'Live' },
    { path: '/admin/tables', label: 'Workstation Tables', icon: MapPin, badge: 'Venue' },
    { path: '/admin/notifications', label: 'Alert Dispatcher', icon: Bell, badge: 'Broadcast' },
    { path: '/admin/export', label: 'JSON Data Exporter', icon: FileJson, badge: 'Engine' },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      
      {/* Top Admin Bar */}
      <header className="h-14 bg-[#0a0e17] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>

          <div className="h-4 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white">BIC Hackathon Admin</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.2 rounded">
              v4.0 Ops
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-2 font-mono text-slate-400 bg-[#07090e] px-3 py-1.5 rounded-lg border border-slate-800/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Origin: bic_hackathon_design</span>
          </div>

          <div className="flex items-center gap-2 pl-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-white">
              SS
            </div>
            <span className="text-slate-300 font-medium hidden md:inline">saurav.sharma</span>
          </div>
        </div>
      </header>

      {/* Main Admin Body: Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-64 shrink-0 bg-[#090d16] border-r border-slate-800/80 p-3 hidden md:flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Private Management Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                      isActive 
                        ? 'bg-indigo-700 text-white' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#06080e] border border-slate-800/80 text-[11px] text-slate-500 font-mono">
            <div>Route: <code className="text-slate-300">{location.pathname}</code></div>
            <div className="mt-1 text-slate-400">Strictly Private Access</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {/* Mobile Tab Scroller */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                    isActive ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Route views */}
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="sponsorships" element={<SponsorshipManager />} />
            <Route path="tasks" element={<OrganizerTasksManager />} />
            <Route path="teams" element={<TeamRegistrationManager />} />
            <Route path="participants" element={<ParticipantPrivateManager />} />
            <Route path="checkins" element={<CheckInStation />} />
            <Route path="tables" element={<TableRoomManager />} />
            <Route path="notifications" element={<NotificationDispatcher />} />
            <Route path="export" element={<JsonExportCenter />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>

      </div>

      <Toast />
    </div>
  );
}
