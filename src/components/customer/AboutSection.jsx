import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import { getRegistrationStatus, parseDateBoundary } from '../../utils/registration';
import Button from '../common/Button';

function formatEventDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Dates coming soon';

  const startMonth = start.toLocaleString('default', { month: 'short' }).toUpperCase();
  const endMonth = end.toLocaleString('default', { month: 'short' }).toUpperCase();
  const year = start.getFullYear();
  return startMonth === endMonth
    ? `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`
    : `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
}

function formatDeadline(date) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatVenue(venue) {
  if (!venue) return 'Venue coming soon';
  return venue === 'Boston International College' ? 'Boston Intl. College' : venue;
}

export default function AboutSection({ onOpenRegister }) {
  const { hackathon, schedules = [], scheduleEvents = [] } = useHackathon();
  const h = hackathon || {};
  if (!h.title) return null;

  const minTeamSize = h.minimum_team_size || 1;
  const maxTeamSize = h.maximum_team_size || 4;
  const registrationFee = Number(h.registration_fee) || 0;
  const deadline = formatDeadline(h.registration_end_date || h.registration_enddate);
  const registrationStatus = getRegistrationStatus(h);
  const registrationStart = parseDateBoundary(
    h.registration_start_date || h.registration_startdate,
    false
  );
  const registrationEnd = parseDateBoundary(
    h.registration_end_date || h.registration_enddate,
    true
  );
  const now = new Date();
  const isRegistrationOpen = Boolean(
    registrationEnd &&
    now <= registrationEnd &&
    (!registrationStart || now >= registrationStart)
  );
  const aboutImage = h.banner_image ? getMediaUrl(h.banner_image) : null;
  const scheduleSource = Array.isArray(schedules) && schedules.length > 0 ? schedules : scheduleEvents;
  const schedulePreview = Array.isArray(scheduleSource) ? scheduleSource.slice(0, 3) : [];
  const eventFacts = [
    { label: 'Event date', value: formatEventDates(h.start_date, h.end_date) },
    { label: 'Duration', value: h.event_time || '—' },
    { label: 'Team size', value: `${minTeamSize}–${maxTeamSize} per team` },
    { label: 'Registration', value: registrationFee > 0 ? `NPR ${registrationFee.toLocaleString()}` : 'Free' }
  ];
  const photoCaption = [
    h.version,
    h.start_date ? new Date(h.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    formatVenue(h.venue)
  ].filter(Boolean).join(' · ');

  return (
    <Section id="about" py="py-16 sm:py-20">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <SectionHeading label="About the event" title={h.title}>
            {h.description}
          </SectionHeading>
        </div>
        {aboutImage && (
          <figure className="overflow-hidden rounded-3xl bg-slate-100 shadow-xl">
            <img
              src={aboutImage}
              alt={`${h.title} event`}
              className="block h-[260px] w-full object-cover sm:h-[320px]"
            />
            <figcaption className="border-t border-slate-200 bg-white px-5 py-3 text-xs font-medium text-slate-600">
              {photoCaption}
            </figcaption>
          </figure>
        )}
      </div>

      <div className="mt-10 grid grid-cols-2 border-y border-slate-200 sm:grid-cols-4">
        {eventFacts.map((fact, index) => (
          <div key={fact.label} className={`px-3 py-5 text-center sm:px-5 sm:py-6 ${index > 0 ? 'border-l border-slate-200' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">{fact.label}</p>
            <p className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{fact.value}</p>
          </div>
        ))}
      </div>

      {schedulePreview.length > 0 && (
        <div className="mt-10 border-t border-slate-200 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Event programme</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {schedulePreview.map((item) => (
              <div key={item.id || item.title} className="border-l-2 border-brand-orange pl-4">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                {(item.start_time || item.start_date) && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(item.start_time || item.start_date).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <Button
            onClick={onOpenRegister}
            disabled={!isRegistrationOpen}
            className={!isRegistrationOpen ? 'cursor-not-allowed opacity-60' : ''}
          >
            <span>
              {isRegistrationOpen
                ? 'Register your team'
                : registrationStatus.reason === 'not_started'
                  ? 'Registration opens soon'
                  : 'Registration closed'}
            </span>
            {isRegistrationOpen && <ArrowRight className="h-4 w-4" />}
          </Button>
          {deadline && (
            <span className="text-xs font-semibold text-slate-700">
              {isRegistrationOpen ? `Registration closes ${deadline}` : registrationStatus.message}
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
