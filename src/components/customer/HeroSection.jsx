import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import { ArrowRight, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { EVENT_VERSION, EVENT_YEAR } from '../../config/event';
import Button from '../common/Button';

export default function HeroSection({ onOpenRegister }) {
  const { hackathon, isLoadingApi, isRegistrationOpen, registrationStatus } = useHackathon();

  // Month/day come from the API; the year is the event year (the stored dates still carry 2024).
  const formatDateRange = () => {
    const s = new Date(hackathon?.start_date);
    const e = new Date(hackathon?.end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Dates coming soon';
    const sMonth = s.toLocaleString('default', { month: 'short' });
    const eMonth = e.toLocaleString('default', { month: 'short' });
    if (sMonth === eMonth) return `${sMonth} ${s.getDate()} – ${e.getDate()}, ${EVENT_YEAR}`;
    return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${EVENT_YEAR}`;
  };

  // Modern Skeleton state while fetching API
  if (isLoadingApi && !hackathon) {
    return (
      <section className="relative pt-24 pb-28 bg-brand-dark overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-7 w-64 bg-white/10 rounded-full mb-8" />
          <div className="h-14 w-3/4 max-w-2xl bg-white/10 rounded-2xl mb-4" />
          <div className="h-6 w-1/2 bg-white/10 rounded-lg mb-6" />
          <div className="h-20 w-full max-w-xl bg-white/10 rounded-xl mb-8" />
          <div className="flex gap-4">
            <div className="h-12 w-44 bg-white/10 rounded-xl" />
            <div className="h-12 w-44 bg-white/10 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  const h = hackathon || {};
  const year = EVENT_YEAR;
  const minTeam = h.minimum_team_size || 1;
  const maxTeam = h.maximum_team_size || h.max_team_size || 4;
  const bg = h.banner_image ? getMediaUrl(h.banner_image) : null;

  const facts = [
    { icon: Calendar, label: 'Date', value: formatDateRange(), sub: h.event_time },
    ...(h.venue ? [{ icon: MapPin, label: 'Venue', value: h.venue }] : []),
    { icon: Users, label: 'Teams', value: `${minTeam}–${maxTeam} members each` },
  ];

  return (
    <section id="top" className="relative bg-brand-dark text-white overflow-hidden">
      {bg && (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
          {h.version || EVENT_VERSION}
        </p>

        <h1 className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-3xl leading-[1.05]">
          {h.title || 'BIC Hackathon'}{' '}
          <span className="bg-gradient-to-r from-brand-orange to-brand-yellow bg-clip-text text-transparent">{year}</span>
        </h1>


        <div className="mt-10 flex flex-col sm:flex-row sm:items-stretch gap-6 sm:gap-0 max-w-3xl">
          {facts.map((f, idx) => (
            <div key={f.label} className={`flex items-start gap-3 sm:pr-6 ${idx > 0 ? 'sm:pl-6 sm:border-l sm:border-white/20' : ''}`}>
              <f.icon className="w-6 h-6 text-slate-200 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="text-xs text-slate-400">{f.label}</div>
                <div className="font-semibold text-white leading-snug">{f.value}</div>
                {f.sub && <div className="text-slate-300 text-xs">{f.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          {isRegistrationOpen ? (
            <Button onClick={onOpenRegister}>
              <span>Register Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : registrationStatus?.reason === 'not_started' ? (
            <Button
              onClick={onOpenRegister}
              className="!bg-brand-orange/20 !text-brand-yellow !border !border-brand-orange/40 hover:!bg-brand-orange/30 !shadow-xs"
            >
              <Clock className="w-4 h-4 text-brand-yellow" />
              <span>
                Registration Starting in {registrationStatus.daysUntilStart || 1}{' '}
                {(registrationStatus.daysUntilStart || 1) === 1 ? 'Day' : 'Days Left'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : null}
          <Button variant="outline" href="#about">Learn More</Button>
        </div>
      </div>
    </section>
  );
}
