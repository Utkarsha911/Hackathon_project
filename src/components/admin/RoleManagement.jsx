import React, { useState } from 'react';
import { Shield, Key, Users, CheckCircle2, Search, Sparkles } from 'lucide-react';

const SYSTEM_ROLES = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    description: 'Master administrative privileges with access to manage users, groups, teams, scoring, and logs.',
    usersCount: 1,
    permissionsCount: 48,
    scopes: ['System Settings', 'User Control', 'Group Allocation', 'API Keys', 'Log Audits']
  },
  {
    id: 'organizer',
    name: 'Organizer',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Responsible for event staging, check-in operations, mentor scheduling, and venue announcements.',
    usersCount: 4,
    permissionsCount: 26,
    scopes: ['Participant Check-In', 'Team Verification', 'Schedule Updates', 'Broadcasts']
  },
  {
    id: 'judge',
    name: 'Judge',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Evaluates team repositories, prototype demonstrations, and submits track scorecards.',
    usersCount: 8,
    permissionsCount: 14,
    scopes: ['Rubric Scoring', 'Project Review', 'Evaluation Feedback', 'Leaderboard Views']
  },
  {
    id: 'participant',
    name: 'Participant / Attendee',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Registered portal participant with access to workshops, agenda, team workspace, and submissions.',
    usersCount: 64,
    permissionsCount: 8,
    scopes: ['Team Dashboard', 'Project Submission', 'Workshop RSVP', 'Profile Editing']
  }
];

export default function RoleManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoles = SYSTEM_ROLES.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Role Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review system roles, permission scopes, and allocated security tiers across the platform
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter roles or permissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#e8622a]"
        />
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-orange-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center font-bold text-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {role.name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {role.id}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${role.badgeColor}`}>
                  {role.usersCount} Assigned
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {role.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Authorized Scopes
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.scopes.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{role.permissionsCount} Permissions Enforced</span>
              <span className="text-[#e8622a] font-semibold">Active Tier</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
