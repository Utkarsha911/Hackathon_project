import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ChallengesSection from './ChallengesSection';
import HighlightsSection from './HighlightsSection';
import OrganizersSection from './OrganizersSection';
import ScheduleSection from './ScheduleSection';
import RulesSection from './RulesSection';
import SponsorsSection from './SponsorsSection';
import FaqSection from './FaqSection';
import ContactSection from './ContactSection';
import CustomerProfileModal from './CustomerProfileModal';
import UserAuthModal from './UserAuthModal';
import Footer from '../common/Footer';
import Toast from '../common/Toast';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { FileText, Shield, X } from 'lucide-react';

export default function CustomerPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { terms, isRegistrationOpen } = useHackathon();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('login'); // 'login' | 'register'
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Smooth animated scrolling for all section navigation links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href*="#"]');
      if (!anchor) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref === '#') return;

      const hashIndex = rawHref.indexOf('#');
      if (hashIndex === -1) return;
      const hash = rawHref.substring(hashIndex);
      const path = rawHref.substring(0, hashIndex);

      if (path && path !== '/' && path !== window.location.pathname) return;

      const targetEl = document.querySelector(hash);
      if (targetEl) {
        e.preventDefault();
        const navHeight = 72; // Account for the sticky navbar height
        const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
        const targetScrollTop = elementPosition - navHeight;

        window.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });

        // Sync URL hash without triggering default jump
        window.history.pushState(null, '', hash);
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  // Handle direct hash navigation on initial page load and router transitions
  useEffect(() => {
    const hash = location.hash || window.location.hash;
    if (hash) {
      const scrollToHash = () => {
        const targetEl = document.querySelector(hash);
        if (targetEl) {
          const navHeight = 72;
          const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - navHeight,
            behavior: 'smooth'
          });
        }
      };

      scrollToHash();
      const t1 = setTimeout(scrollToHash, 150);
      const t2 = setTimeout(scrollToHash, 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [location.hash]);

  // Disable background scrolling when terms modal is opened
  useBodyScrollLock(showTermsModal);

  // Registering is a full page (it asks for the Google login itself)
  const handleOpenRegister = () => {
    if (isRegistrationOpen) {
      navigate('/register');
    }
  };

  const handleOpenLogin = () => {
    setAuthReason('login');
    setIsAuthOpen(true);
  };

  return (
    <div className="theme-brand min-h-screen flex flex-col bg-white text-slate-900">

      {/* Navbar */}
      <CustomerNavbar
        onOpenRegister={handleOpenRegister}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={() => navigate('/profile')}
      />

      {/* Page Sections */}
      <main className="flex-grow">
        <HeroSection onOpenRegister={handleOpenRegister} />
        <AboutSection />
        <ChallengesSection />
        <ScheduleSection />
        <HighlightsSection />
        <OrganizersSection />
        <RulesSection />
        <SponsorsSection />
        <FaqSection />
        <ContactSection />

        {/* Terms trigger bar */}
        <div className="py-5 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={() => setShowTermsModal(true)}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-brand-blue transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Participation terms & code of conduct</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Customer User Profile & Registered Teams Modal */}
      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenRegister={() => {
          setIsProfileOpen(false);
          if (isRegistrationOpen) {
            navigate('/register');
          }
        }}
      />

      {/* User Auth (Google Login/Register) Modal */}
      <UserAuthModal
        isOpen={isAuthOpen}
        reason={authReason}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          setIsAuthOpen(false);
          if (authReason === 'register' && isRegistrationOpen) {
            navigate('/register');
          } else {
            navigate('/profile');
          }
        }}
        onOpenRegister={() => {
          setIsAuthOpen(false);
          if (isRegistrationOpen) {
            navigate('/register');
          }
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
              <Shield className="w-4 h-4 text-brand-blue" />
              <span>{terms?.[0]?.title || 'Official Terms & Code of Conduct'}</span>
            </h3>

            <div className="text-xs text-slate-600 leading-relaxed max-h-72 overflow-y-auto space-y-3 pr-2">
              <p className="whitespace-pre-line">
                {terms?.[0]?.content ||
                  'By participating in this hackathon, all team members agree to uphold academic integrity, original work, and community safety. Unauthorized plagiarism, offensive material, or unfair practices will result in instant disqualification. Participants retain full ownership of intellectual property produced during the event. Organizers reserve the right to photograph, record, and report on hackathon presentations for promotional purposes.'}
              </p>
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
