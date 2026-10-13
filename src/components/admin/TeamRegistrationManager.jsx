import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Users, Shield, Check, X, Clock, Code2, Building2, ExternalLink } from 'lucide-react';
import { downloadJsonFile } from '../../services/jsonExportService';

export default function TeamRegistrationManager() {
  const { teams, registrations, updateRegistrationStatus, showToast } = useHackathon();

  const handleExportRegistrations = () => {
    downloadJsonFile('registrations_evaluation_data.json', registrations);
    showToast('Exported registrations.json successfully!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Private Workflow Models: Registration & Team (teams.py)</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Team Applications & Roster Approvals
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evaluate applications, verify eligibility, and update statuses to Approved, Rejected, or Waitlisted.
          </p>
        </div>

        <button
          onClick={handleExportRegistrations}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Export Registrations (JSON)
        </button>
      </div>

      {/* Registrations List */}
      <div className="glass-card rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Enrolled Teams & Review Pipeline</h3>
          <span className="text-xs font-mono text-slate-400">{teams.length} Applications Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4">College / Org</th>
                <th className="py-3 px-4">Proposed Project</th>
                <th className="py-3 px-4">Track</th>
                <th className="py-3 px-4">Code Repo</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {teams.map((team) => {
                const reg = registrations.find(r => r.team_id === team.id) || { status: team.status };
                const isApproved = reg.status === 'approved';
                const isRejected = reg.status === 'rejected';

                return (
                  <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{team.name}</div>
                      <span className="font-mono text-[10px] text-slate-500">{team.id}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{team.college_org || 'Independent'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {team.project_title || 'Untitled Prototype'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        {team.track || 'General AI'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {team.github_repo_link ? (
                        <a
                          href={team.github_repo_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>Audit Repo</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">Not submitted</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isRejected
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {reg.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isApproved && (
                          <button
                            onClick={() => updateRegistrationStatus(team.id, 'approved')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
                            title="Approve Team"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            onClick={() => updateRegistrationStatus(team.id, 'rejected')}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors"
                            title="Reject Team"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
