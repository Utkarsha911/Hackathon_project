import React, { useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';

const DOT_COLORS = ['bg-brand-navy', 'bg-brand-tint0', 'bg-brand-orange', 'bg-brand-red', 'bg-brand-coral', 'bg-brand-gold'];

const fmtDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const fmtTime = (iso) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

export default function ScheduleSection() {
  const { schedules = [], isLoadingApi } = useHackathon();

  const steps = useMemo(
    () => [...schedules].sort((a, b) => new Date(a.start_time || 0) - new Date(b.start_time || 0)),
    [schedules]
  );

  if (steps.length === 0 && !isLoadingApi) return null;

  return (
    <Section id="schedule">
      <SectionHeading label="Event timeline" title="How it works" />

      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ '--n': Math.min(steps.length || 1, 5) }}>
        {steps.map((s, idx) => {
          const startD = s.start_time && fmtDate(s.start_time);
          const endD = s.end_time && fmtDate(s.end_time);
          const range = startD ? (endD && endD !== startD ? `${startD} – ${endD}` : `${startD}, ${fmtTime(s.start_time)}`) : null;
          return (
            <li key={s.id} className="relative">
              {idx < steps.length - 1 && (
                <span className="hidden lg:block absolute top-5 left-14 right-2 h-px bg-brand-blue/30" aria-hidden="true" />
              )}
              <span className={`relative z-10 flex w-10 h-10 rounded-full ${DOT_COLORS[idx % DOT_COLORS.length]} text-white font-bold items-center justify-center`}>
                {idx + 1}
              </span>
              <h3 className="mt-3 font-bold text-ink text-sm leading-snug">{s.title}</h3>
              {range && <p className="text-xs text-slate-500 mt-0.5">{range}</p>}
              {s.description && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{s.description}</p>}
              {s.remarks && <p className="text-xs text-amber-700 mt-2">Note: {s.remarks}</p>}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
