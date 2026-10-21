import React, { useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import { Calendar, MapPin, Trophy, ArrowRight, NepaliRupee } from 'lucide-react';
import HackathonBrand from '../common/HackathonBrand';

export default function HeroSection({ onOpenRegister }) {
  const { hackathon, prizes = [], schedules = [], scheduleEvents = [], isLoadingApi } = useHackathon();

  const hasScheduleData = useMemo(() => {
    return (
      (Array.isArray(schedules) && schedules.length > 0) ||
      (Array.isArray(scheduleEvents) && scheduleEvents.length > 0) ||
      (Array.isArray(hackathon?.schedules) && hackathon.schedules.length > 0)
    );
  }, [schedules, scheduleEvents, hackathon?.schedules]);

  const hasRulesData = useMemo(() => {
    const r = hackathon?.rules;
    if (!r) return false;
    if (typeof r === 'string') return r.trim().length > 0;
    if (Array.isArray(r)) return r.length > 0;
    if (typeof r === 'object') {
      return (
        (Array.isArray(r.eligibility) && r.eligibility.length > 0) ||
        (Array.isArray(r.submission_guidelines) && r.submission_guidelines.length > 0) ||
        (Array.isArray(r.code_of_conduct) && r.code_of_conduct.length > 0) ||
        (Array.isArray(r.evaluation_criteria) && r.evaluation_criteria.length > 0)
      );
    }
    return false;
  }, [hackathon?.rules]);

  const totalPrizePool =
    hackathon?.total_prize !== undefined && hackathon?.total_prize !== null
      ? Number(hackathon.total_prize) || 0
      : (prizes.length > 0
        ? prizes.reduce((acc, curr) => acc + (Number(curr.prize_money) || 0), 0)
        : 0);

  const formatDateRange = () => {
    if (!hackathon?.start_date || !hackathon?.end_date) {
      return hackathon?.year ? `Nov 14 – 16, ${hackathon.year.slice ? hackathon.year.slice(0, 4) : hackathon.year}` : 'Nov 14 – 16, 2026';
    }
    const s = new Date(hackathon.start_date);
    const e = new Date(hackathon.end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      return hackathon?.year || 'Upcoming';
    }
    const sMonth = s.toLocaleString('default', { month: 'short' });
    const eMonth = e.toLocaleString('default', { month: 'short' });
    if (sMonth === eMonth) {
      return `${sMonth} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${s.getFullYear()}`;
  };

  // Modern Skeleton state while fetching API
  if (isLoadingApi && !hackathon) {
    return (
      <section className="relative pt-24 pb-28 bg-[#f8fafc] overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-7 w-64 bg-slate-200 rounded-full mb-8" />
          <div className="h-14 w-3/4 max-w-2xl bg-slate-200 rounded-2xl mb-4" />
          <div className="h-6 w-1/2 bg-slate-200 rounded-lg mb-6" />
          <div className="h-20 w-full max-w-xl bg-slate-200/60 rounded-xl mb-8" />
          <div className="flex gap-4">
            <div className="h-12 w-44 bg-slate-200 rounded-xl" />
            <div className="h-12 w-44 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  const h = hackathon || {};

  return (
    <section className="relative pt-20 pb-24 bg-[#fafafa] border-b border-gray-200/80 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Live status badge - Solid indicator, NO BLINKING */}
        <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-coral-500" />
          <span>
            Registration:{' '}
            {(h.registration_end_date || h.registration_enddate)
              ? `Closes ${new Date(h.registration_end_date || h.registration_enddate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
              : `Closes Nov 05, ${h.year?.slice ? h.year.slice(0, 4) : 2026}`}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-coral-600 font-semibold">{h.event_time || '48 Hours Non-Stop Sprint'}</span>
          {h.version && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-coral-50 text-coral-700 border border-coral-200 font-bold">
                {h.version}
              </span>
            </>
          )}
        </div>

        {/* Official Hackathon Logo */}
        {Boolean(h?.logo || h?.logo_url) && (
          <div className="flex items-center gap-3 mb-5">
            <HackathonBrand
              imageClassName="h-11 sm:h-13 w-auto max-w-[240px] object-contain"
              showSubText={false}
            />
          </div>
        )}

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.06]">
          {h.title || 'BIC InnovateX'} <br />
          <span className="text-coral-600">
            {h.year ? (typeof h.year === 'string' && h.year.includes('-') ? h.year.split('-')[0] : h.year) : 2026}
          </span>
        </h1>

        {/* Sub-Heading */}
        {h.sub_heading && (
          <p className="mt-4 text-lg sm:text-xl font-medium text-slate-700 max-w-3xl leading-snug">
            {h.sub_heading}
          </p>
        )}

        {/* Theme Pill */}
        {h.theme && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-coral-50 border border-coral-200 text-xs font-mono text-coral-800">
            <span className="text-coral-600 font-bold uppercase">Theme:</span>
            <span>{h.theme}</span>
          </div>
        )}

        {h.description && (
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            {h.description}
          </p>
        )}

        {/* Official Event Banner */}
        {h.banner_image && (
          <div className="mt-8 relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md max-w-4xl bg-slate-900 group">
            <img
              src={getMediaUrl(h.banner_image)}
              alt={h.title || 'BIC Hackathon Banner'}
              className="w-full h-44 sm:h-64 md:h-72 object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4 sm:p-5">
              <span className="text-white text-xs sm:text-sm font-semibold tracking-wide drop-shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-coral-500" />
                {h.title} {h.version} • {h.venue || 'Boston International College'}
              </span>
            </div>
          </div>
        )}

        {/* Event Facts */}
        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-700">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-coral-600" />
            <span>{formatDateRange()}</span>
          </div>
          {h.venue && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{h.venue}</span>
            </div>
          )}
          {totalPrizePool > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-coral-600 shrink-0" />
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-700">
                <span>Prize Pool:</span>
                <span className="inline-flex items-center font-bold text-slate-900">
                  <NepaliRupee className="w-3.5 h-3.5 stroke-[2.5] -mr-0.5 inline-block shrink-0" />
                  {totalPrizePool.toLocaleString()}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <button
            onClick={onOpenRegister}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span>Register Your Squad</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          {hasScheduleData && (
            <a
              href="#schedule"
              className="btn-secondary justify-center text-center w-full sm:w-auto"
            >
              Event Schedule
            </a>
          )}
          {hasRulesData && (
            <a
              href="#rules"
              className="btn-secondary justify-center text-center w-full sm:w-auto"
            >
              Rules & Criteria
            </a>
          )}
        </div>

        {/* Stats Bar */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-8 sm:pt-10 border-t border-slate-200">
          <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {h.event_time ? (h.event_time.toLowerCase().includes('hour') ? h.event_time.replace(/[^0-9]/g, '') + 'h' : h.event_time) : '48h'}
            </div>
            <div className="text-xs text-slate-500 mt-1">{h.event_time || 'Continuous Sprint'}</div>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-coral-600 font-mono inline-flex items-center">
              {totalPrizePool > 0 ? (
                <>
                  <NepaliRupee className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5] -mr-0.5 inline-block shrink-0" />
                  {totalPrizePool >= 1000 ? (totalPrizePool / 1000).toFixed(0) + 'k' : totalPrizePool.toLocaleString()}
                </>
              ) : (
                'TBA'
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total Prize Pool</div>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {h.minimum_team_size || 1} – {h.maximum_team_size || h.max_team_size || 4}
            </div>
            <div className="text-xs text-slate-500 mt-1">Members per Squad</div>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">100%</div>
            <div className="text-xs text-slate-500 mt-1">Participant IP Retained</div>
          </div>
        </div>

      </div>
    </section>
  );
}
