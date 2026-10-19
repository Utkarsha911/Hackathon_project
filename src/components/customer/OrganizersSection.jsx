import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import api, { getMediaUrl } from '../../services/api';
import { Mail, Phone, GraduationCap, Building2, CheckCircle, UserCheck, RefreshCw, Award, MapPin } from 'lucide-react';

export default function OrganizersSection() {
  const { organizers: contextOrganizers } = useHackathon();
  const [organizers, setOrganizers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDept, setSelectedDept] = useState('all');

  const fetchOrganizersFromApi = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calls http://127.0.0.1:8000/api/v1/organizers/
      const res = await api.organizers.getAll();
      // Handle either { items: [...], total: ... } or direct array [...]
      const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      if (items.length > 0) {
        setOrganizers(items);
      } else if (contextOrganizers && contextOrganizers.length > 0) {
        setOrganizers(contextOrganizers);
      } else {
        setOrganizers([]);
      }
    } catch (err) {
      console.warn('Direct organizers fetch failed, using fallback:', err);
      setError(err.message || 'Failed to load organizers');
      if (contextOrganizers && contextOrganizers.length > 0) {
        setOrganizers(contextOrganizers);
      }
    } finally {
      setIsLoading(false);
    }
  }, [contextOrganizers]);

  useEffect(() => {
    fetchOrganizersFromApi();
  }, [fetchOrganizersFromApi]);

  // If contextOrganizers gets populated and local state is empty, initialize it
  useEffect(() => {
    if (contextOrganizers && contextOrganizers.length > 0 && organizers.length === 0 && !isLoading) {
      setOrganizers(contextOrganizers);
    }
  }, [contextOrganizers, organizers.length, isLoading]);

  // Unique departments for filter tabs
  const departments = useMemo(() => {
    const map = new Map();
    organizers.forEach((org) => {
      if (org.department && org.department.id && org.department.title) {
        map.set(org.department.id, org.department.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [organizers]);

  // Filter and sort items (by order, then id)
  const filteredAndSortedOrganizers = useMemo(() => {
    const list =
      selectedDept === 'all'
        ? organizers
        : organizers.filter(
            (org) => org.department_id === selectedDept || org.department?.id === selectedDept
          );

    return [...list].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 99;
      const orderB = typeof b.order === 'number' ? b.order : 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [organizers, selectedDept]);

  return (
    <section id="organizers" className="py-24 bg-[#fafafa] border-b border-gray-200/80 relative">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="bic-section-label mb-2.5">Hackathon Leadership</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Organizing Committee & Directors
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Engineering leads, domain researchers, and campus coordinators orchestrating
              infrastructure, network sprints, judging platforms, and hospitality.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
              <CheckCircle className="w-4 h-4 text-coral-600" />
              <span>Verified Committee · {organizers.length} Leads Active</span>
            </div>
          </div>
        </div>

        {/* Department Filter Tabs */}
        {departments.length > 0 && organizers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-10 pb-2 border-b border-slate-200/70">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                selectedDept === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              All Committees ({organizers.length})
            </button>
            {departments.map((dept) => {
              const count = organizers.filter(
                (o) => o.department_id === dept.id || o.department?.id === dept.id
              ).length;
              const isSelected = selectedDept === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'bg-coral-600 text-white border-coral-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {dept.title} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && organizers.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl animate-pulse shadow-sm">
                <div className="w-full h-52 bg-slate-200 rounded-xl mb-4" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Organizers Grid */}
        {filteredAndSortedOrganizers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedOrganizers.map((org) => {
              const user = org.user || {};
              const dept = org.department || {};
              const fullName =
                `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                user.username ||
                'Committee Member';
              const isOnDuty = org.status === 'on_duty';
              const isManager = Boolean(org.is_manager);
              const imageUrl = getMediaUrl(org.image);

              return (
                <div
                  key={org.id}
                  className="group relative bg-white border border-slate-200/90 hover:border-coral-400 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div>
                    {/* Portrait container with solid status badge */}
                    <div className="relative h-60 overflow-hidden bg-slate-100">
                      <img
                        src={
                          imageUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                        }
                        alt={fullName}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                        }}
                      />
                      {/* Soft gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                      {/* Top Badges (Manager / Status) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isManager && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500 text-white shadow-sm border border-amber-400">
                            <Award className="w-2.5 h-2.5" />
                            Manager
                          </span>
                        )}
                        {isOnDuty ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/95 text-emerald-700 border border-emerald-300/80 shadow-sm backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            On Duty
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-white/95 text-slate-700 border border-slate-200 shadow-sm backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {org.status || 'Active'}
                          </span>
                        )}
                      </div>

                      {/* Position Tag overlay */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <span className="inline-block text-[11px] font-mono font-semibold text-white bg-slate-900/85 px-2.5 py-0.5 rounded border border-white/20 backdrop-blur-sm shadow-sm truncate max-w-full">
                          {org.position || 'Director'}
                        </span>
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="p-5 pt-4">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-coral-600 transition-colors">
                        {fullName}
                      </h3>

                      {/* Department */}
                      {dept.title && (
                        <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-coral-600 shrink-0 mt-0.5" />
                          <span className="leading-tight text-slate-600 font-medium">{dept.title}</span>
                        </div>
                      )}

                      {/* College / Institution */}
                      {user.college && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user.college}</span>
                        </div>
                      )}

                      {/* Location / City */}
                      {user.city_province && user.city_province !== 'string' && (
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{user.city_province}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Row */}
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                    {user.email ? (
                      <a
                        href={`mailto:${user.email}`}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-coral-600 transition-colors truncate max-w-[190px]"
                        title={user.email}
                      >
                        <Mail className="w-3.5 h-3.5 text-coral-600 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{user.email}</span>
                      </a>
                    ) : (
                      <span className="font-mono text-[11px] text-slate-400">Core Directorate</span>
                    )}

                    {user.phone_number && user.phone_number !== 'string' && (
                      <a
                        href={`tel:${user.phone_number}`}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                        title={user.phone_number}
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No organizers found for the selected filter.</p>
            {selectedDept !== 'all' && (
              <button
                onClick={() => setSelectedDept('all')}
                className="mt-3 px-4 py-1.5 text-xs font-semibold text-coral-600 hover:text-coral-700 bg-coral-50 hover:bg-coral-100 rounded-lg transition-colors"
              >
                Show All Committees
              </button>
            )}
          </div>
        ) : null}

      </div>
    </section>
  );
}
