import React, { useState, useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Clock, CheckCircle2, Circle, Calendar, MapPin } from 'lucide-react';

export default function ScheduleSection() {
  const { schedules, scheduleEvents, isLoadingApi } = useHackathon();

  // Determine if schedules are legacy nested items (have .events or scheduleEvents) or direct milestone objects
  const hasNestedEvents = useMemo(() => {
    return (
      (Array.isArray(schedules) && schedules.some((s) => Array.isArray(s.events) && s.events.length > 0)) ||
      (Array.isArray(scheduleEvents) && scheduleEvents.length > 0)
    );
  }, [schedules, scheduleEvents]);

  // For direct schedule items, group them by date (YYYY-MM-DD)
  const groupedDirectSchedules = useMemo(() => {
    if (hasNestedEvents || !Array.isArray(schedules) || schedules.length === 0) return {};

    const groups = {};
    // Sort schedules chronologically by start_time
    const sorted = [...schedules].sort((a, b) => {
      const tA = new Date(a.start_time || 0).getTime();
      const tB = new Date(b.start_time || 0).getTime();
      return tA - tB;
    });

    sorted.forEach((item) => {
      let dateKey = 'All Sessions';
      if (item.start_time) {
        try {
          const d = new Date(item.start_time);
          if (!isNaN(d.getTime())) {
            dateKey = d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          }
        } catch {
          dateKey = 'All Sessions';
        }
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    return groups;
  }, [schedules, hasNestedEvents]);

  const dateKeys = useMemo(() => Object.keys(groupedDirectSchedules), [groupedDirectSchedules]);

  // Active tab selection
  const [activeDateKey, setActiveDateKey] = useState(null);
  const effectiveDateKey = activeDateKey && dateKeys.includes(activeDateKey) ? activeDateKey : dateKeys[0];

  // Legacy active schedule ID for nested structure
  const [activeLegacyScheduleId, setActiveLegacyScheduleId] = useState(null);
  const effectiveLegacyScheduleId = activeLegacyScheduleId || schedules[0]?.id;
  const currentLegacySchedule = schedules.find((s) => s.id === effectiveLegacyScheduleId) || schedules[0];
  const matchedEvents = scheduleEvents.filter((e) => e.schedule_id === effectiveLegacyScheduleId);
  const eventsForLegacyCurrent = (matchedEvents.length > 0 ? matchedEvents : currentLegacySchedule?.events) || [];

  if ((!Array.isArray(schedules) || schedules.length === 0) && !isLoadingApi) {
    return null;
  }

  // Format time display (e.g. 09:30 AM – 11:00 AM)
  const formatTimeRange = (startIso, endIso) => {
    if (!startIso) return null;
    try {
      const start = new Date(startIso);
      const startTimeStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      if (!endIso) return startTimeStr;

      const end = new Date(endIso);
      const endTimeStr = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${startTimeStr} – ${endTimeStr}`;
    } catch {
      return null;
    }
  };

  // Compute duration (e.g. 2h 30m)
  const formatDuration = (startIso, endIso) => {
    if (!startIso || !endIso) return null;
    try {
      const diffMs = new Date(endIso) - new Date(startIso);
      if (isNaN(diffMs) || diffMs <= 0) return null;
      const mins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (hours === 0) return `${remainingMins}m`;
      if (remainingMins === 0) return `${hours}h`;
      return `${hours}h ${remainingMins}m`;
    } catch {
      return null;
    }
  };

  return (
    <section id="schedule" className="py-20 bg-[#fafafa] border-b border-gray-200/80 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-[#ea580c] border border-orange-200/80 mb-3">
            <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
            <span>Event Roadmap</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Hackathon Schedule & Timeline
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            All checkpoints are synchronized with official sprint time. Mentors and judges will conduct
            walkthroughs during milestones and code sprints.
          </p>
        </div>

        {/* CASE A: Direct Milestones from current-hackathon API */}
        {!hasNestedEvents && (
          <div>
            {/* Date Selectors (if milestones span multiple days) */}
            {dateKeys.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {dateKeys.map((dKey, idx) => {
                  const isActive = dKey === effectiveDateKey;
                  return (
                    <button
                      key={dKey}
                      type="button"
                      onClick={() => setActiveDateKey(dKey)}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                        isActive
                          ? 'bg-[#ea580c] text-white shadow-md shadow-orange-500/20'
                          : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{`Day ${idx + 1}: ${dKey}`}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {groupedDirectSchedules[dKey]?.length || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Timeline Cards for Active Day */}
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm">
              <div className="pb-5 border-b border-slate-100 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {effectiveDateKey || 'Hackathon Agenda'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live schedule milestones, workshops, and sprint sessions
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono self-start sm:self-auto">
                  <Clock className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>{groupedDirectSchedules[effectiveDateKey]?.length || schedules.length} Milestones Scheduled</span>
                </div>
              </div>

              {/* Chronological Milestone List */}
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-0.5 before:bg-slate-100 before:z-0">
                {(groupedDirectSchedules[effectiveDateKey] || schedules).map((item) => {
                  const timeRange = formatTimeRange(item.start_time, item.end_time);
                  const duration = formatDuration(item.start_time, item.end_time);
                  const isSmooth = item.execution_status === 'smooth';

                  return (
                    <div
                      key={item.id}
                      className="relative z-10 flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-[#ea580c]/50 hover:shadow-md transition-all group"
                    >
                      {/* Left Status Dot Icon */}
                      <div className="mt-0.5 w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs group-hover:border-[#ea580c] transition-colors">
                        {isSmooth ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#ea580c]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#ea580c] transition-colors">
                            {item.title}
                          </h4>

                          {timeRange && (
                            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                <Clock className="w-3 h-3 text-[#ea580c]" />
                                <span>{timeRange}</span>
                              </span>
                              {duration && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-50 text-[#c2410c] border border-orange-200">
                                  {duration}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {item.remarks && (
                          <div className="mt-2 text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/70 inline-block font-sans">
                            <span className="font-semibold">Note: </span>
                            <span>{item.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CASE B: Legacy Nested Day-Level Containers */}
        {hasNestedEvents && currentLegacySchedule && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {schedules.map((sch) => {
                const isActive = sch.id === effectiveLegacyScheduleId;
                return (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => setActiveLegacyScheduleId(sch.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#ea580c] text-white shadow-md shadow-orange-500/20'
                        : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span>{sch.title?.split(':')[0] || sch.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm">
              <div className="pb-6 border-b border-slate-100 mb-6">
                <h3 className="text-xl font-bold text-slate-900">{currentLegacySchedule.title}</h3>
                {currentLegacySchedule.description && (
                  <p className="text-xs text-slate-500 mt-1">{currentLegacySchedule.description}</p>
                )}
              </div>

              <div className="space-y-3">
                {eventsForLegacyCurrent.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-[#ea580c]/50 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {event.has_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-semibold text-slate-900">{event.description || event.title}</h4>
                        {event.start_time && (
                          <span className="font-mono text-[11px] text-slate-500 shrink-0">
                            <Clock className="w-3 h-3 inline mr-1 text-[#ea580c]" />
                            {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {event.end_time && ` – ${new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        )}
                      </div>

                      {event.remarks && (
                        <div className="mt-1 text-xs text-slate-500 font-mono">
                          {event.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
