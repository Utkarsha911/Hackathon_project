import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalPortal from '../common/ModalPortal';
import {
  ClipboardList,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Edit2,
  Trash2,
  Key,
  Layers,
  ChevronLeft,
  ChevronRight,
  Code2,
  Clock,
  Mail,
  User,
  Globe
} from 'lucide-react';

const FALLBACK_ACTIVITIES = [
  {
    id: 101,
    user_email: 'admin@gmail.com',
    user_name: 'admin admin',
    action_type: 'create',
    model_name: 'Group',
    object_repr: 'Something',
    message: 'Created group "Something" with permissions [33, 34, 35, 36]',
    language: 'en',
    created_at: '2026-10-17T15:49:01.004Z'
  },
  {
    id: 102,
    user_email: 'admin@gmail.com',
    user_name: 'admin admin',
    action_type: 'create',
    model_name: 'User',
    object_repr: 'saurav.director@bichackathon.org',
    message: 'Registered new user account with Super Admin group allocation',
    language: 'en',
    created_at: '2026-10-17T15:30:12.450Z'
  },
  {
    id: 103,
    user_email: 'admin@gmail.com',
    user_name: 'admin admin',
    action_type: 'update',
    model_name: 'Category',
    object_repr: 'Autonomous AI & HealthTech',
    message: 'Updated category permissions and judging criteria',
    language: 'en',
    created_at: '2026-10-17T14:15:00.000Z'
  },
  {
    id: 104,
    user_email: 'admin@gmail.com',
    user_name: 'admin admin',
    action_type: 'login',
    model_name: 'User',
    object_repr: 'admin@gmail.com',
    message: 'Authenticated admin session via /api/v1/users/login/ (Bearer JWT generated)',
    language: 'en',
    created_at: '2026-10-17T14:00:22.000Z'
  }
];

export default function LogViewer() {
  const [activities, setActivities] = useState(FALLBACK_ACTIVITIES);
  const [totalCount, setTotalCount] = useState(FALLBACK_ACTIVITIES.length);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLiveApi, setIsLiveApi] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Disable background scrolling when activity detail modal is open
  useBodyScrollLock(Boolean(selectedActivity));

  // Fetch activities from GET /api/v1/activities/
  const fetchActivities = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (actionFilter !== 'all') params.action_type = actionFilter;

      const response = await api.activities.getAll(params);

      // Backend returns: { count, next, previous, results: [...] }
      if (response && Array.isArray(response.results)) {
        setIsLiveApi(true);
        setTotalCount(response.count ?? response.results.length);
        setNextUrl(response.next);
        setPrevUrl(response.previous);
        setCurrentPage(page);

        if (response.results.length > 0) {
          setActivities(response.results);
        } else {
          // If server returns empty list, display empty or fallback
          setActivities([]);
        }
      } else if (Array.isArray(response)) {
        setIsLiveApi(true);
        setActivities(response);
        setTotalCount(response.length);
      }
    } catch (err) {
      console.warn('api.activities.getAll error:', err);
      setError(err?.message || 'Could not reach /api/v1/activities/');
      setIsLiveApi(false);
      // Keep fallback activities for seamless testing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1);
  }, [actionFilter]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchActivities(1);
  };

  // Helper for action badge colors
  const getActionBadge = (actionType) => {
    const act = (actionType || 'info').toLowerCase();
    switch (act) {
      case 'create':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <PlusCircle className="w-3 h-3 text-emerald-600" />
        };
      case 'update':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Edit2 className="w-3 h-3 text-blue-600" />
        };
      case 'delete':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <Trash2 className="w-3 h-3 text-red-600" />
        };
      case 'login':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Key className="w-3 h-3 text-purple-600" />
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Layers className="w-3 h-3 text-slate-500" />
        };
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const emailMatch = (act.user_email || '').toLowerCase().includes(term);
    const nameMatch = (act.user_name || '').toLowerCase().includes(term);
    const msgMatch = (act.message || '').toLowerCase().includes(term);
    const modelMatch = (act.model_name || '').toLowerCase().includes(term);
    const reprMatch = (act.object_repr || '').toLowerCase().includes(term);
    return emailMatch || nameMatch || msgMatch || modelMatch || reprMatch;
  });

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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, model, action, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-14 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e8622a]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchActivities(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Action:</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:border-[#e8622a]"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
          </select>

          <span className="text-xs text-slate-400 pl-2">
            Total Activities: <strong className="text-slate-800">{totalCount || filteredActivities.length}</strong>
          </span>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Model & Object</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-6">Message</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No activity logs found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Try adjusting your search criteria' : 'No recorded activity events yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const badge = getActionBadge(act.action_type);
                  const userName = act.user_name || act.user_email?.split('@')[0] || 'User';
                  const initials = userName.slice(0, 2).toUpperCase();

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {act.created_at ? new Date(act.created_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{act.action_type || 'EVENT'}</span>
                        </span>
                      </td>

                      {/* Model Name & Object Repr */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900">
                            {act.model_name || 'System'}
                          </span>
                          {act.object_repr && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                              {act.object_repr}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 text-[#e8622a] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate max-w-[160px]">
                              {userName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px]" title={act.user_email}>
                              {act.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Message & Language */}
                      <td className="py-3.5 px-6 text-slate-600">
                        <div className="flex items-start gap-2">
                          <span className="line-clamp-2 leading-relaxed">
                            {act.message || 'No message recorded'}
                          </span>
                          {act.language && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase shrink-0">
                              {act.language}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Details Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedActivity(act)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#e8622a] bg-orange-50 hover:bg-orange-100 border border-orange-200 transition"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>JSON</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong>{filteredActivities.length}</strong> of <strong>{totalCount}</strong> logs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchActivities(currentPage - 1)}
              disabled={!prevUrl && currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage}
            </span>

            <button
              onClick={() => fetchActivities(currentPage + 1)}
              disabled={!nextUrl}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Inspection Modal */}
      <ModalPortal>
      {selectedActivity && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-[#e8622a]" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Activity Record #{selectedActivity.id}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedActivity.action_type?.toUpperCase()} {selectedActivity.model_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs overflow-x-auto max-h-72">
              <pre className="text-emerald-400">
                {JSON.stringify(selectedActivity, null, 2)}
              </pre>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
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
      )}
      </ModalPortal>
    </div>
  );
}
