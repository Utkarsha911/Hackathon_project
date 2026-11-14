import React, { useEffect, useState } from 'react';
import { ArrowDown, Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../../services/api';
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
  const [previousHackathons, setPreviousHackathons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    api.request('/hackathons/previous-hackathons/')
      .then((response) => {
        const editions = Array.isArray(response)
          ? response
          : Array.isArray(response?.results)
            ? response.results
            : [];
        if (isMounted) setPreviousHackathons(editions);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Unable to load previous hackathons.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
          {isLoading ? (
            <p className="mx-auto max-w-5xl text-sm text-slate-500" role="status">Loading previous hackathons...</p>
          ) : error ? (
            <p className="mx-auto max-w-5xl text-sm text-red-600" role="alert">{error}</p>
          ) : previousHackathons.length === 0 ? (
            <p className="mx-auto max-w-5xl text-sm text-slate-500">No previous hackathons are available yet.</p>
          ) : (
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute left-5 top-6 bottom-8 w-px bg-gradient-to-b from-brand-orange via-brand-blue to-slate-200 sm:left-1/2 sm:-translate-x-1/2" />
            <div className="space-y-10 sm:space-y-16">
              {previousHackathons.map((edition, index) => (
                <div key={edition.id} className="relative grid grid-cols-[2.5rem_1fr] items-start gap-4 sm:grid-cols-2 sm:gap-16">
                  <div className={`absolute left-5 top-6 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-white bg-brand-orange shadow-[0_0_0_4px_rgba(234,88,12,0.15)] sm:left-1/2 ${index % 2 === 0 ? '' : ''}`} />
                  <div className={`col-start-2 sm:col-span-1 ${index % 2 === 0 ? 'sm:col-start-2' : 'sm:col-start-1 sm:row-start-1'}`}>
                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-orange/40 hover:shadow-lg">
                      {edition.banner_image && (
                        <img
                          src={getMediaUrl(edition.banner_image)}
                          alt={`${edition.title || 'Hackathon'} edition`}
                          className="h-44 w-full object-cover"
                        />
                      )}
                      <div className="p-5 sm:p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
                          {edition.version || edition.year || 'Previous edition'}
                        </p>
                        <h2 className="mt-2 text-xl font-extrabold text-slate-900">{edition.title}</h2>
                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                          {(edition.start_date || edition.end_date) && (
                            <p className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0 text-brand-orange" />{formatDateRange(edition.start_date, edition.end_date)}</p>
                          )}
                          {edition.venue && (
                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-brand-orange" />{edition.venue}</p>
                          )}
                          {(edition.minimum_team_size || edition.maximum_team_size) && (
                            <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-brand-orange" />{edition.minimum_team_size || 1}–{edition.maximum_team_size || 4} members per team</p>
                          )}
                        </div>
                        {edition.description && (
                          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">{edition.description}</p>
                        )}
                      </div>
                    </article>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative z-10 mx-auto mt-10 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              <ArrowDown className="h-3.5 w-3.5 text-brand-orange" />
              More stories ahead
            </div>
          </div>
          )}
          <Link to="/" className="mt-10 inline-flex text-sm font-semibold text-brand-blue hover:text-brand-orange">
            Back to current edition
          </Link>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
