import React from 'react';
import { Banknote, Calendar, Clock, Lightbulb, MapPin, Rocket, Users } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import { formatRegistrationFeeType } from '../../utils/registration';

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

export default function AboutSection() {
  const { hackathon } = useHackathon();
  const h = hackathon || {};
  if (!h.title) return null;

  const minTeamSize = h.minimum_team_size || 1;
  const maxTeamSize = h.maximum_team_size || 4;
  const registrationFee = Number(h.registration_fee) || 0;
  const eventDetails = [
    {
      icon: Calendar,
      label: 'Event date',
      value: formatEventDates(h.start_date, h.end_date),
      detail: h.event_time || 'Event schedule coming soon'
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
      detail: registrationFee > 0 ? formatRegistrationFeeType(h.registration_fee_type) : 'Open to eligible teams'
    }
  ];

  return (
    <Section id="about" py="py-16 sm:py-20">
      <SectionHeading label="About the event" title={`What is ${h.title}?`}>
        {h.description || 'Technology is most powerful when it brings people together to solve real problems.'}
      </SectionHeading>

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
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                {detail.label}
              </span>
            </div>
            <p className="mt-4 text-sm font-bold leading-snug text-slate-900">{detail.value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 rounded-2xl bg-slate-50 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">The experience</p>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="flex items-start gap-3">
                <pillar.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-bold text-ink">{pillar.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{pillar.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden items-center gap-2 text-slate-400 lg:flex" aria-hidden="true">
          <Clock className="h-5 w-5" />
          <span className="text-xs font-semibold">{h.event_time || 'Build together'}</span>
        </div>
      </div>
    </Section>
  );
}
