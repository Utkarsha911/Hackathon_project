import React, { useState } from 'react';
import CustomerNavbar from './CustomerNavbar';
import HeroSection from './HeroSection';
import ChallengesSection from './ChallengesSection';
import PrizesSection from './PrizesSection';
import ScheduleSection from './ScheduleSection';
import RulesSection from './RulesSection';
import TeamsShowcaseSection from './TeamsShowcaseSection';
import SponsorsSection from './SponsorsSection';
import OrganizersSection from './OrganizersSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import RegistrationModal from './RegistrationModal';
import Footer from '../common/Footer';
import Toast from '../common/Toast';
import { useHackathon } from '../../context/HackathonContext';
import { FileText, Shield, X, RefreshCw } from 'lucide-react';

export default function CustomerPortal() {
  const { terms, isApiConnected, isLoadingApi, refreshData } = useHackathon();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900">

      {/* Navbar */}
      <CustomerNavbar onOpenRegister={() => setIsRegisterOpen(true)} />

      {/* API Live Status Bar (Shows only if backend API is not yet responding) */}
      {!isApiConnected && !isLoadingApi && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              Awaiting backend sync at <code className="text-amber-900 font-mono font-medium">http://127.0.0.1:8000/api/v1/hackathons/current/details</code>
            </span>
          </div>
          <button
            onClick={refreshData}
            className="px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-mono text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Fetch</span>
          </button>
        </div>
      )}

      {/* Page Sections */}
      <main className="flex-grow">
        <HeroSection onOpenRegister={() => setIsRegisterOpen(true)} />
        <ChallengesSection />
        <PrizesSection />
        <ScheduleSection />
        <RulesSection />
        <TeamsShowcaseSection />
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
