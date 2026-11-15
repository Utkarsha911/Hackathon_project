import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalPortal from '../common/ModalPortal';
import {
  ClipboardList,
  Search,
  Filter,
  AlertCircle,
  PlusCircle,
  Edit2,
  Trash2,
  Key,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  User,
  Globe,
  X,
  MoreHorizontal,
  Database,
  FileText,
  Hash,
  Activity
} from 'lucide-react';

// Fields already shown in dedicated sections of the details modal
const PRIMARY_FIELDS = new Set([
  'id',
  'user_email',
  'user_name',
  'action_type',
  'model_name',
  'object_repr',
  'message',
  'language',
  'created_at'
]);

const ACTION_STYLES = {
  create: {
    label: 'Create',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: PlusCircle
  },
  update: {
    label: 'Update',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    Icon: Edit2
  },
  delete: {
    label: 'Delete',
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    Icon: Trash2
  },
  login: {
    label: 'Login',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    Icon: Key
  }
};

const DEFAULT_ACTION_STYLE = {
  label: 'Event',
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  dot: 'bg-slate-400',
  Icon: Layers
};

const getActionStyle = (actionType) =>
  ACTION_STYLES[(actionType || '').toLowerCase()] || DEFAULT_ACTION_STYLE;

const humanize = (key) =>
  String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value) => {
  if (!value) return { date: 'N/A', time: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: String(value), time: '' };
  return {
    date: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
};

const formatRelative = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Math.round((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} days ago`;
  return '';
};

// Renders any value as readable UI (never raw JSON)
function ValueView({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 italic">Not set</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
          value
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {value ? 'Yes' : 'No'}
      </span>
    );
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400 italic">None</span>;
    if (value.every((v) => typeof v !== 'object' || v === null)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
            >
              {String(v)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {value.map((v, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
            <ValueView value={v} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-slate-400 italic">None</span>;
    return (
      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2">
            <dt className="text-[11px] font-semibold text-slate-500">{humanize(k)}</dt>
            <dd className="col-span-2 text-xs text-slate-800 break-words">
              <ValueView value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span className="break-words">{String(value)}</span>;
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm text-slate-800 mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export default function LogViewer() {
  const [activities, setActivities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters (applied by the backend)
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);

  useBodyScrollLock(Boolean(selectedActivity));

  const fetchActivities = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const params = { page };
        if (appliedSearch) params.search = appliedSearch;
        if (actionFilter !== 'all') params.action_type = actionFilter;

        const response = await api.activities.getAll(params);

        if (response && Array.isArray(response.results)) {
          setActivities(response.results);
          setTotalCount(response.count ?? response.results.length);
          setStats(response.stats || null);
          setNextUrl(response.next);
          setPrevUrl(response.previous);
          setCurrentPage(page);
        } else if (Array.isArray(response)) {
          setActivities(response);
          setTotalCount(response.length);
          setStats(null);
          setNextUrl(null);
          setPrevUrl(null);
          setCurrentPage(1);
        }
      } catch (err) {
        console.warn('api.activities.getAll error:', err);
        setError(err?.message || 'Could not load activity logs.');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    },
    [appliedSearch, actionFilter]
  );

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  // Re-fetch when the global hackathon edition changes
  useEffect(() => {
    const handleHackathonChange = () => fetchActivities(1);
    window.addEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    return () => window.removeEventListener('bic_admin_hackathon_changed', handleHackathonChange);
  }, [fetchActivities]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchTerm.trim());
  };

  const clearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
  };

  // KPI cards from backend stats
  const totalLogs = stats?.total_items ?? totalCount;
  const extraStats = stats
    ? Object.entries(stats).filter(
        ([k, v]) => k !== 'total_items' && (typeof v === 'number' || typeof v === 'string')
      )
    : [];

  const extraFields = selectedActivity
    ? Object.entries(selectedActivity).filter(([k]) => !PRIMARY_FIELDS.has(k))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Activity & Audit Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical events and user action records
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-[#ea580c]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Logs</div>
            <div className="text-xl font-bold text-slate-900">{totalLogs}</div>
          </div>
        </div>
        {extraStats.map(([key, value]) => (
          <div
            key={key}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-slate-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                {humanize(key)}
              </div>
              <div className="text-xl font-bold text-slate-900">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, model, action, message... (Enter)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ea580c]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Action:</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:border-[#ea580c]"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs sm:text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Activities Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">When</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-3 rounded bg-slate-100 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No activity logs found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {appliedSearch || actionFilter !== 'all'
                        ? 'Try adjusting your search or filter'
                        : 'No recorded activity events yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                activities.map((act) => {
                  const style = getActionStyle(act.action_type);
                  const userName = act.user_name || act.user_email?.split('@')[0] || 'System';
                  const initials = userName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const { date, time } = formatDate(act.created_at);
                  const relative = formatRelative(act.created_at);

                  return (
                    <tr
                      key={act.id}
                      className="group hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedActivity(act)}
                    >
                      {/* When */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{date}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{time}</span>
                          {relative && <span className="text-slate-300">·</span>}
                          {relative && <span>{relative}</span>}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 capitalize">
                        {act.action_type || style.label}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate max-w-[170px] capitalize">
                              {userName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[170px]" title={act.user_email}>
                              {act.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <Database className="w-3 h-3 text-slate-500" />
                          {act.model_name || 'System'}
                        </div>
                        {act.object_repr && (
                          <div
                            className="text-[11px] text-slate-500 truncate max-w-[180px] mt-1"
                            title={act.object_repr}
                          >
                            {act.object_repr}
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-[320px]">
                        <span className="line-clamp-2 leading-relaxed">
                          {act.message || 'No message recorded'}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivity(act);
                          }}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          aria-label="View details"
                          title="View details"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700">{activities.length}</strong> of{' '}
            <strong className="text-slate-700">{totalCount}</strong> logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchActivities(currentPage - 1)}
              disabled={!prevUrl || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-semibold text-slate-700">Page {currentPage}</span>
            <button
              onClick={() => fetchActivities(currentPage + 1)}
              disabled={!nextUrl || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      <ModalPortal>
        {selectedActivity && (() => {
          const style = getActionStyle(selectedActivity.action_type);
          const { Icon } = style;
          const { date, time } = formatDate(selectedActivity.created_at);
          return (
            <div
              className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4"
              onClick={() => setSelectedActivity(null)}
            >
              <div className="min-h-full flex items-center justify-center py-4">
                <div
                  className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal header */}
                  <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${style.badge}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Activity Details</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="capitalize">{selectedActivity.action_type || 'Event'}</span>
                          {selectedActivity.model_name ? ` · ${selectedActivity.model_name}` : ''}
                          {' · '}#{selectedActivity.id}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedActivity(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal body */}
                  <div className="p-5 overflow-y-auto space-y-5">
                    {/* Message */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <FileText className="w-3.5 h-3.5" />
                        Description
                      </div>
                      <p className="text-sm text-slate-800 mt-1.5 leading-relaxed">
                        {selectedActivity.message || 'No message recorded'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-slate-100">
                      <div className="divide-y divide-slate-100">
                        <DetailRow icon={User} label="Performed by">
                          <span className="font-semibold capitalize">{selectedActivity.user_name || 'System'}</span>
                        </DetailRow>
                        <DetailRow icon={Mail} label="Email">
                          {selectedActivity.user_email || <span className="text-slate-400 italic">Not set</span>}
                        </DetailRow>
                        <DetailRow icon={Clock} label="Timestamp">
                          {date}
                          {time && <span className="text-slate-500"> at {time}</span>}
                        </DetailRow>
                      </div>
                      <div className="divide-y divide-slate-100">
                        <DetailRow icon={Database} label="Model">
                          {selectedActivity.model_name || 'System'}
                        </DetailRow>
                        <DetailRow icon={Hash} label="Object">
                          {selectedActivity.object_repr || <span className="text-slate-400 italic">Not set</span>}
                        </DetailRow>
                        <DetailRow icon={Globe} label="Language">
                          <span className="uppercase">{selectedActivity.language || '—'}</span>
                        </DetailRow>
                      </div>
                    </div>

                    {extraFields.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Additional Information
                        </div>
                        <dl className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                          {extraFields.map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-3 px-4 py-2.5">
                              <dt className="text-xs font-semibold text-slate-500">{humanize(key)}</dt>
                              <dd className="col-span-2 text-xs text-slate-800 min-w-0">
                                <ValueView value={value} />
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setSelectedActivity(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </ModalPortal>
    </div>
  );
}
