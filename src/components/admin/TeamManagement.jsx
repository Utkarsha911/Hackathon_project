import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import fallbackTeams from '../../data/json/teams.json';
import {
  Users,
  Search,
  RefreshCw,
  Award,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  GitBranch
} from 'lucide-react';

export default function TeamManagement() {
  const [teams, setTeams] = useState(() => (Array.isArray(fallbackTeams) ? fallbackTeams : []));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await api.teams.getAll();
      const list = Array.isArray(response)
        ? response
        : response?.results || response?.data || [];
      if (list && list.length > 0) {
        setTeams(list);
      }
    } catch (err) {
      console.warn('Teams fetch error, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((t) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (t.name || '').toLowerCase().includes(term);
    const orgMatch = (t.college_org || '').toLowerCase().includes(term);
    const projMatch = (t.project_title || '').toLowerCase().includes(term);
    const trackMatch = (t.track || '').toLowerCase().includes(term);

    const matchesSearch = nameMatch || orgMatch || projMatch || trackMatch;
    const matchesStatus = statusFilter === 'all' || (t.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Team Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor registered hackathon teams, assigned projects, and submission tracks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTeams}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#e8622a]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team, college, project title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#e8622a]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:border-[#e8622a]"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
          </select>

          <span className="text-xs text-slate-400 whitespace-nowrap">
            Total Teams: <strong className="text-slate-800">{filteredTeams.length}</strong>
          </span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => {
          const isApproved = team.status === 'approved';
          return (
            <div
              key={team.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-orange-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center font-bold text-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {team.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {team.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span className="capitalize">{team.status || 'Active'}</span>
                  </span>
                </div>

                {/* College / Organization */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{team.college_org || 'Independent / Open Entry'}</span>
                </div>

                {/* Project Title & Track */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Project
                  </div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                    {team.project_title || 'TBD - Project in formulation'}
                  </div>
                  {team.track && (
                    <div className="pt-1">
                      <span className="inline-block text-[10px] font-semibold text-[#e8622a] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                        Track: {team.track}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action / Repo Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {team.github_repo_link ? (
                  <a
                    href={team.github_repo_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#e8622a] hover:underline font-semibold"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>View Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px]">No repository attached</span>
                )}
                <span className="text-[11px] font-medium text-slate-400">BIC 2026</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
