import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { DollarSign, Shield, FileText, Check, Plus, AlertCircle, TrendingUp } from 'lucide-react';
import { downloadJsonFile, copyJsonToClipboard } from '../../services/jsonExportService';

export default function SponsorshipManager() {
  const { sponsorships, sponsors, recordSponsorshipPayment, showToast } = useHackathon();
  const [selectedSponsorshipId, setSelectedSponsorshipId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const totalPledged = sponsorships.reduce((acc, s) => acc + Number(s.pledged || 0), 0);
  const totalPaid = sponsorships.reduce((acc, s) => acc + Number(s.paid || 0), 0);
  const collectionRate = totalPledged > 0 ? Math.round((totalPaid / totalPledged) * 100) : 0;

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!selectedSponsorshipId || !paymentAmount || Number(paymentAmount) <= 0) return;
    recordSponsorshipPayment(selectedSponsorshipId, Number(paymentAmount));
    setSelectedSponsorshipId(null);
    setPaymentAmount('');
  };

  const handleExportThisModel = () => {
    downloadJsonFile('sponsorships_financial_ledger.json', sponsorships);
    showToast('Exported sponsorships.json successfully!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Private Financial Model: Sponsorship (sponsors.py)</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Corporate Sponsorships & Funds Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Confidential commercial contracts, pledged sums, received tranches, and negotiated benefits.
          </p>
        </div>

        <button
          onClick={handleExportThisModel}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Export Model as JSON</span>
        </button>
      </div>

      {/* Financial Health Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Pledged Capital</span>
          <div className="text-2xl font-extrabold text-white mt-1">NPR {totalPledged.toLocaleString()}</div>
          <span className="text-xs text-slate-500 mt-1 block">Contractual Commitments</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Received in Bank</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">NPR {totalPaid.toLocaleString()}</div>
          <span className="text-xs text-emerald-500/80 mt-1 block">{collectionRate}% of pledged settled</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Outstanding Collections</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">NPR {(totalPledged - totalPaid).toLocaleString()}</div>
          <span className="text-xs text-slate-500 mt-1 block">Post-event milestone tranches</span>
        </div>
      </div>

      {/* Sponsorship Ledgers Table */}
      <div className="glass-card rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Corporate Sponsorship Contracts</h3>
          <span className="text-xs font-mono text-slate-400">{sponsorships.length} Active Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sponsor Partner</th>
                <th className="py-3 px-4">Tier Type</th>
                <th className="py-3 px-4">Pledged Sum</th>
                <th className="py-3 px-4">Paid to Date</th>
                <th className="py-3 px-4">Deliverables & Benefits</th>
                <th className="py-3 px-4">Confidential Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sponsorships.map((sps) => {
                const sponsor = sponsors.find(s => s.id === sps.sponsor_id) || { name: 'Unknown Partner' };
                const isSettled = Number(sps.paid) >= Number(sps.pledged);

                return (
                  <tr key={sps.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{sponsor.name}</div>
                      <span className="font-mono text-[10px] text-slate-500">{sps.sponsor_id}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full font-bold uppercase text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {sps.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      NPR {Number(sps.pledged).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={isSettled ? 'text-emerald-400' : 'text-amber-400'}>
                        NPR {Number(sps.paid).toLocaleString()}
                      </span>
                      {isSettled && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                          Settled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400">
                      {sps.service || 'Standard benefits'}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-400 italic font-sans">
                      "{sps.notes || 'None'}"
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isSettled ? (
                        <button
                          onClick={() => setSelectedSponsorshipId(sps.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                        >
                          + Record Payment
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">Paid in full</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedSponsorshipId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border-slate-700">
            <h4 className="text-lg font-bold text-white mb-2">Record Installment Tranche</h4>
            <p className="text-xs text-slate-400 mb-4">
              Enter the amount received in the BIC hackathon bank account.
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Received Payment Amount (NPR)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSponsorshipId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Confirm & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
