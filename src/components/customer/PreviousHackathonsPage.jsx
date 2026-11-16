import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, ImageOff, MapPin, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import Footer from '../common/Footer';
import CustomerNavbar from './CustomerNavbar';
import Section from '../common/Section';

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  if (Number.isNaN(start.getTime())) return '';
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (Number.isNaN(end.getTime()) || start.getTime() === end.getTime()) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

// Turn an edition from the backend into the simple shape the cards use.
function toCardData(edition) {
  const hasTeamSize = edition.minimum_team_size || edition.maximum_team_size;
  const start = new Date(edition.start_date);
  const year = Number.isNaN(start.getTime()) ? edition.year || '' : start.getFullYear();
  return {
    id: edition.id,
    version: edition.version || 'Edition',
    year,
    title: edition.title,
    image: edition.banner_image ? getMediaUrl(edition.banner_image) : '',
    date: edition.start_date || edition.end_date ? formatDateRange(edition.start_date, edition.end_date) : '',
    location: edition.venue || '',
    teamSize: hasTeamSize
      ? `${edition.minimum_team_size || 1}–${edition.maximum_team_size || 4} members per team`
      : '',
    description: edition.description || '',
  };
}

// Reserved slots for older editions that haven't been added in the admin panel yet.
// As soon as an edition with the same version (e.g. "V1.0" or "v1") is added there,
// the real edition replaces its empty slot automatically.
const RESERVED_VERSIONS = ['V1.0', 'V2.0', 'V3.0'];

// "V1.0", "v1", "1.0" and "1" all become "1" so they can be compared.
function versionKey(version) {
  return String(version || '').trim().toLowerCase().replace(/^v/, '').replace(/\.0$/, '');
}

function reservedSlot(version) {
  return {
    id: `reserved-${versionKey(version)}`,
    isPlaceholder: true,
    version,
    year: '',
    title: 'Details coming soon',
    image: '',
    date: '',
    location: '',
    teamSize: '',
    description: 'This edition will be added soon.',
  };
}

// Oldest first. Editions without a start date go to the end.
function byStartDate(a, b) {
  const ta = new Date(a.start_date).getTime();
  const tb = new Date(b.start_date).getTime();
  if (Number.isNaN(ta)) return 1;
  if (Number.isNaN(tb)) return -1;
  return ta - tb;
}

function InfoLine({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <p className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-brand-orange" />
      <span>{children}</span>
    </p>
  );
}

// The pill that sits on the timeline line: solid dot + version + year.
function MilestonePill({ edition }) {
  return (
    <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-brand-orange/40 bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm">
      <span className="h-2 w-2 rounded-full bg-brand-orange" />
      {edition.version}
      {edition.year && <span className="font-semibold text-slate-500">· {edition.year}</span>}
    </span>
  );
}

function EditionCard({ edition, onOpenImage }) {
  return (
    <article
      className={edition.isPlaceholder
        ? 'overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white p-3'
        : 'overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:border-brand-orange/40 hover:shadow-lg'}
    >
      {edition.image ? (
        <button
          type="button"
          onClick={() => onOpenImage(edition)}
          className="group block h-40 w-full overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          aria-label={`View ${edition.version} photo full screen`}
        >
          <img
            src={edition.image}
            alt={`${edition.title || 'Hackathon'} – ${edition.version}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            draggable="false"
          />
        </button>
      ) : (
        <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs text-slate-400">
          <ImageOff className="h-6 w-6" />
          No photo uploaded yet
        </div>
      )}
      <div className="px-1 pb-1 pt-4">
        <h2 className="text-lg font-extrabold leading-snug text-ink">{edition.title}</h2>
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <InfoLine icon={Calendar}>{edition.date}</InfoLine>
          <InfoLine icon={MapPin}>{edition.location}</InfoLine>
          <InfoLine icon={Users}>{edition.teamSize}</InfoLine>
        </div>
        {edition.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{edition.description}</p>
        )}
      </div>
    </article>
  );
}

function Lightbox({ edition, onClose }) {
  useBodyScrollLock(Boolean(edition));

  useEffect(() => {
    if (!edition) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [edition, onClose]);

  if (!edition) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${edition.version} photo`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25"
        aria-label="Close photo"
      >
        <X className="h-6 w-6" />
      </button>
      <figure className="max-h-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <img src={edition.image} alt={`${edition.title} – ${edition.version}`} className="max-h-[85vh] w-auto rounded-lg object-contain" />
        <figcaption className="mt-3 text-center text-sm text-white/80">
          <span className="font-bold text-brand-orange">{edition.version}</span> · {edition.title}
        </figcaption>
      </figure>
    </div>
  );
}

// Cards appear one after another with a small delay.
const entrance = (index) => ({ animationDelay: `${index * 90}ms`, animationFillMode: 'both' });

/**
 * Desktop: every edition fits on one screen (no arrows, no scrolling).
 * The line runs through the middle. Cards alternate: V1 below, V2 above, V3 below, V4 above...
 *
 * How the layout works: the grid has (number of editions + 1) columns. Each card spans
 * 2 columns, shifted by one column per edition. Because neighbours sit on opposite sides
 * of the line, cards can be twice as wide without overlapping each other.
 */
function HorizontalTimeline({ editions, onOpenImage }) {
  const columns = editions.length + 1;

  return (
    <div className="hidden lg:block">
      <div
        className="relative grid grid-rows-[1fr_auto_1fr]"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-orange to-brand-blue" />

        {editions.map((edition, index) => {
          const isBelow = index % 2 === 0; // 1st, 3rd, 5th... go below the line
          const gridColumn = `${index + 1} / span 2`;
          const branch = <span className="mx-auto block h-8 w-0.5 bg-slate-300" />;
          return (
            <React.Fragment key={edition.id}>
              <div className="row-start-1 flex flex-col justify-end px-3" style={{ gridColumn }}>
                {!isBelow && (
                  <div className="animate-slide-up" style={entrance(index)}>
                    <EditionCard edition={edition} onOpenImage={onOpenImage} />
                    {branch}
                  </div>
                )}
              </div>
              <div className="row-start-2 flex h-12 items-center justify-center" style={{ gridColumn }}>
                <MilestonePill edition={edition} />
              </div>
              <div className="row-start-3 flex flex-col justify-start px-3" style={{ gridColumn }}>
                {isBelow && (
                  <div className="animate-slide-up" style={entrance(index)}>
                    {branch}
                    <EditionCard edition={edition} onOpenImage={onOpenImage} />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** Phone and tablet: vertical line on the left, every card on the right. */
function VerticalTimeline({ editions, onOpenImage }) {
  return (
    <ol className="relative space-y-8 pl-8 lg:hidden">
      <span className="pointer-events-none absolute bottom-0 left-3 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-orange to-brand-blue" />
      {editions.map((edition, index) => (
        <li key={edition.id} className="relative animate-slide-up" style={entrance(index)}>
          <span className="absolute -left-5 top-3 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-white bg-brand-orange shadow" />
          <MilestonePill edition={edition} />
          <div className="mt-3">
            <EditionCard edition={edition} onOpenImage={onOpenImage} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function PreviousHackathonsPage() {
  // Preferred source: the shared context. If the context doesn't provide
  // previousHackathons yet, this page loads them from the backend itself.
  const { previousHackathons } = useHackathon();
  const hasContextData = Array.isArray(previousHackathons);

  const [fetchedEditions, setFetchedEditions] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasContextData);
  const [error, setError] = useState('');
  const [lightboxEdition, setLightboxEdition] = useState(null);

  useEffect(() => {
    if (hasContextData) return undefined;
    let isMounted = true;

    api.request('/hackathons/previous-hackathons/')
      .then((response) => {
        const list = Array.isArray(response) ? response : Array.isArray(response?.results) ? response.results : [];
        if (isMounted) setFetchedEditions(list);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Unable to load previous editions.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [hasContextData]);

  const editions = useMemo(() => {
    const source = hasContextData ? previousHackathons : fetchedEditions;
    const real = [...source].sort(byStartDate).map(toCardData);
    const existing = new Set(real.map((edition) => versionKey(edition.version)));
    const emptySlots = RESERVED_VERSIONS
      .filter((version) => !existing.has(versionKey(version)))
      .map(reservedSlot);
    // Empty V1–V3 slots first (oldest), then the real editions from the backend.
    return [...emptySlots, ...real];
  }, [hasContextData, previousHackathons, fetchedEditions]);

  const closeLightbox = useCallback(() => setLightboxEdition(null), []);

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
          <div className="mx-auto max-w-6xl">
            <p className="mb-6 text-sm text-slate-500" role="status">
              {isLoading ? 'Loading previous editions...' : `${editions.length} editions`}
            </p>

            {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

            {!isLoading && editions.length > 0 && (
              <>
                <HorizontalTimeline editions={editions} onOpenImage={setLightboxEdition} />
                <VerticalTimeline editions={editions} onOpenImage={setLightboxEdition} />
              </>
            )}

            <Link to="/" className="mt-10 inline-flex text-sm font-semibold text-brand-blue hover:text-brand-orange">
              Back to current edition
            </Link>
          </div>
        </Section>
      </main>
      <Footer />
      <Lightbox edition={lightboxEdition} onClose={closeLightbox} />
    </div>
  );
}
