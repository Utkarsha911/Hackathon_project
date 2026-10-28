import React, { useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';
import Section from '../common/Section';

function OrganizerCard({ org }) {
  const u = org.user || {};
  const name =
    u.full_name ||
    `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
    u.username ||
    'Organizer';
  const img = getUserAvatarUrl(u.profile_picture || org.profile_picture || org.image);
  const role = org.designation || org.position || org.role || 'Committee Member';
  const dept = org.department_name || org.department?.name;

  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200/80 hover:border-brand-blue/30 p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-navy/5 shadow-2xs">
      {/* Circular Avatar */}
      <div className="relative mb-3">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-100 group-hover:border-brand-blue/20 shadow-2xs transition-all duration-300">
          <img
            src={img}
            alt={name}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_USER_AVATAR;
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Organizer Name */}
      <h3 className="text-sm sm:text-base font-bold text-ink tracking-tight leading-snug line-clamp-1 group-hover:text-brand-blue transition-colors">
        {name}
      </h3>

      {/* Designation / Role - Customer Brand Blue */}
      <p className="text-xs font-semibold text-brand-blue mt-0.5 line-clamp-1">
        {role}
      </p>

      {/* Optional Department Badge */}
      {dept && (
        <span className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
          {dept}
        </span>
      )}
    </div>
  );
}

export default function OrganizersSection() {
  const { organizers = [] } = useHackathon();

  const people = useMemo(() => {
    if (!Array.isArray(organizers)) return [];
    return [...organizers]
      .filter(Boolean)
      .sort((a, b) => (typeof a?.order === 'number' ? a.order : 999) - (typeof b?.order === 'number' ? b.order : 999));
  }, [organizers]);

  // Separate into top row (e.g. 2 leads) and main grid (3 cards per row) matching reference card hierarchy
  const { topRow, mainGrid } = useMemo(() => {
    if (!people || people.length === 0) return { topRow: [], mainGrid: [] };

    // Identify leads / directors / heads by designation
    const leadCandidates = people.filter((p) => {
      const d = (p.designation || p.position || p.role || '').toLowerCase();
      return (
        d.includes('lead') ||
        d.includes('director') ||
        d.includes('head') ||
        d.includes('president') ||
        d.includes('convenor') ||
        d.includes('chair')
      );
    });

    if (leadCandidates.length === 2) {
      const topIds = new Set(leadCandidates.map((c) => c.id));
      return {
        topRow: leadCandidates,
        mainGrid: people.filter((p) => !topIds.has(p.id)),
      };
    }

    if (people.length >= 4) {
      return {
        topRow: people.slice(0, 2),
        mainGrid: people.slice(2),
      };
    }

    if (people.length === 2) {
      return {
        topRow: people,
        mainGrid: [],
      };
    }

    return {
      topRow: [],
      mainGrid: people,
    };
  }, [people]);

  // Return null if no organizers data received
  if (people.length === 0) return null;

  return (
    <Section
      id="organizers"
      tone="white"
      py="py-12 sm:py-16"
      className="scroll-mt-16"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section Heading in Customer Theme */}
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-2">
            The Organizing Committee
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            Meet the Organizers
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            The dedicated committee working behind the scenes to run the event. Find us on sprint days.
          </p>
        </div>

        {/* Top Row: 2 Lead Cards Centered */}
        {topRow.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl mx-auto mb-3.5">
            {topRow.map((org) => (
              <OrganizerCard key={org.id} org={org} />
            ))}
          </div>
        )}

        {/* Main Grid: 3 Cards Per Row */}
        {mainGrid.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {mainGrid.map((org) => (
              <OrganizerCard key={org.id} org={org} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
