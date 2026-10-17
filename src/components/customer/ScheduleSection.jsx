import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Clock, CheckCircle2, Circle } from 'lucide-react';

export default function ScheduleSection() {
  const { schedules, scheduleEvents, isLoadingApi } = useHackathon();
  const [activeScheduleId, setActiveScheduleId] = useState(null);

  const effectiveScheduleId = activeScheduleId || schedules[0]?.id;
  const currentSchedule = schedules.find(s => s.id === effectiveScheduleId) || schedules[0];
  const matchedEvents = scheduleEvents.filter(e => e.schedule_id === effectiveScheduleId);
  const eventsForCurrent = (matchedEvents.length > 0 ? matchedEvents : currentSchedule?.events) || [];

  if (schedules.length === 0 && !isLoadingApi) {
    return null;
  }

  return (
    <section id="schedule" className="py-20 bg-[#fafafa] border-b border-gray-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="bic-section-label mb-2">Timeline</div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            48-Hour Sprint Schedule
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            All checkpoints are synchronized with official sprint time. Mentors will conduct
            table walkthroughs during milestones and code sprints.
          </p>
        </div>

        {/* Day Selectors */}
        {schedules.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {schedules.map((sch) => {
              const isActive = sch.id === effectiveScheduleId;
              return (
                <button
                  key={sch.id}
                  onClick={() => setActiveScheduleId(sch.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm ${
                    isActive
                      ? 'bg-coral-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <span>{sch.title.split(':')[0]}</span>
                  {sch.status && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-coral-600 text-coral-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sch.status}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Day Content */}
        {currentSchedule && (
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm">
            <div className="pb-6 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-bold text-slate-900">{currentSchedule.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{currentSchedule.description}</p>
            </div>

            {/* Events Timeline */}
            <div className="space-y-3">
              {eventsForCurrent.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {event.has_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-coral-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-sm font-semibold text-slate-900">{event.description}</h4>
                      <span className="font-mono text-[11px] text-slate-500 shrink-0">
                        <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                      {event.remarks && (
                        <span>{event.remarks}</span>
                      )}
                      {event.member && (
                        <span className="text-coral-700 font-medium">
                          Facilitator: {event.member.first_name} {event.member.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
