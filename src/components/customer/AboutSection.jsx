import React from 'react';
import { ArrowRight, Banknote, Calendar, Lightbulb, MapPin, Rocket, Users } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import { formatRegistrationFeeType } from '../../utils/registration';
import Button from '../common/Button';

const PILLARS = [
  { icon: Users, title: 'Collaborate', text: 'Work in diverse teams' },
  { icon: Rocket, title: 'Build', text: 'Turn ideas into solutions' },
  { icon: Lightbulb, title: 'Make an impact', text: 'Create change for Nepal' },
];

function formatEventDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Dates coming soon';

  const startMonth = start.toLocaleString('default', { month: 'short' });
  const endMonth = end.toLocaleString('default', { month: 'short' });
  const year = start.getFullYear();
  return startMonth === endMonth
    ? `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`
    : `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
}

function formatDeadline(date) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AboutSection({ onOpenRegister }) {
  const { hackathon, isRegistrationOpen } = useHackathon();
  const h = hackathon || {};
  if (!h.title) return null;

  const minTeamSize = h.minimum_team_size || 1;
  const maxTeamSize = h.maximum_team_size || 4;
  const registrationFee = Number(h.registration_fee) || 0;
  const deadline = formatDeadline(h.registration_end_date || h.registration_enddate);
  const aboutImage = h.banner_image ? getMediaUrl(h.banner_image) : null;
  const fallbackDescription = `${h.title} brings student teams together for a focused build experience. Form a team, choose a meaningful problem, and turn your idea into a working solution with guidance from mentors and judges.`;
  const eventDetails = [
    {
      icon: Calendar,
      label: 'Event date',
      value: formatEventDates(h.start_date, h.end_date),
      detail: h.event_time || 'Event schedule coming soon',
      featured: true
    },
    {
      icon: MapPin,
      label: 'Venue',
      value: h.venue || 'Venue coming soon',
      detail: 'In-person event'
    },
    {
      icon: Users,
      label: 'Team size',
      value: `${minTeamSize}–${maxTeamSize} members`,
      detail: 'Members per team'
    },
    {
      icon: Banknote,
      label: 'Registration',
      value: registrationFee > 0 ? `NPR ${registrationFee.toLocaleString()}` : 'Free entry',
      detail: registrationFee > 0 ? formatRegistrationFeeType(h.registration_fee_type) : 'Open to eligible teams',
      featured: true
    }
  ];

  return (
    <Section id="about" py="py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <SectionHeading label="About the event" title={`What is ${h.title}?`}>
            {h.description || fallbackDescription}
          </SectionHeading>
        </div>
        <div className="relative min-h-[260px] overflow-hidden rounded-3xl bg-brand-dark shadow-xl">
          {aboutImage ? (
            <img
              src={aboutImage}
              alt={`${h.title} event`}
              className="absolute inset-0 h-full w-full object-cover opacity-65"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/95 via-brand-navy/75 to-brand-blue/50" />
          <div className="relative flex h-full min-h-[260px] flex-col justify-end p-7 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-yellow">
              {h.version || 'Hackathon edition'}
            </p>
            <p className="mt-3 max-w-xs text-2xl font-extrabold leading-tight">
              Build boldly. Solve something real.
            </p>
            <p className="mt-2 text-sm text-slate-200">
              A focused {h.event_time || 'hands-on'} experience for teams ready to make an impact.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {eventDetails.map((detail) => (
          <div
            key={detail.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand-orange">
                <detail.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                {detail.label}
              </span>
            </div>
            <p className={`mt-4 leading-snug text-slate-900 ${detail.featured ? 'text-xl font-extrabold' : 'text-base font-bold'}`}>
              {detail.value}
            </p>
            <p className="mt-1 text-xs text-slate-600">{detail.detail}</p>
            {detail.label === 'Registration' && registrationFee > 0 && maxTeamSize > 1 && (
              <p className="mt-2 text-xs font-medium text-slate-600">
                ≈ NPR {Math.round(registrationFee / maxTeamSize).toLocaleString()} per person for {maxTeamSize}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 rounded-3xl border border-orange-100 bg-orange-50/60 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">The experience</p>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-orange shadow-sm">
                  <pillar.icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-base font-extrabold text-ink">{pillar.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{pillar.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <Button
            onClick={onOpenRegister}
            disabled={!isRegistrationOpen}
            className={!isRegistrationOpen ? 'cursor-not-allowed opacity-60' : ''}
          >
            <span>{isRegistrationOpen ? 'Register your team' : 'Registration closed'}</span>
            {isRegistrationOpen && <ArrowRight className="h-4 w-4" />}
          </Button>
          {deadline && (
            <span className="text-xs font-semibold text-slate-700">
              Registration closes {deadline}
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
