import React from 'react';
import { X, ArrowUpRight, LogOut, UserCheck } from 'lucide-react';
import GoogleAuthButton from '../common/GoogleAuthButton';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export default function UserAuthModal({ isOpen, onClose, onOpenRegister, onAuthSuccess, reason = 'login' }) {
  const { currentUser, logoutUser } = useHackathon();

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const role = (currentUser?.role || '').toLowerCase();
  const isStaffOrAdmin =
    currentUser?.is_staff ||
    currentUser?.is_superuser ||
    role.includes('admin') ||
    role.includes('staff') ||
    role.includes('organizer');

  const isForRegister = reason === 'register';

  const handleSuccess = (user, response) => {
    if (onAuthSuccess) {
      onAuthSuccess(user, response);
    } else {
      setTimeout(() => {
        onClose();
        if (isForRegister && onOpenRegister) {
          onOpenRegister();
        }
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl relative bg-white border border-slate-200/90 shadow-2xl overflow-hidden">
        {/* Subtle top accent bar */}
        <div className="h-1.5 w-full bg-brand-orange" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          {currentUser ? (
            /* Logged in state card */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-tint text-brand-blue border border-brand-blue/30 flex items-center justify-center text-xl font-bold mx-auto shadow-xs">
                {currentUser?.first_name?.[0] || currentUser?.email?.[0] || 'U'}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>Authenticated Session</span>
                </div>
                <h3 className="text-lg font-bold text-ink">
                  {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : currentUser.email}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email}</p>
                <div className="mt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Role: {currentUser.role || 'Participant'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenRegister) onOpenRegister();
                  }}
                  className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <span>Continue to Register Squad</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={logoutUser}
                  className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not logged in: Clean Google Sign-in dialog */
            <div className="space-y-4">
              <div className="text-center pt-1">
                <h3 className="text-xl font-extrabold text-ink tracking-tight">
                  Register Your Squad
                </h3>
              </div>

              {/* Black Note: Login Required */}
              <div className="w-full bg-black text-white px-4 py-2.5 rounded-xl text-xs font-semibold text-center shadow-sm">
                Note: Login Required for registering your team
              </div>

              {/* Google Sign In Button Only */}
              <div className="pt-1">
                <GoogleAuthButton
                  mode="normal"
                  text="Sign in with Google"
                  showDirectTokenInput={false}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
