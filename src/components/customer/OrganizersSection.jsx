import React, { useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import { CheckCircle, Users } from 'lucide-react';

export default function OrganizersSection() {
  const { organizers = [], isLoadingApi } = useHackathon();

  const sortedOrganizers = useMemo(() => {
    return [...organizers].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999;
      const orderB = typeof b.order === 'number' ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [organizers]);

  if (sortedOrganizers.length === 0 && !isLoadingApi) {
    return null;
  }

  return (
    <section id="organizers" className="py-24 bg-[#fafafa] border-b border-gray-200/80 relative">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="bic-section-label mb-2.5">Hackathon Leadership</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Organizing Committee
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Meet the coordinators and leads directing the BIC Hackathon edition.
            </p>
          </div>

          {sortedOrganizers.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs self-start md:self-end">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span>Verified Committee · {sortedOrganizers.length} Leads</span>
            </div>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoadingApi && sortedOrganizers.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 p-5 rounded-2xl animate-pulse shadow-xs flex flex-col items-center"
              >
                <div className="w-full h-64 bg-slate-200 rounded-xl mb-4" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Organizers Grid: ONLY user profile (image + name) and designation */}
        {sortedOrganizers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedOrganizers.map((org) => {
              const user = org.user || {};
              const fullName =
                user.full_name ||
                `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                user.username ||
                'Organizer';
              const rawImage = user.profile_picture || org.profile_picture || org.image;
              const imageUrl = rawImage ? getMediaUrl(rawImage) : null;
              const initial = (user.first_name?.[0] || fullName[0] || 'O').toUpperCase();
              const designation = org.designation || org.position || 'Organizer';

              return (
                <div
                  key={org.id}
                  className="group relative bg-white border border-slate-200/90 hover:border-orange-400 rounded-2xl overflow-hidden transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-1 flex flex-col text-center"
                >
                  {/* Photo container */}
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={fullName}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                          if (fb) fb.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`avatar-fallback w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 text-[#ea580c] flex items-center justify-center font-extrabold text-4xl ${
                        imageUrl ? 'hidden' : 'flex'
                      }`}
                    >
                      {initial}
                    </div>
                  </div>

                  {/* Profile & Designation Only */}
                  <div className="p-5 flex flex-col items-center justify-center text-center">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors line-clamp-1">
                      {fullName}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-orange-600 mt-1 line-clamp-1">
                      {designation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">
              No organizers announced yet for this edition.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
