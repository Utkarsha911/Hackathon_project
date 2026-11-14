/**
 * Utility functions for evaluating current hackathon registration availability.
 * Registration is only open if current-hackathon registration start date and end date
 * have been configured and the current timestamp falls within [start, end].
 */

/**
 * Parses a date value into a Date object.
 * If the string is a date-only string (YYYY-MM-DD), adjusts to start-of-day or end-of-day.
 *
 * @param {string|Date|number} dateVal 
 * @param {boolean} isEnd - If true and dateVal is YYYY-MM-DD, returns end of day (23:59:59.999)
 * @returns {Date|null}
 */
export function parseDateBoundary(dateVal, isEnd = false) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;

    // Check if the string is purely YYYY-MM-DD
    const dateOnlyMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const month = parseInt(dateOnlyMatch[2], 10) - 1;
      const day = parseInt(dateOnlyMatch[3], 10);
      if (isEnd) {
        return new Date(year, month, day, 23, 59, 59, 999);
      }
      return new Date(year, month, day, 0, 0, 0, 0);
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Evaluates whether registration start and end date for a hackathon edition have been met.
 *
 * @param {object|null} hackathon 
 * @returns {{
 *   isOpen: boolean,
 *   reason: 'open' | 'not_started' | 'closed' | 'dates_not_set' | 'no_hackathon',
 *   message: string,
 *   startDate: Date|null,
 *   endDate: Date|null
 * }}
 */
export function getRegistrationStatus(hackathon) {
  if (!hackathon || typeof hackathon !== 'object') {
    return {
      isOpen: false,
      reason: 'no_hackathon',
      message: 'No hackathon data available.',
      startDate: null,
      endDate: null
    };
  }

  // Support both snake_case and non-separated property naming from backend serializers
  const startDateRaw =
    hackathon.registration_start_date ||
    hackathon.registration_startdate ||
    hackathon.reg_start_date;
  const endDateRaw =
    hackathon.registration_end_date ||
    hackathon.registration_enddate ||
    hackathon.reg_end_date;

  if (!startDateRaw || !endDateRaw) {
    return {
      isOpen: false,
      reason: 'dates_not_set',
      message: 'Registration dates have not been scheduled.',
      startDate: null,
      endDate: null
    };
  }

  const start = parseDateBoundary(startDateRaw, false);
  const end = parseDateBoundary(endDateRaw, true);

  if (!start || !end) {
    return {
      isOpen: false,
      reason: 'dates_not_set',
      message: 'Registration schedule is invalid.',
      startDate: start,
      endDate: end
    };
  }

  const now = new Date();

  // Condition 1: Registration has not started yet
  if (now < start) {
    const diffMs = start.getTime() - now.getTime();
    const daysUntilStart = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return {
      isOpen: false,
      reason: 'not_started',
      message: `Registration opens on ${start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}.`,
      startDate: start,
      endDate: end,
      daysUntilStart
    };
  }

  // Condition 2: Registration deadline has passed
  if (now > end) {
    return {
      isOpen: false,
      reason: 'closed',
      message: `Registration closed on ${end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}.`,
      startDate: start,
      endDate: end,
      daysUntilStart: 0,
      daysRemaining: 0
    };
  }

  // Condition 3: Current date is within [start, end]
  const diffEndMs = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffEndMs / (1000 * 60 * 60 * 24)));
  return {
    isOpen: true,
    reason: 'open',
    message: `Registration is open until ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}.`,
    startDate: start,
    endDate: end,
    daysUntilStart: 0,
    daysRemaining
  };
}

/**
 * Computes live time remaining between now and targetDate.
 *
 * @param {Date|string|number} targetDate 
 * @returns {{
 *   total: number,
 *   days: number,
 *   hours: number,
 *   minutes: number,
 *   seconds: number,
 *   isPast: boolean
 * }}
 */
export function getTimeRemaining(targetDate) {
  if (!targetDate) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (isNaN(target.getTime())) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const total = target.getTime() - Date.now();
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds, isPast: false };
}

/**
 * Returns true only if current-hackathon registration start date and end date
 * have been configured and currently met.
 *
 * @param {object|null} hackathon 
 * @returns {boolean}
 */
export function isRegistrationOpen(hackathon) {
  return getRegistrationStatus(hackathon).isOpen;
}

/**
 * Formats the backend registration fee type for customer and admin labels.
 *
 * @param {string|null|undefined} feeType
 * @returns {string}
 */
export function formatRegistrationFeeType(feeType) {
  const normalized = String(feeType || 'per_team').trim().toLowerCase();
  const labels = {
    per_team: 'per team',
    team: 'per team',
    per_member: 'per participant',
    per_participant: 'per participant',
    member: 'per participant',
    participant: 'per participant'
  };

  if (labels[normalized]) return labels[normalized];
  return normalized.replace(/[_-]+/g, ' ');
}
