import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Clock, CheckCircle2, Circle } from 'lucide-react';

export default function ScheduleSection() {
  const { schedules, scheduleEvents } = useHackathon();
  const [activeScheduleId, setActiveScheduleId] = useState(schedules[0]?.id || 'sch-01');

  const currentSchedule = schedules.find(s => s.id === activeScheduleId) || schedules[0];
  const eventsForCurrent = scheduleEvents.filter(e => e.schedule_id === activeScheduleId);

  return (
    <section id="schedule" className="py-20 border-b border-slate-800/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-mono font-semibold uppercase text-sky-400 mb-2">
            Timeline
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            48-Hour Sprint Schedule
          </h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            All checkpoints are synchronized with official NIST time. Mentors will conduct table walkthroughs during sprint milestones.
          </p>
        </div>

        {/* Day Selectors */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {schedules.map((sch) => {
            const isActive = sch.id === activeScheduleId;
            return (
              <button
                key={sch.id}
                onClick={() => setActiveScheduleId(sch.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0e131f] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{sch.title.split(':')[0]}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {sch.status}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day Details */}
        {currentSchedule && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0e131f] border border-slate-800">
            <div className="pb-6 border-b border-slate-800/80 mb-6">
              <h3 className="text-xl font-bold text-white">
                {currentSchedule.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {currentSchedule.description}
              </p>
            </div>

            {/* Events Timeline */}
            <div className="space-y-4">
              {eventsForCurrent.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#090d15] border border-slate-800/60">
                  <div className="mt-0.5">
                    {event.has_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-sm font-semibold text-white">
                        {event.description}
                      </h4>
                      <span className="font-mono text-[11px] text-slate-400">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.remarks && (
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        {event.remarks}
                      </p>
                    )}
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
