import React, { useState } from 'react';
import { Users, Search, Mail, Building2, CheckCircle2, Phone, Calendar } from 'lucide-react';
import sampleUsers from '../../data/json/users.json';

export default function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const customers = (Array.isArray(sampleUsers) ? sampleUsers : []).filter(
    (u) => (u.role || '').toLowerCase() === 'user' || (u.role || '').toLowerCase() === 'participant' || !u.role
  );

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (c.full_name || `${c.first_name || ''} ${c.last_name || ''}`).toLowerCase().includes(term);
    const emailMatch = (c.email || '').toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Participant Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered event participants and platform attendees
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search participants by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#e8622a]"
          />
        </div>
        <span className="text-xs text-slate-400 text-right sm:text-left">
          Total Participants: <strong>{filtered.length}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Participant</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((cust, idx) => {
                const name = cust.full_name || `${cust.first_name || 'Participant'} ${cust.last_name || idx + 1}`;
                const initials = `${name[0] || 'C'}`.toUpperCase();
                return (
                  <tr key={cust.id || cust.email || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-[#e8622a] flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{name}</div>
                          <div className="text-xs text-slate-400">ID: {cust.id || `C-${idx + 1}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {cust.phone_number ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.phone_number}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Not provided</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                      {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : 'Active'}
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
