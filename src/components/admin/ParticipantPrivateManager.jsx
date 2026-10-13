import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Shield, AlertTriangle, FileText, ExternalLink, HeartPulse, Utensils, Shirt } from 'lucide-react';
import { downloadJsonFile } from '../../services/jsonExportService';

export default function ParticipantPrivateManager() {
  const { participants, users, teams, showToast } = useHackathon();

  const handleExportParticipants = () => {
    downloadJsonFile('participants_confidential_records.json', participants);
    showToast('Exported confidential participants.json successfully!');
  };

  // Inventory stats
  const tshirtCounts = participants.reduce((acc, p) => {
    const size = p.tshirt_size || 'M';
    acc[size] = (acc[size] || 0) + 1;
    return acc;
  }, {});

  const dietCounts = participants.reduce((acc, p) => {
    const diet = p.food_preference || 'Standard';
    acc[diet] = (acc[diet] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Confidential Private Model: Participant (teams.py)</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Confidential Health, Dietary & Resume Records
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Restricted access for on-site medical staff, catering managers, and authorized talent recruiters.
          </p>
        </div>

        <button
          onClick={handleExportParticipants}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Export Confidential JSON
        </button>
      </div>

      {/* Logistics & Catering Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Catering breakdown */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span>48-Hour Meal Plan Allocations</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(dietCounts).map(([diet, count]) => (
              <div key={diet} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-xl font-black text-white">{count}</span>
                <span className="block text-[10px] text-slate-400 font-medium uppercase mt-0.5">{diet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* T-shirt breakdown */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            <Shirt className="w-4 h-4 text-indigo-400" />
            <span>Official Swag T-Shirt Sizes Required</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
              <div key={sz} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-xl font-black text-white">{tshirtCounts[sz] || 0}</span>
                <span className="block text-[10px] text-slate-400 font-medium uppercase mt-0.5">Size {sz}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Participants Table */}
      <div className="glass-card rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Participant Confidential Profiles</h3>
          <span className="text-xs font-mono text-slate-400">{participants.length} Active Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Participant Identity</th>
                <th className="py-3 px-4">Assigned Squad</th>
                <th className="py-3 px-4">Dietary Preference</th>
                <th className="py-3 px-4">T-Shirt</th>
                <th className="py-3 px-4">Medical Alerts & Medications</th>
                <th className="py-3 px-4">Candidate CV / Resume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {participants.map((p) => {
                const user = users.find(u => u.id === p.user_id) || { first_name: 'Registrant', email: 'N/A' };
                const team = teams.find(t => t.id === p.team_id) || { name: 'Individual' };

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{user.first_name} {user.last_name || ''}</div>
                      <span className="text-slate-400 font-normal text-[11px] block">{user.email}</span>
                      <span className="font-mono text-[10px] text-slate-500">{p.id}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {team.name}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
                        {p.food_preference || 'Standard'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                      {p.tshirt_size || 'M'}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {p.medications && p.medications !== 'None' ? (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-300 text-[11px]">
                          <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{p.medications}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">None declared</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.cv ? (
                        <a
                          href={p.cv}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors text-xs font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Review CV</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">Not uploaded</span>
                      )}
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
