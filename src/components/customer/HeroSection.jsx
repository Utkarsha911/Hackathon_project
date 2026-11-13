import React, { useEffect, useMemo, useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import { ArrowRight, Calendar, MapPin, Users, Clock, Award } from 'lucide-react';
import { EVENT_VERSION, EVENT_YEAR } from '../../config/event';
import { getTimeRemaining, parseDateBoundary } from '../../utils/registration';
import Button from '../common/Button';

function CountdownUnit({ value, label, accent = false }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3 text-center backdrop-blur-sm sm:px-4 sm:py-4">
      <div className={`font-mono text-2xl font-bold tracking-tight sm:text-4xl ${accent ? 'text-brand-yellow' : 'text-white'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
        {label}
      </div>
    </div>
  );
}

function HeroCountdown({ registrationStatus, hackathon }) {
  const registrationStart = registrationStatus?.startDate;
  const hackathonStart = useMemo(
    () => parseDateBoundary(hackathon?.start_date),
    [hackathon?.start_date]
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const registrationHasOpened =
    registrationStart && now >= registrationStart.getTime();
  const eventHasStarted =
    hackathonStart && now >= hackathonStart.getTime();
  const targetDate = !registrationHasOpened ? registrationStart : hackathonStart;
  const timeLeft = getTimeRemaining(targetDate);
  const isLive = Boolean(registrationHasOpened && eventHasStarted);

  if (!targetDate && !isLive) return null;

  if (isLive) {
    return (
      <div className="mt-8 max-w-xl rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-3 text-sm font-semibold text-brand-yellow backdrop-blur-sm">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-yellow align-middle" />
        The hackathon is live. Let&apos;s build what matters.
      </div>
    );
  }

  const phaseLabel = !registrationHasOpened
    ? 'Registration opens in'
    : 'Hackathon begins in';

  return (
    <div className="mt-8 max-w-xl">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        <Clock className="h-3.5 w-3.5 text-brand-yellow" />
        <span>{phaseLabel}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <CountdownUnit value={timeLeft.days} label="Days" />
        <CountdownUnit value={timeLeft.hours} label="Hours" />
        <CountdownUnit value={timeLeft.minutes} label="Minutes" />
        <CountdownUnit value={timeLeft.seconds} label="Seconds" accent />
      </div>
    </div>
  );
}

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
    <section id="top" className="relative min-h-screen min-h-[100dvh] flex flex-col justify-center bg-brand-dark text-white overflow-hidden">
      {bg && (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-transparent" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(247,189,11,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(247,189,11,0.12) 1px, transparent 1px)',
          backgroundSize: '56px 56px'
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 backdrop-blur-sm">
          <Award className="h-3.5 w-3.5 text-brand-yellow" />
          <span>{h.version || EVENT_VERSION}</span>
        </div>

        <h1 className="mt-3 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-3xl leading-[1.08] break-words">
          {h.title || 'BIC Hackathon'}{' '}
          <span className="bg-gradient-to-r from-brand-orange to-brand-yellow bg-clip-text text-transparent">{year}</span>
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Build bold ideas, solve meaningful problems, and bring your team to the region&apos;s most ambitious innovation arena.
        </p>

        <HeroCountdown registrationStatus={registrationStatus} hackathon={h} />

        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-0 max-w-3xl">
          {facts.map((f, idx) => (
            <div key={f.label} className={`flex items-start gap-3 sm:pr-6 ${idx > 0 ? 'sm:pl-6 sm:border-l sm:border-white/20' : ''}`}>
              <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="text-xs text-slate-400">{f.label}</div>
                <div className="font-semibold text-white leading-snug">{f.value}</div>
                {f.sub && <div className="text-slate-300 text-xs">{f.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-9 flex flex-wrap items-center gap-3">
          {isRegistrationOpen ? (
            <Button onClick={onOpenRegister} className="w-full sm:w-auto justify-center">
              <span>Register Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : registrationStatus?.reason === 'not_started' ? (
            <Button
              onClick={onOpenRegister}
              className="w-full sm:w-auto justify-center !bg-brand-orange/20 !text-brand-yellow !border !border-brand-orange/40 hover:!bg-brand-orange/30 !shadow-xs"
            >
              <Clock className="w-4 h-4 text-brand-yellow" />
              <span>
                Registration Starting in {registrationStatus.daysUntilStart || 1}{' '}
                {(registrationStatus.daysUntilStart || 1) === 1 ? 'Day' : 'Days Left'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : null}
          <Button variant="outline" href="#about" className="w-full sm:w-auto justify-center">Learn More</Button>
        </div>
      </div>
    </section>
  );
}
