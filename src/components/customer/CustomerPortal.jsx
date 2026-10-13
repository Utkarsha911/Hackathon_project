import React, { useState } from 'react';
import CustomerNavbar from './CustomerNavbar';
import HeroSection from './HeroSection';
import ChallengesSection from './ChallengesSection';
import PrizesSection from './PrizesSection';
import ScheduleSection from './ScheduleSection';
import SponsorsSection from './SponsorsSection';
import TeamsShowcaseSection from './TeamsShowcaseSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import RegistrationModal from './RegistrationModal';
import Footer from '../common/Footer';
import Toast from '../common/Toast';
import { useHackathon } from '../../context/HackathonContext';
import { FileText, Shield } from 'lucide-react';

export default function CustomerPortal() {
  const { terms } = useHackathon();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11] text-slate-100">
      {/* Customer Navbar */}
      <CustomerNavbar onOpenRegister={() => setIsRegisterOpen(true)} />

      {/* Main Content Sections */}
      <main className="flex-grow">
        <HeroSection onOpenRegister={() => setIsRegisterOpen(true)} />
        <ChallengesSection />
        <PrizesSection />
        <ScheduleSection />
        <TeamsShowcaseSection />
        <SponsorsSection />
        <FaqSection />
        <ContactSection />

        {/* Discrete Terms trigger */}
        <div className="py-6 border-t border-slate-800/60 bg-[#06080e] text-center">
          <button
            onClick={() => setShowTermsModal(true)}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Official Participation Terms & Code of Conduct (TermsAndConditions)</span>
          </button>
        </div>
      </main>

      {/* Public Footer */}
      <Footer />

      {/* Squad Enrollment Modal */}
      <RegistrationModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
      />

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl bg-[#0e131f] border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Official Terms & Code of Conduct</span>
            </h3>
            <div className="text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto space-y-3 pr-2">
              <p>{terms[0]?.content}</p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                Model: TermsAndConditions (crm.py)
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      <Toast />
    </div>
  );
}
