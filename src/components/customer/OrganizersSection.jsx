import React, { useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import Card from '../common/Card';

export default function OrganizersSection() {
  const { organizers = [] } = useHackathon();

  const people = useMemo(() => {
    if (!Array.isArray(organizers)) return [];
    return [...organizers]
      .filter(Boolean)
      .sort((a, b) => (typeof a?.order === 'number' ? a.order : 999) - (typeof b?.order === 'number' ? b.order : 999));
  }, [organizers]);

  // Return null if no organizers data is received
  if (people.length === 0) return null;

  return (
    <Section
      id="organizers"
      tone="white"
      py="py-20"
      className="min-h-screen flex flex-col justify-center scroll-mt-16"
    >
      <div className="w-full">
        <SectionHeading
          label="The Organizing Committee"
          title="Meet the organizers"
          className="mb-12 text-center"
        >
          The dedicated committee working behind the scenes to run the event. Find us on sprint days.
        </SectionHeading>

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${people.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-5 sm:gap-6`}>
          {people.map((org) => {
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
              <Card
                key={org.id}
                hover
                className="p-5 flex flex-col items-center text-center group border border-slate-200/90 hover:border-orange-200 transition-all duration-200"
              >
                <div className="relative mb-3.5">
                  <img
                    src={img}
                    alt={name}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_USER_AVATAR;
                    }}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-100 border-2 border-slate-100 group-hover:border-orange-100 shadow-sm transition-all duration-200 group-hover:scale-105"
                  />
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-brand-blue transition-colors">
                  {name}
                </h3>
                <p className="text-xs text-[#ea580c] font-semibold mt-1 line-clamp-1">
                  {role}
                </p>
                {dept && (
                  <span className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                    {dept}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
