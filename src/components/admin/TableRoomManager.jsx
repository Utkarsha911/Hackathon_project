import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { MapPin, Shield, Check, Edit2, LayoutGrid } from 'lucide-react';
import { downloadJsonFile } from '../../services/jsonExportService';

export default function TableRoomManager() {
  const { teams, tables, assignTable, showToast } = useHackathon();
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [roomInput, setRoomInput] = useState('');

  const handleSaveAllocation = (teamId) => {
    if (!roomInput.trim()) return;
    assignTable(teamId, roomInput.trim());
    setEditingTeamId(null);
    setRoomInput('');
  };

  const handleExportTables = () => {
    downloadJsonFile('table_allocations.json', tables);
    showToast('Exported tables.json successfully!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Private Model: Table (teams.py)</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Venue Workstation & Room Allocation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Assign hackathon teams to specific laboratory halls, physical desk numbers, and power strips.
          </p>
        </div>

        <button
          onClick={handleExportTables}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Export Table Allocations (JSON)
        </button>
      </div>

      {/* Hall overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white text-base">Hall A (Main Pavilion)</span>
            <span className="text-xs text-cyan-400 font-mono">High-Power Zone</span>
          </div>
          <p className="text-xs text-slate-400">
            Dedicated for AI & IoT teams requiring high-amperage hardware benches and direct fiber ethernet.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white text-base">Hall B (Innovation Gallery)</span>
            <span className="text-xs text-indigo-400 font-mono">Silent Sprint Zone</span>
          </div>
          <p className="text-xs text-slate-400">
            Acoustically insulated space for Web3, mobile, and algorithmic software teams.
          </p>
        </div>
      </div>

      {/* Table Allocations Roster */}
      <div className="glass-card rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Workstation Seating Map</h3>
          <span className="text-xs font-mono text-slate-400">{tables.length} Allocated Desks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Track</th>
                <th className="py-3 px-4">Allocated Table & Room</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Desk Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {teams.map((team) => {
                const tableRecord = tables.find(t => t.team_id === team.id);
                const isEditing = editingTeamId === team.id;

                return (
                  <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{team.name}</div>
                      <span className="font-mono text-[10px] text-slate-500">{team.id}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {team.college_org}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {team.track || 'General'}
                    </td>

                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Hall A - Desk 18"
                            value={roomInput}
                            onChange={(e) => setRoomInput(e.target.value)}
                            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white outline-none w-44"
                          />
                          <button
                            onClick={() => handleSaveAllocation(team.id)}
                            className="px-2 py-1 bg-emerald-600 rounded text-white text-[11px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-bold text-slate-200">
                            {tableRecord ? tableRecord.room_number : 'Unassigned'}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 border border-slate-800 text-cyan-400">
                        {tableRecord?.status || 'Vacant'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingTeamId(team.id);
                            setRoomInput(tableRecord ? tableRecord.room_number : '');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                        >
                          {tableRecord ? 'Reassign' : '+ Assign Table'}
                        </button>
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
