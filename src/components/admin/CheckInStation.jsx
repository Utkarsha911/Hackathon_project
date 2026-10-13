import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { UserCheck, Shield, Check, Clock, QrCode, Search } from 'lucide-react';
import { downloadJsonFile } from '../../services/jsonExportService';

export default function CheckInStation() {
  const { teams, checkIns, checkInTeam, showToast } = useHackathon();
  const [searchTerm, setSearchTerm] = useState('');

  const handleExportCheckIns = () => {
    downloadJsonFile('check_ins_desk_log.json', checkIns);
    showToast('Exported check_ins.json successfully!');
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.college_org && t.college_org.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Private Model: CheckIn (teams.py)</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            On-Site Venue Check-In Station
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Physical registration desk check-ins with tamper-proof timestamps and attendance tracking.
          </p>
        </div>

        <button
          onClick={handleExportCheckIns}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Export Check-Ins (JSON)
        </button>
      </div>

      {/* Desk Stats & Search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search squad name or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>Checked In: <strong className="text-emerald-400 font-bold">{checkIns.length}</strong></div>
          <div>Pending Entry: <strong className="text-amber-400 font-bold">{teams.length - checkIns.length}</strong></div>
        </div>
      </div>

      {/* Check-In Roster */}
      <div className="glass-card rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Desk Attendance Log</h3>
          <span className="text-xs font-mono text-slate-400">Gate 1 & Gate 2 Terminals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Desk Check-In Status</th>
                <th className="py-3 px-4">Checked-In Timestamp</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTeams.map((team) => {
                const checkInRecord = checkIns.find(c => c.team_id === team.id);
                const isCheckedIn = Boolean(checkInRecord);

                return (
                  <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{team.name}</div>
                      <span className="font-mono text-[10px] text-slate-500">{team.id}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {team.college_org}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 border border-slate-800 text-slate-300">
                        {team.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCheckedIn
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isCheckedIn ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{isCheckedIn ? 'Checked In' : 'Not Arrived'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {checkInRecord ? (
                        new Date(checkInRecord.checkin_time).toLocaleString()
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isCheckedIn ? (
                        <button
                          onClick={() => checkInTeam(team.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 ml-auto transition-colors shadow-glow-cyan"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Verify & Check In</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-semibold text-xs">
                          ✓ Verified at Desk
                        </span>
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
