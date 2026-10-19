import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import HeroSection from './HeroSection';
import ChallengesSection from './ChallengesSection';
import PrizesSection from './PrizesSection';
import ScheduleSection from './ScheduleSection';
import RulesSection from './RulesSection';
import SponsorsSection from './SponsorsSection';
import OrganizersSection from './OrganizersSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import RegistrationModal from './RegistrationModal';
import CustomerProfileModal from './CustomerProfileModal';
import UserAuthModal from './UserAuthModal';
import Footer from '../common/Footer';
import Toast from '../common/Toast';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { FileText, Shield, X } from 'lucide-react';

export default function CustomerPortal() {
  const navigate = useNavigate();
  const { terms, currentUser } = useHackathon();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('login'); // 'login' | 'register'
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Disable background scrolling when terms modal is opened
  useBodyScrollLock(showTermsModal);

  // When clicking register team or register squad, first require Google login if not already logged in
  const handleOpenRegister = () => {
    if (!currentUser) {
      setAuthReason('register');
      setIsAuthOpen(true);
    } else {
      setIsRegisterOpen(true);
    }
  };

  const handleOpenLogin = () => {
    setAuthReason('login');
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900">

      {/* Navbar */}
      <CustomerNavbar
        onOpenRegister={handleOpenRegister}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={() => navigate('/profile')}
      />

      {/* Page Sections */}
      <main className="flex-grow">
        <HeroSection onOpenRegister={handleOpenRegister} />
        <ChallengesSection />
        <PrizesSection />
        <ScheduleSection />
        <RulesSection />
        <SponsorsSection />
        <OrganizersSection />
        <FaqSection />
        <ContactSection />

        {/* Terms trigger bar */}
        <div className="py-5 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={() => setShowTermsModal(true)}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-coral-600 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Official Participation Terms & Code of Conduct</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* Customer User Profile & Registered Teams Modal */}
      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenRegister={() => {
          setIsProfileOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      {/* User Auth (Google Login/Register) Modal */}
      <UserAuthModal
        isOpen={isAuthOpen}
        reason={authReason}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          setIsAuthOpen(false);
          if (authReason === 'register') {
            setTimeout(() => {
              setIsRegisterOpen(true);
            }, 300);
          } else {
            navigate('/profile');
          }
        }}
        onOpenRegister={() => {
          setIsAuthOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-2xl relative bg-white border border-slate-200">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-coral-600" />
              <span>Official Terms & Code of Conduct</span>
            </h3>

            <div className="text-xs text-slate-600 leading-relaxed max-h-72 overflow-y-auto space-y-3 pr-2">
              <p>{terms[0]?.content}</p>
              <div className="mt-4 pt-4 text-[11px] font-mono text-slate-400 border-t border-slate-200">
                Model: TermsAndConditions (crm.py)
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="btn-secondary text-xs py-2"
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
}
