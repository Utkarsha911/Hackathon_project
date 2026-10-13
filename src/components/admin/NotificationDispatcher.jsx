import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Bell, Shield, Send, Users, UserCheck } from 'lucide-react';
import { downloadJsonFile } from '../../services/jsonExportService';

export default function NotificationDispatcher() {
  const { notifications, sendBroadcastNotification, showToast } = useHackathon();
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('all_participants');

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendBroadcastNotification(message.trim(), recipient);
    setMessage('');
  };

  const handleExportNotifs = () => {
    downloadJsonFile('notifications_broadcast_log.json', notifications);
    showToast('Exported notifications.json successfully!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Private Model: Notification (notifications.py)</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Broadcast Notification Dispatcher
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dispatch instant SMS, push, and audio announcements to hackathon squads, leads, or judges.
          </p>
        </div>

        <button
          onClick={handleExportNotifs}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Export Notifications (JSON)
        </button>
      </div>

      {/* Dispatch Composer */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-cyan-400" />
          <span>Compose Real-Time Alert</span>
        </h3>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Target Audience Channel
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'all_participants', label: 'All Participants (300+ Hackers)' },
                { id: 'team_leads', label: 'Team Captains Only' },
                { id: 'organizers', label: 'Organizer Core Committee' }
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setRecipient(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    recipient === c.id
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-glow-cyan'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Broadcast Message Content
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Midnight coffee station is refreshed at Hall A; mentor round 2 begins in 15 minutes."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500 outline-none text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:shadow-glow-cyan transition-all flex items-center gap-2 ml-auto"
          >
            <Send className="w-4 h-4" />
            <span>Transmit Notification</span>
          </button>
        </form>
      </div>

      {/* Dispatch History */}
      <div className="glass-card rounded-2xl border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Broadcast Dispatch History</h3>
          <span className="text-xs font-mono text-slate-400">{notifications.length} Sent</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-900 border border-slate-800 text-cyan-400">
                    To: {n.recipients?.replace('_', ' ') || 'General'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-200">
                  {n.message}
                </p>
                <div className="mt-1 font-mono text-[10px] text-slate-500">
                  ID: {n.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
