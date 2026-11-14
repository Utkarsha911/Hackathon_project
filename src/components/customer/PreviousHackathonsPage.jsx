import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import Footer from '../common/Footer';
import CustomerNavbar from './CustomerNavbar';
import Section from '../common/Section';

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  if (Number.isNaN(start.getTime())) return 'Date unavailable';
  if (Number.isNaN(end.getTime())) return start.toLocaleDateString();
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function PreviousHackathonsPage() {
  const { previousHackathons = [] } = useHackathon();

  if (previousHackathons.length === 0) return null;

  return (
    <div className="theme-brand min-h-screen bg-white text-slate-900">
      <CustomerNavbar />
      <main>
        <Section tone="tint" py="py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-blue">The archive</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Previous hackathon editions
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Explore the editions that came before the current event.
            </p>
          </div>
        </Section>

        <Section py="py-12 sm:py-16">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {previousHackathons.map((edition) => (
              <article key={edition.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                {edition.banner_image && (
                  <img
                    src={getMediaUrl(edition.banner_image)}
                    alt={`${edition.title || 'Hackathon'} edition`}
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
                    {edition.version || edition.year || 'Previous edition'}
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900">{edition.title}</h2>
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    {(edition.start_date || edition.end_date) && (
                      <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-brand-orange" />{formatDateRange(edition.start_date, edition.end_date)}</p>
                    )}
                    {edition.venue && (
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-orange" />{edition.venue}</p>
                    )}
                    {(edition.minimum_team_size || edition.maximum_team_size) && (
                      <p className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-orange" />{edition.minimum_team_size || 1}–{edition.maximum_team_size || 4} members per team</p>
                    )}
                  </div>
                  {edition.description && (
                    <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">{edition.description}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
          <Link to="/" className="mt-10 inline-flex text-sm font-semibold text-brand-blue hover:text-brand-orange">
            Back to current edition
          </Link>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
