import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  Users,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import { getTimeRemaining } from '../../utils/registration';
import HackathonBrand from '../common/HackathonBrand';
import CustomerNavbar from './CustomerNavbar';
import Footer from '../common/Footer';
import UserAuthModal from './UserAuthModal';
import { EVENT_YEAR } from '../../config/event';

export default function RegistrationCountdownPage() {
  const navigate = useNavigate();
  const { hackathon, currentUser, isRegistrationOpen, registrationStatus } = useHackathon();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const targetDate = registrationStatus?.startDate;

  // Real-time countdown timer state
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate));

  useEffect(() => {
    if (!targetDate) return;

    // Immediately calculate
    setTimeLeft(getTimeRemaining(targetDate));

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(targetDate);
      setTimeLeft(remaining);
      if (remaining.isPast) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const minTeamSize = hackathon?.minimum_team_size || 1;
  const maxTeamSize = hackathon?.maximum_team_size || 4;

  const formatDate = (dateObj) => {
    if (!dateObj) return '—';
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isClosed = registrationStatus?.reason === 'closed';
  const isDatesNotSet = registrationStatus?.reason === 'dates_not_set';
  const isNotStarted = registrationStatus?.reason === 'not_started';

  const daysCount = timeLeft.days;
  const hoursCount = String(timeLeft.hours).padStart(2, '0');
  const minutesCount = String(timeLeft.minutes).padStart(2, '0');
  const secondsCount = String(timeLeft.seconds).padStart(2, '0');

  return (
    <div className="theme-brand min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <CustomerNavbar
        onOpenRegister={() => {
          if (isRegistrationOpen) navigate('/register');
        }}
        onOpenLogin={() => setIsAuthOpen(true)}
        onOpenProfile={() => navigate('/profile')}
      />

      <main className="flex-grow py-8 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Navigation link back */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hackathon Home</span>
            </Link>
          </div>

          {/* Hero Countdown / Status Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
            {/* Top Accent Gradient Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-brand-orange via-amber-500 to-brand-yellow" />

            <div className="p-6 sm:p-12 text-center">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-6">
                {isNotStarted ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Registration Starting Soon</span>
                  </>
                ) : isClosed ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Registration Period Concluded</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Schedule Pending</span>
                  </>
                )}
              </div>

              {/* Title & Subtitle */}
              {isNotStarted ? (
                <>
                  <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto">
                    Registration Starting in{' '}
                    <span className="text-[#ea580c]">
                      {daysCount} {daysCount === 1 ? 'Day' : 'Days'} Left
                    </span>
                  </h1>
                  <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                    Team registration for <strong className="text-slate-800">{hackathon?.title || 'BIC Hackathon'}</strong>{' '}
                    officially begins on <strong className="text-slate-800">{formatDate(targetDate)}</strong>. Assemble your squad and prepare your submission details.
                  </p>

                  {/* Countdown Numbers Grid */}
                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
                    {/* Days */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-sm flex flex-col items-center justify-center border border-slate-800">
                      <span className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-white">
                        {daysCount}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                        Days Left
                      </span>
                    </div>

                    {/* Hours */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                      <span className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-slate-900">
                        {hoursCount}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                        Hours
                      </span>
                    </div>

                    {/* Minutes */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                      <span className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-slate-900">
                        {minutesCount}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                        Minutes
                      </span>
                    </div>

                    {/* Seconds */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                      <span className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-[#ea580c]">
                        {secondsCount}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                        Seconds
                      </span>
                    </div>
                  </div>
                </>
              ) : isClosed ? (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Registration Has Closed
                  </h1>
                  <p className="mt-3 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                    Squad registration for {hackathon?.title || 'this hackathon edition'} reached its deadline on{' '}
                    <strong className="text-slate-700">{formatDate(registrationStatus?.endDate)}</strong>. Teams that have submitted can track their status in their profile.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Registration Dates Coming Soon
                  </h1>
                  <p className="mt-3 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                    The registration schedule for {hackathon?.title || 'the upcoming hackathon'} has not been finalized yet. Please check back soon or follow event announcements.
                  </p>
                </>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/"
                  className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm inline-flex items-center gap-2"
                >
                  <span>Explore Hackathon Home</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="/#tracks"
                  className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>View Challenges & Tracks</span>
                </a>
              </div>
            </div>

            {/* Timeline Bar Section */}
            <div className="bg-slate-50/80 border-t border-slate-200 p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Registration Opens */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Phase 1: Registration Window
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">Registration Opens</h4>
                  <p className="text-xs font-mono text-slate-600 mt-1">
                    {formatDate(registrationStatus?.startDate)}
                  </p>
                </div>

                {/* 2. Registration Closes */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Phase 2: Enrollment Deadline
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">Registration Closes</h4>
                  <p className="text-xs font-mono text-slate-600 mt-1">
                    {formatDate(registrationStatus?.endDate)}
                  </p>
                </div>

                {/* 3. Hackathon Main Event */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Phase 3: The 48-Hour Sprint
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">Main Hackathon Event</h4>
                  <p className="text-xs font-mono text-slate-600 mt-1">
                    {formatDate(hackathon?.start_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preparation Checklist Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <Users className="w-5 h-5 text-[#ea580c]" />
              <h3 className="text-lg font-bold text-slate-900">How to Prepare Your Squad</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              When registration opens, squad enrollment will require the following information. Prepare in advance to secure your spot swiftly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 mb-2.5">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-800">Squad Formation</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Teams must consist of {minTeamSize} to {maxTeamSize} registered student members. Decide on your squad lead and team name.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 mb-2.5">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-800">Academic Details</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Have your affiliated university or college name, address, and faculty contact information ready.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 mb-2.5">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-800">Coordinator Contact</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  A valid phone number and email address for prompt administrative notifications and status approvals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <UserAuthModal
        isOpen={isAuthOpen}
        reason="login"
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          setIsAuthOpen(false);
          navigate('/register');
        }}
      />
    </div>
  );
}
