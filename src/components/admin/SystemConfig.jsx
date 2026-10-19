import React, { useState } from 'react';
import { Settings, Shield, Server, Database, Key, CheckCircle2, Copy, Check } from 'lucide-react';
import { getAuthToken } from '../../services/api';

export default function SystemConfig() {
  const token = getAuthToken() || 'No active Bearer token';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            System Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Core backend endpoints, security credentials, and API environment parameters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* API Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">API Gateway</h3>
              <p className="text-xs text-slate-400">REST backend connection</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Base API URL</label>
              <input
                type="text"
                readOnly
                value="http://127.0.0.1:8000"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">User Login Endpoint</label>
              <input
                type="text"
                readOnly
                value="/api/v1/users/login/"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Google Login & Register Endpoint</label>
              <input
                type="text"
                readOnly
                value="/api/v1/users/google/"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">User Register Endpoint</label>
              <input
                type="text"
                readOnly
                value="/api/v1/users/register/"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Groups List Endpoint</label>
              <input
                type="text"
                readOnly
                value="/api/v1/users/groups/list_groups/"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Update Group Permissions Endpoint</label>
              <input
                type="text"
                readOnly
                value="/api/v1/users/groups/{id}/update_group/"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Security / Bearer Token */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Active Authorization</h3>
              <p className="text-xs text-slate-400">Bearer token session</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Bearer Token</label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#e8622a] hover:underline"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={3}
                value={token}
                className="w-full mt-1 p-2.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-700 select-all break-all"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Token automatically attached to every outgoing HTTP request header.</span>
            </div>

            <div className="text-xs text-slate-500 space-y-1 pt-1">
              <div className="flex justify-between">
                <span>Header Format:</span>
                <code className="font-mono text-slate-700">Authorization: Bearer &lt;token&gt;</code>
              </div>
              <div className="flex justify-between">
                <span>Storage Key:</span>
                <code className="font-mono text-slate-700">bic_auth_token</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
