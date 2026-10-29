import React, { useMemo, useState, useEffect } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import { Calendar, Clock, Info } from 'lucide-react';

const formatDayLabel = (index) => `Day ${index + 1}`;

const formatFullDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return 'Date To Be Announced';
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatShortDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return 'TBD';
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatTimeOnly = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatTimeRange = (startTime, endTime) => {
  const startT = formatTimeOnly(startTime);
  const endT = formatTimeOnly(endTime);
  if (startT && endT) return `${startT} – ${endT}`;
  if (startT) return startT;
  if (endT) return `Until ${endT}`;
  return null;
};

/**
 * Determine temporal status of an item (upcoming, in_progress, completed)
 * purely to apply color theme transitions once the start date has met.
 */
const getItemTemporalStatus = (item, now) => {
  const startRaw = item.start_date || item.start_time;
  const endRaw = item.end_date || item.end_time;

  if (!startRaw) {
    return { isLive: false, isCompleted: false, isUpcoming: true, hasStarted: false };
  }

  const startDate = new Date(startRaw);
  if (isNaN(startDate.getTime())) {
    return { isLive: false, isCompleted: false, isUpcoming: true, hasStarted: false };
  }

  const nowTime = now.getTime();

  // If start date has not been met yet
  if (nowTime < startDate.getTime()) {
    return { isLive: false, isCompleted: false, isUpcoming: true, hasStarted: false };
  }

  // Start date has been met
  if (endRaw) {
    const endDate = new Date(endRaw);
    if (!isNaN(endDate.getTime()) && nowTime > endDate.getTime()) {
      return { isLive: false, isCompleted: true, isUpcoming: false, hasStarted: true };
    }
  }

  // If marked completed in backend
  if (item.status === 'completed' || item.execution_status === 'smooth') {
    if (endRaw && new Date(endRaw).getTime() < nowTime) {
      return { isLive: false, isCompleted: true, isUpcoming: false, hasStarted: true };
    }
  }

  // In progress / started
  return { isLive: true, isCompleted: false, isUpcoming: false, hasStarted: true };
};

/**
 * Determine group temporal status for tab and header color transitions.
 */
const getGroupTemporalStatus = (group, now) => {
  if (!group?.dateObj || isNaN(group.dateObj.getTime())) {
    return { isToday: false, isCompleted: false, hasStarted: false };
  }

  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();

  const groupYear = group.dateObj.getFullYear();
  const groupMonth = group.dateObj.getMonth();
  const groupDate = group.dateObj.getDate();

  const isToday =
    todayYear === groupYear &&
    todayMonth === groupMonth &&
    todayDate === groupDate;

  if (isToday) {
    return { isToday: true, isCompleted: false, hasStarted: true };
  }

  const endOfGroupDay = new Date(groupYear, groupMonth, groupDate, 23, 59, 59, 999);
  const startOfGroupDay = new Date(groupYear, groupMonth, groupDate, 0, 0, 0, 0);

  if (now.getTime() > endOfGroupDay.getTime()) {
    return { isToday: false, isCompleted: true, hasStarted: true };
  }

  if (now.getTime() >= startOfGroupDay.getTime()) {
    return { isToday: true, isCompleted: false, hasStarted: true };
  }

  return { isToday: false, isCompleted: false, hasStarted: false };
};

// Individual Phase Card Component for Alternating Timeline
function ScheduleItemCard({ item, timeRange, temporal }) {
  return (
    <div
      className={`rounded-xl border p-3 sm:p-3.5 transition-all shadow-xs hover:shadow-md ${
        temporal.isLive
          ? 'bg-orange-50/40 border-orange-200 ring-2 ring-orange-500/20 shadow-orange-500/5'
          : temporal.isCompleted
          ? 'bg-slate-50/80 border-slate-200/80'
          : 'bg-white border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Time Range Badge */}
      {timeRange && (
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
            temporal.isLive
              ? 'text-[#ea580c] bg-orange-100/80 border-orange-200'
              : temporal.isCompleted
              ? 'text-slate-500 bg-slate-100 border-slate-200'
              : 'text-slate-700 bg-slate-50 border-slate-200/80'
          }`}
        >
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>{timeRange}</span>
        </div>
      )}

      {/* Phase Title */}
      <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5 leading-snug">
        {item.title}
      </h4>

      {/* Description */}
      {item.description && (
        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Remarks / Notes */}
      {item.remarks && (
        <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-800">
          <Info className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> {item.remarks}
          </span>
        </div>
      )}

      {/* Agenda Sessions */}
      {Array.isArray(item.events) && item.events.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-[#ea580c]" />
            <span>Agenda Sessions</span>
          </div>
          <div className="space-y-1">
            {item.events.map((evt) => {
              const evtTime = formatTimeRange(evt.start_time, evt.end_time);
              return (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0" />
                    <span className="truncate text-[11px] font-medium text-slate-800">
                      {evt.description}
                    </span>
                  </div>
                  {evtTime && (
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                      {evtTime}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScheduleSection() {
  const { schedules = [] } = useHackathon();

  // Keep live time updated so color transitions apply automatically
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter hackathon-type schedules and sort chronologically
  const sortedSchedules = useMemo(
    () =>
      [...schedules]
        .filter((s) => !s.type || s.type === 'hackathon')
        .sort((a, b) => {
          const tA = new Date(a.start_date || a.start_time || 0).getTime();
          const tB = new Date(b.start_date || b.start_time || 0).getTime();
          return tA - tB;
        }),
    [schedules]
  );

  // Group schedules according to start_date
  const groupedSchedules = useMemo(() => {
    const map = new Map();

    sortedSchedules.forEach((item) => {
      const rawDate = item.start_date || item.start_time;
      let key = 'tbd';
      let dateObj = null;

      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          dateObj = d;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          key = `${year}-${month}-${day}`;
        }
      }

      if (!map.has(key)) {
        map.set(key, {
          dateKey: key,
          dateObj,
          items: []
        });
      }

      map.get(key).items.push(item);
    });

    return Array.from(map.values());
  }, [sortedSchedules]);

  // Selected date state with intelligent auto-selection once start dates are met
  const [selectedDay, setSelectedDay] = useState('');

  useEffect(() => {
    if (!groupedSchedules.length) return;

    if (selectedDay && groupedSchedules.some((g) => g.dateKey === selectedDay)) {
      return;
    }

    const todayYear = now.getFullYear();
    const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayDay = String(now.getDate()).padStart(2, '0');
    const todayKey = `${todayYear}-${todayMonth}-${todayDay}`;

    // 1. If today matches a group date
    const todayGroup = groupedSchedules.find((g) => g.dateKey === todayKey);
    if (todayGroup) {
      setSelectedDay(todayGroup.dateKey);
      return;
    }

    // 2. If any group item has started / in progress
    const activeGroup = groupedSchedules.find((g) =>
      g.items.some((item) => getItemTemporalStatus(item, now).isLive)
    );
    if (activeGroup) {
      setSelectedDay(activeGroup.dateKey);
      return;
    }

    // 3. First upcoming group
    const upcomingGroup = groupedSchedules.find((g) => {
      const st = getGroupTemporalStatus(g, now);
      return !st.isCompleted;
    });
    if (upcomingGroup) {
      setSelectedDay(upcomingGroup.dateKey);
      return;
    }

    // 4. Default to first group
    setSelectedDay(groupedSchedules[0].dateKey);
  }, [groupedSchedules, selectedDay, now]);

  if (!sortedSchedules.length) return null;

  const currentKey = selectedDay || groupedSchedules[0]?.dateKey;
  const activeGroup = groupedSchedules.find((g) => g.dateKey === currentKey) || groupedSchedules[0];
  const groupTemporal = activeGroup ? getGroupTemporalStatus(activeGroup, now) : null;

  return (
    <Section id="schedule" py="py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Centered Heading in Customer Theme */}
        <div className="text-center mb-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blue mb-1">
            Schedule
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
            Event Timeline
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Explore the daily roadmap, sessions, and milestones.
          </p>
        </div>

        {/* Centered Date Filter Tabs in Customer Site Color Theme */}
        {groupedSchedules.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
            {groupedSchedules.map((group, idx) => {
              const isSelected = group.dateKey === currentKey;
              const gStatus = getGroupTemporalStatus(group, now);

              return (
                <button
                  key={group.dateKey}
                  type="button"
                  onClick={() => setSelectedDay(group.dateKey)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-navy text-white shadow-xs ring-1 ring-brand-navy/20'
                      : gStatus.hasStarted && !gStatus.isCompleted
                      ? 'bg-brand-tint text-brand-navy border border-brand-blue/30 hover:bg-brand-tint/80'
                      : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-ink border border-slate-200/80'
                  }`}
                >
                  <Calendar
                    className={`w-3 h-3 ${
                      isSelected
                        ? 'text-white'
                        : gStatus.hasStarted && !gStatus.isCompleted
                        ? 'text-brand-blue'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>Day {idx + 1}</span>
                  <span className={isSelected ? 'text-white/60' : 'text-slate-300'}>•</span>
                  <span>{formatShortDate(group.dateObj)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Date Badge in Customer Site Palette */}
        {activeGroup && (
          <div className="text-center mb-4">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                groupTemporal?.hasStarted && !groupTemporal?.isCompleted
                  ? 'bg-brand-tint text-brand-navy border border-brand-blue/30'
                  : 'bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Calendar
                className={`w-3 h-3 ${
                  groupTemporal?.hasStarted && !groupTemporal?.isCompleted
                    ? 'text-brand-blue'
                    : 'text-slate-500'
                }`}
              />
              <span>{formatFullDate(activeGroup.dateObj)}</span>
            </div>

            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {activeGroup.items.length} {activeGroup.items.length === 1 ? 'phase' : 'phases'} scheduled
            </p>
          </div>
        )}

        {/* Central Alternating Timeline Spine */}
        {activeGroup && (
          <div className="relative py-2 mt-4">
            {/* Central Vertical Spine (Desktop) */}
            <div className="hidden md:block absolute left-1/2 top-3 bottom-3 w-0.5 bg-slate-700 -translate-x-1/2 rounded-full" />

            {/* Left Vertical Spine (Mobile) */}
            <div className="md:hidden absolute left-3.5 top-3 bottom-3 w-0.5 bg-slate-700 rounded-full" />

            <div className="space-y-5 md:space-y-6">
              {activeGroup.items.map((item, itemIdx) => {
                const isLeft = itemIdx % 2 === 0;
                const timeRange = formatTimeRange(
                  item.start_date || item.start_time,
                  item.end_date || item.end_time
                );
                const temporal = getItemTemporalStatus(item, now);

                return (
                  <div
                    key={item.id || itemIdx}
                    className="relative flex flex-col md:flex-row items-center w-full"
                  >
                    {/* LEFT SIDE (Desktop) */}
                    <div className="hidden md:flex w-1/2 justify-end pr-8">
                      {isLeft && (
                        <div className="relative w-full max-w-[320px] group">
                          {/* Horizontal Connector Peg to Spine */}
                          <div className="absolute top-5 -right-8 w-8 h-0.5 bg-slate-300" />

                          {/* Chevron Arrow Pointing to Center Node */}
                          <div className="absolute top-4 -right-1.5 w-3 h-3 bg-white border-t border-r border-slate-200 rotate-45 z-10" />

                          <ScheduleItemCard
                            item={item}
                            timeRange={timeRange}
                            temporal={temporal}
                          />
                        </div>
                      )}
                    </div>

                    {/* CENTER CIRCULAR NUMBERED NODE */}
                    <div className="absolute left-3.5 md:left-1/2 top-3.5 -translate-x-1/2 z-20 flex items-center justify-center">
                      <div
                        className={`w-7 h-7 rounded-full font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-xs transition-all ${
                          temporal.isLive
                            ? 'bg-[#ea580c] text-white ring-3 ring-orange-500/25 scale-105'
                            : temporal.isCompleted
                            ? 'bg-slate-400 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {itemIdx + 1}
                      </div>
                    </div>

                    {/* RIGHT SIDE (Desktop) */}
                    <div className="hidden md:flex w-1/2 justify-start pl-8">
                      {!isLeft && (
                        <div className="relative w-full max-w-[320px] group">
                          {/* Horizontal Connector Peg to Spine */}
                          <div className="absolute top-5 -left-8 w-8 h-0.5 bg-slate-300" />

                          {/* Chevron Arrow Pointing to Center Node */}
                          <div className="absolute top-4 -left-1.5 w-3 h-3 bg-white border-b border-l border-slate-200 rotate-45 z-10" />

                          <ScheduleItemCard
                            item={item}
                            timeRange={timeRange}
                            temporal={temporal}
                          />
                        </div>
                      )}
                    </div>

                    {/* MOBILE VIEW (Stacked to the right of the mobile spine) */}
                    <div className="md:hidden w-full pl-9">
                      <div className="relative group">
                        <div className="absolute top-4 -left-1.5 w-3 h-3 bg-white border-b border-l border-slate-200 rotate-45 z-10" />
                        <ScheduleItemCard
                          item={item}
                          timeRange={timeRange}
                          temporal={temporal}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

