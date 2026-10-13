import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHackathon } from '../../context/HackathonContext';
import { 
  DollarSign, 
  Users, 
  CheckSquare, 
  MapPin, 
  Bell, 
  FileJson,
  UserCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    teams, 
    registrations, 
    checkIns, 
    sponsorships, 
    orgTasks, 
    participants, 
    tables, 
    notifications 
  } = useHackathon();

  // Financial aggregates from Private Model: Sponsorship
  const totalPledged = sponsorships.reduce((acc, s) => acc + Number(s.pledged || 0), 0);
  const totalPaid = sponsorships.reduce((acc, s) => acc + Number(s.paid || 0), 0);
  const pendingCollection = totalPledged - totalPaid;

  // Operational aggregates
  const totalTeams = teams.length;
  const approvedTeams = registrations.filter(r => r.status === 'approved').length;
  const checkedInCount = checkIns.length;
  const checkInRate = totalTeams > 0 ? Math.round((checkedInCount / totalTeams) * 100) : 0;
  
  const pendingTasks = orgTasks.filter(t => t.status !== 'completed').length;
  const urgentTasks = orgTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const allocatedTables = tables.filter(t => t.status === 'assigned').length;

  return (
    <div className="space-y-6">
      
      {/* Executive Welcome & Notice */}
      <div className="p-6 rounded-2xl bg-[#0e131f] border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-mono text-indigo-300 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Private Operations Dashboard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Operations & Event Control Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Confidential ledger tracking, participant health & dietary requirements, table allocation, and organizer tasks.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/admin/export')}
              className="px-3.5 py-2 rounded-lg font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-2 transition-colors"
            >
              <FileJson className="w-4 h-4 text-slate-400" />
              <span>JSON Exporter</span>
            </button>
            <button
              onClick={() => navigate('/admin/checkins')}
              className="px-4 py-2 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Desk Check-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Financial Sponsorships */}
        <div 
          onClick={() => navigate('/admin/sponsorships')}
          className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">
              Sponsorship Ledger
            </span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            NPR {totalPaid.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Pledged: NPR {totalPledged.toLocaleString()}</span>
            <span className="text-amber-400">Private</span>
          </div>
        </div>

        {/* Metric 2: Team Registrations */}
        <div 
          onClick={() => navigate('/admin/teams')}
          className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">
              Squad Applications
            </span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {approvedTeams} <span className="text-sm font-normal text-slate-500">/ {totalTeams}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>{totalTeams - approvedTeams} Pending Review</span>
            <span className="text-sky-400">Registrations</span>
          </div>
        </div>

        {/* Metric 3: Desk Check-In Rate */}
        <div 
          onClick={() => navigate('/admin/checkins')}
          className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">
              Desk Attendance
            </span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {checkedInCount} <span className="text-xs font-normal text-emerald-400">({checkInRate}%)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>On-Site at Desks</span>
            <span className="text-emerald-400">CheckIn</span>
          </div>
        </div>

        {/* Metric 4: Operational Tasks */}
        <div 
          onClick={() => navigate('/admin/tasks')}
          className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400">
              Committee Tasks
            </span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {pendingTasks} <span className="text-sm font-normal text-slate-500">Active</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span className="text-rose-400">{urgentTasks} Urgent</span>
            <span className="text-indigo-400">OrgTask</span>
          </div>
        </div>

      </div>

      {/* Secondary Quick Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Workstation Table Allocations */}
        <div className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>Workstation Tables</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Table</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Hall A & Hall B desk allocations with power outlets and wired ethernet.
            </p>
            <div className="text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Assigned Desks</span>
                <span className="font-bold text-white">{allocatedTables} / {tables.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Zones</span>
                <span className="text-slate-400">Hall A, Hall B</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/tables')}
            className="mt-4 w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Manage Seating Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Confidential Participant Intelligence */}
        <div className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Health & Diet Records</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Participant</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Confidential medical conditions, food allergies, and candidate resumes.
            </p>
            <div className="text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Dietary Tracked</span>
                <span className="font-bold text-white">{participants.length} Registrants</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Medical Alerts</span>
                <span className="text-amber-400">Allergies & Asthma Flagged</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/participants')}
            className="mt-4 w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Review Medical Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Broadcast System Alerts */}
        <div className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-400" />
                <span>Live Broadcast Alerts</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Notification</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Real-time push alerts to participants, squad leads, or organizers.
            </p>
            <div className="text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Dispatched</span>
                <span className="font-bold text-white">{notifications.length} Alerts</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Target Channel</span>
                <span className="text-slate-400">All Participants</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/notifications')}
            className="mt-4 w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Alert Dispatcher</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
