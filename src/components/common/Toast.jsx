import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useHackathon();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';

  const style = isSuccess
    ? { backgroundColor: 'rgba(14,32,64,0.95)', borderColor: '#e8622a', color: '#fdddd4' }
    : isInfo
    ? { backgroundColor: 'rgba(14,32,64,0.95)', borderColor: '#4a6bbf', color: '#d5e2f8' }
    : { backgroundColor: 'rgba(14,32,64,0.95)', borderColor: '#b84a1a', color: '#fdddd4' };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur"
        style={style}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#f07040' }} />
        ) : isInfo ? (
          <Info className="w-5 h-5 shrink-0" style={{ color: '#6b8cd4' }} />
        ) : (
          <AlertCircle className="w-5 h-5 shrink-0" style={{ color: '#f58a5e' }} />
        )}
        <div className="text-sm font-medium">{toast.message}</div>
      </div>
    </div>
  );
}
