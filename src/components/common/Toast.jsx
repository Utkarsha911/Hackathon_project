import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useHackathon();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl ${
        isSuccess
          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
          : isInfo
          ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
          : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
      }`}>
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : isInfo ? (
          <Info className="w-5 h-5 text-cyan-400 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        )}
        <div className="text-sm font-medium pr-2">
          {toast.message}
        </div>
      </div>
    </div>
  );
}
