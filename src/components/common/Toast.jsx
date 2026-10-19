import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, closeToast } = useHackathon();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';
  const isError = toast.type === 'error' || (!isSuccess && !isInfo);

  const style = isSuccess
    ? { backgroundColor: 'rgba(15, 23, 42, 0.96)', borderColor: 'rgba(16, 185, 129, 0.5)', color: '#ecfdf5' }
    : isInfo
    ? { backgroundColor: 'rgba(15, 23, 42, 0.96)', borderColor: 'rgba(59, 130, 246, 0.5)', color: '#eff6ff' }
    : { backgroundColor: 'rgba(15, 23, 42, 0.96)', borderColor: 'rgba(239, 68, 68, 0.6)', color: '#fef2f2' };

  return (
    <div className="fixed top-6 right-4 sm:right-6 z-[9999] max-w-sm w-full sm:w-auto animate-fade-in pointer-events-auto">
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all"
        style={style}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        ) : isInfo ? (
          <Info className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
        )}
        <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed pr-1 break-words">
          {toast.message}
        </div>
        {closeToast && (
          <button
            type="button"
            onClick={closeToast}
            className="text-slate-400 hover:text-white transition-colors p-0.5 -mr-1 rounded-md"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
