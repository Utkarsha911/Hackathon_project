import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Edit3,
  Trash2,
  Eye,
  X,
  Trophy,
  Check,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  QrCode
} from 'lucide-react';
import { api, getSelectedAdminHackathon } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ScheduleEventManagement from './ScheduleEventManagement';

// Execution status options matching backend ExecutionStatus choices
export const EXECUTION_STATUS_OPTIONS = [
  { value: 'not_evaluated', label: 'Not Evaluated', description: 'Session has not been evaluated yet', color: 'slate' },
  { value: 'smooth', label: 'Ran Smoothly', description: 'Schedule ran seamlessly with no interruptions', color: 'emerald' },
  { value: 'minor_issues', label: 'Minor Issues', description: 'Minor delays or minor operational snags', color: 'amber' },
  { value: 'major_issues', label: 'Major Issues', description: 'Significant delays or critical schedule blockages', color: 'rose' }
];

export default function ScheduleManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'schedules';

  // If user clicked 'Schedule Events' sub-item in sidebar, render ScheduleEventManagement
  if (activeTab === 'events') {
    return <ScheduleEventManagement />;
  }

  const { showToast, hackathon: currentHackathon } = useHackathon();

  // Data states
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Backend stats consumption
  const [stats, setStats] = useState({
    total_items: 0,
    active_items: 0,
    inactive_items: 0
  });

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'hackathon' | 'pre_event'
  const [executionStatusFilter, setExecutionStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modal open states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Active items in modals
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const getActiveHackathonId = () => {
    const selected = getSelectedAdminHackathon();
    if (selected && selected !== 'all') return selected;
    return currentHackathon?.id || '';
  };

  // Form states
  const initialForm = {
    hackathon: getActiveHackathonId(),
    hackathon_id: getActiveHackathonId(),
    type: 'hackathon',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_active: true
  };
  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);

  // Status update form state
  const [statusForm, setStatusForm] = useState({
    execution_status: 'not_evaluated',
    remarks: ''
  });

  // Lock background scrolling when any modal is open
  const isAnyModalOpen =
    createModalOpen ||
    editModalOpen ||
    statusModalOpen ||
    viewModalOpen ||
    deleteModalOpen;
  useBodyScrollLock(isAnyModalOpen);

  // Debounce search query to prevent excessive backend API calls
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Schedules (delegates search and filters to /api/v1/hackathons/admin/schedules/)
  const fetchSchedules = async (customParams) => {
    setLoading(true);
    try {
      const params = customParams !== undefined ? customParams : (() => {
        const p = {};
        const activeHackId = getActiveHackathonId();
        if (activeHackId) {
          p.hackathon = activeHackId;
          p.hackathon_id = activeHackId;
        }
        if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
        if (typeFilter !== 'all') p.type = typeFilter;
        if (executionStatusFilter !== 'all') p.execution_status = executionStatusFilter;
        if (activeFilter === 'active') p.is_active = 'true';
        if (activeFilter === 'inactive') p.is_active = 'false';
        return p;
      })();

      const data = await api.adminSchedules.getAll(params);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : data?.data || [];

      setSchedules(list);

      // Consume backend stats if present, else compute fallback
      if (data?.stats && typeof data.stats === 'object') {
        setStats(data.stats);
      } else {
        setStats({
          total_items: data?.count ?? list.length,
          active_items: list.filter((item) => item.is_active !== false).length,
          inactive_items: list.filter((item) => item.is_active === false).length
        });
      }
    } catch (err) {
      console.warn('Failed to load schedules:', err);
      showToast(err?.message || 'Failed to load schedules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger backend query whenever search or dropdown filters change
  useEffect(() => {
    const params = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (typeFilter !== 'all') params.type = typeFilter;
    if (executionStatusFilter !== 'all') params.execution_status = executionStatusFilter;
    if (activeFilter === 'active') params.is_active = 'true';
    if (activeFilter === 'inactive') params.is_active = 'false';

    fetchSchedules(params);
  }, [debouncedSearch, typeFilter, executionStatusFilter, activeFilter]);

  // Re-fetch whenever global hackathon edition changes in AdminLayout top bar
  useEffect(() => {
    const handleGlobalHackathonChange = () => {
      fetchSchedules();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleGlobalHackathonChange);
    return () => window.removeEventListener('bic_admin_hackathon_changed', handleGlobalHackathonChange);
  }, []);

  // Format datetime for datetime-local input
  const toLocalInputValue = (isoStr) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } catch {
      return '';
    }
  };

  // Format datetime for human display
  const formatDateTimeDisplay = (isoStr) => {
    if (!isoStr) return 'Not set';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  // Calculate duration between start and end
  const getDurationString = (startIso, endIso) => {
    if (!startIso || !endIso) return null;
    try {
      const start = new Date(startIso);
      const end = new Date(endIso);
      const diffMs = end - start;
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


  // Compute execution health breakdown
  const executionBreakdown = useMemo(() => {
    const counts = { smooth: 0, minor_issues: 0, major_issues: 0, not_evaluated: 0 };
    schedules.forEach((s) => {
      const st = s.execution_status || 'not_evaluated';
      if (counts[st] !== undefined) {
        counts[st] += 1;
      } else {
        counts.not_evaluated += 1;
      }
    });
    return counts;
  }, [schedules]);

  // Execution status badge component
  const renderExecutionBadge = (statusValue, onClick = null) => {
    const val = (statusValue || 'not_evaluated').toLowerCase();
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let Icon = HelpCircle;
    let label = 'Not Evaluated';

    if (val === 'smooth') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      label = 'Ran Smoothly';
    } else if (val === 'minor_issues') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = AlertTriangle;
      label = 'Minor Issues';
    } else if (val === 'major_issues') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = AlertCircle;
      label = 'Major Issues';
    }

    return (
      <button
        type="button"
        onClick={onClick || undefined}
        disabled={!onClick}
        title={onClick ? 'Click to update execution status' : label}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${badgeClass} ${
          onClick ? 'hover:shadow-xs cursor-pointer active:scale-95' : 'cursor-default'
        }`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </button>
    );
  };

  // Handlers for Modals
  const handleOpenCreateModal = () => {
    const activeHackId = getActiveHackathonId();
    setCreateForm({
      hackathon: activeHackId,
      hackathon_id: activeHackId,
      type: 'hackathon',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      is_active: true
    });
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (schedule) => {
    setSelectedSchedule(schedule);
    const hackId = typeof schedule.hackathon === 'object' && schedule.hackathon !== null
      ? schedule.hackathon.id || ''
      : schedule.hackathon_id || schedule.hackathon || getActiveHackathonId();

    setEditForm({
      hackathon: hackId,
      hackathon_id: hackId,
      type: schedule.type || 'hackathon',
      title: schedule.title || '',
      description: schedule.description || '',
      start_time: toLocalInputValue(schedule.start_time),
      end_time: toLocalInputValue(schedule.end_time),
      is_active: schedule.is_active !== false
    });
    setEditModalOpen(true);
  };

  const handleOpenStatusModal = (schedule) => {
    setSelectedSchedule(schedule);
    setStatusForm({
      execution_status: schedule.execution_status || 'not_evaluated',
      remarks: schedule.remarks || ''
    });
    setStatusModalOpen(true);
  };

  const handleOpenViewModal = (schedule) => {
    setSelectedSchedule(schedule);
    setViewModalOpen(true);
  };

  const handleOpenDeleteModal = (schedule) => {
    setSelectedSchedule(schedule);
    setDeleteModalOpen(true);
  };

  // CREATE Schedule (POST /api/v1/hackathons/admin/schedules/)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      showToast('Please provide a schedule title.', 'error');
      return;
    }
    const activeHackId = createForm.hackathon_id || createForm.hackathon || getActiveHackathonId();
    if (!activeHackId) {
      showToast('Please specify the hackathon ID.', 'error');
      return;
    }
    if (!createForm.start_time || !createForm.end_time) {
      showToast('Please specify both start and end times.', 'error');
      return;
    }
    if (new Date(createForm.start_time) >= new Date(createForm.end_time)) {
      showToast('End time must be strictly after start time.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        hackathon: activeHackId,
        hackathon_id: activeHackId,
        type: createForm.type || 'hackathon',
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        start_time: new Date(createForm.start_time).toISOString(),
        end_time: new Date(createForm.end_time).toISOString(),
        is_active: Boolean(createForm.is_active)
      };

      await api.adminSchedules.create(payload);
      showToast('Schedule created successfully!', 'success');
      setCreateModalOpen(false);
      await fetchSchedules();
    } catch (err) {
      console.warn('Create schedule error:', err);
      showToast(err?.message || 'Failed to create schedule.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // EDIT Schedule (PATCH /api/v1/hackathons/admin/schedules/{id}/)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchedule?.id) return;
    if (!editForm.title.trim()) {
      showToast('Please provide a schedule title.', 'error');
      return;
    }
    if (!editForm.start_time || !editForm.end_time) {
      showToast('Please specify both start and end times.', 'error');
      return;
    }
    if (new Date(editForm.start_time) >= new Date(editForm.end_time)) {
      showToast('End time must be strictly after start time.', 'error');
      return;
    }

    const activeHackId = editForm.hackathon_id || editForm.hackathon || getActiveHackathonId();

    setSubmitting(true);
    try {
      const payload = {
        hackathon: activeHackId,
        hackathon_id: activeHackId,
        type: editForm.type || 'hackathon',
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        start_time: new Date(editForm.start_time).toISOString(),
        end_time: new Date(editForm.end_time).toISOString(),
        is_active: Boolean(editForm.is_active)
      };

      await api.adminSchedules.patch(selectedSchedule.id, payload);
      showToast('Schedule updated successfully!', 'success');
      setEditModalOpen(false);
      await fetchSchedules();
    } catch (err) {
      console.warn('Edit schedule error:', err);
      showToast(err?.message || 'Failed to update schedule.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // UPDATE STATUS (PATCH /api/v1/hackathons/admin/schedules/{id}/update-status/)
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchedule?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        execution_status: statusForm.execution_status,
        remarks: statusForm.remarks.trim()
      };

      await api.adminSchedules.updateStatus(selectedSchedule.id, payload);
      showToast('Schedule execution status updated successfully!', 'success');
      setStatusModalOpen(false);
      await fetchSchedules();
    } catch (err) {
      console.warn('Update status error:', err);
      showToast(err?.message || 'Failed to update execution status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE Schedule (DELETE /api/v1/hackathons/admin/schedules/{id}/)
  const handleDeleteConfirm = async () => {
    if (!selectedSchedule?.id) return;
    setSubmitting(true);
    try {
      await api.adminSchedules.delete(selectedSchedule.id);
      showToast('Schedule deleted successfully.', 'success');
      setDeleteModalOpen(false);
      await fetchSchedules();
    } catch (err) {
      console.warn('Delete schedule error:', err);
      showToast(err?.message || 'Failed to delete schedule.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Standard Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Schedule Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure hackathon timeline, milestone agendas, session timings, and track real-time execution status
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'events' })}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-800 hover:border-[#ea580c] hover:bg-orange-50 hover:text-[#ea580c] shadow-xs transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#ea580c]" />
            <span>Record Event via QR</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Schedule</span>
          </button>
        </div>
      </div>

      {/* 2. Backend Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schedules */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Schedules
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {stats.total_items ?? schedules.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CalendarClock className="w-3 h-3 text-[#ea580c]" />
              <span>Program milestones & sessions</span>
            </div>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
            style={{ backgroundColor: '#fff3ef' }}
          >
            <CalendarClock className="w-6 h-6" style={{ color: '#ea580c' }} />
          </div>
        </div>

        {/* Active Schedules */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Schedules
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {stats.active_items ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Active in public timeline</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Inactive Schedules */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Inactive / Draft
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1">
              {stats.inactive_items ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Unpublished or archived</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shadow-inner shrink-0 border border-amber-100">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Execution Health KPI */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Execution Health
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {executionBreakdown.smooth} Smooth
              </span>
              {(executionBreakdown.minor_issues > 0 || executionBreakdown.major_issues > 0) && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200">
                  {executionBreakdown.minor_issues + executionBreakdown.major_issues} Issues
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>{executionBreakdown.not_evaluated} Pending evaluation</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner shrink-0 border border-indigo-100">
            <SlidersHorizontal className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="flex flex-col gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedules by title, description, remarks..."
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ea580c] transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Schedule Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none focus:border-[#ea580c] transition cursor-pointer font-medium"
            >
              <option value="all">All Types</option>
              <option value="hackathon">Hackathon Only</option>
              <option value="pre_event">Pre-Event Only</option>
            </select>

            {/* Active Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none focus:border-[#ea580c] transition cursor-pointer font-medium"
            >
              <option value="all">All States</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Card grid view"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Execution Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          <button
            type="button"
            onClick={() => setExecutionStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              executionStatusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({schedules.length})
          </button>
          {EXECUTION_STATUS_OPTIONS.map((opt) => {
            const count = executionBreakdown[opt.value] || 0;
            const isSelected = executionStatusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExecutionStatusFilter(opt.value)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#ea580c] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Schedules Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-xs">
          <div className="w-9 h-9 border-3 border-orange-200 border-t-[#ea580c] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading schedule timeline...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto mb-3">
            <CalendarClock className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">No Schedules Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || executionStatusFilter !== 'all' || activeFilter !== 'all'
              ? 'No schedules match your current filters. Try resetting search parameters.'
              : 'No schedules have been configured yet. Click the button below to add your first milestone.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:shadow transition cursor-pointer"
              style={{ backgroundColor: '#ea580c' }}
            >
              <Plus className="w-4 h-4" />
              <span>Create Schedule</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Title & Description</th>
                  <th className="py-3.5 px-4">Timeline / Duration</th>
                  <th className="py-3.5 px-4">Execution Status</th>
                  <th className="py-3.5 px-4">Active</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((schedule) => {
                  const duration = getDurationString(schedule.start_time, schedule.end_time);

                  return (
                    <tr
                      key={schedule.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Title & Description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#ea580c] transition-colors">
                            {schedule.title}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            schedule.type === 'pre_event'
                              ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                              : 'bg-blue-50 text-blue-700 border-blue-200/60'
                          }`}>
                            {schedule.type === 'pre_event' ? 'Pre-Event' : 'Hackathon'}
                          </span>
                        </div>
                        {schedule.description && (
                          <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                            {schedule.description}
                          </p>
                        )}
                        {schedule.remarks && (
                          <div className="mt-1 text-[10px] text-slate-400 italic flex items-center gap-1">
                            <span className="font-semibold text-slate-500">Remarks:</span>
                            <span className="truncate max-w-[260px]">{schedule.remarks}</span>
                          </div>
                        )}
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {formatDateTimeDisplay(schedule.start_time)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>To: {formatDateTimeDisplay(schedule.end_time)}</span>
                          {duration && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                              {duration}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Execution Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderExecutionBadge(schedule.execution_status, () => handleOpenStatusModal(schedule))}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {schedule.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Quick Update Status Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(schedule)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition"
                            title="Update Execution Status (/api/v1/hackathons/admin/schedules/update-status/)"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* View Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(schedule)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(schedule)}
                            className="p-1.5 rounded-lg text-[#ea580c] hover:bg-orange-50 border border-transparent hover:border-orange-200 transition"
                            title="Edit Schedule Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(schedule)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="py-3 px-4 bg-slate-50/60 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Showing {schedules.length} schedule{schedules.length === 1 ? '' : 's'}</span>
            <span>Click any execution status badge to quickly log live session health</span>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => {
            const duration = getDurationString(schedule.start_time, schedule.end_time);

            return (
              <div
                key={schedule.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      schedule.type === 'pre_event'
                        ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                        : 'bg-blue-50 text-blue-700 border-blue-200/60'
                    }`}>
                      {schedule.type === 'pre_event' ? 'Pre-Event' : 'Hackathon'}
                    </span>

                    {schedule.is_active !== false ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {schedule.title}
                  </h3>

                  {schedule.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {schedule.description}
                    </p>
                  )}

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Start:</span>
                      <span className="font-medium text-slate-800">
                        {formatDateTimeDisplay(schedule.start_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">End:</span>
                      <span className="font-medium text-slate-800">
                        {formatDateTimeDisplay(schedule.end_time)}
                      </span>
                    </div>
                    {duration && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-400">Duration:</span>
                        <span className="font-mono font-semibold text-[#ea580c]">
                          {duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {schedule.remarks && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-[11px] text-amber-800 mb-3">
                      <span className="font-semibold">Remarks: </span>
                      <span className="italic">{schedule.remarks}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {renderExecutionBadge(schedule.execution_status, () => handleOpenStatusModal(schedule))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenViewModal(schedule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(schedule)}
                      className="p-1.5 rounded-lg text-[#ea580c] hover:bg-orange-50 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(schedule)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CREATE SCHEDULE */}
      {/* ------------------------------------------------------------- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Create New Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish a milestone session into hackathon timeline
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              {/* Hidden Hackathon ID (auto-bound to current hackathon) */}
              <input type="hidden" name="hackathon" value={createForm.hackathon} />
              <input type="hidden" name="hackathon_id" value={createForm.hackathon_id || createForm.hackathon} />

              {/* Schedule Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.type || 'hackathon'}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition text-slate-800"
                >
                  <option value="hackathon">Hackathon (Public participant sprints & milestones)</option>
                  <option value="pre_event">Pre-Event (Pre-hackathon workshops & sessions)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                  placeholder="e.g. Opening Ceremony & Keynote Speech"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Brief overview of activities, venue details, speaker info..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                />
              </div>

              {/* Datetimes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.start_time}
                    onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.end_time}
                    onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create_is_active"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c]"
                />
                <label htmlFor="create_is_active" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Publish schedule as Active on platform
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {submitting ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: EDIT SCHEDULE */}
      {/* ------------------------------------------------------------- */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Edit Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update session timings, hackathon association, and content
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              {/* Hidden Hackathon ID (preserved on edit) */}
              <input type="hidden" name="hackathon" value={editForm.hackathon} />
              <input type="hidden" name="hackathon_id" value={editForm.hackathon_id || editForm.hackathon} />

              {/* Schedule Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.type || 'hackathon'}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition text-slate-800"
                >
                  <option value="hackathon">Hackathon (Public participant sprints & milestones)</option>
                  <option value="pre_event">Pre-Event (Pre-hackathon workshops & sessions)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                />
              </div>

              {/* Datetimes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c]"
                />
                <label htmlFor="edit_is_active" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Schedule is Active
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: UPDATE STATUS (/api/v1/hackathons/admin/schedules/update-status) */}
      {/* ------------------------------------------------------------- */}
      {statusModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Update Execution Status
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Endpoint: admin/schedules/update-status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Schedule
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedSchedule.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatDateTimeDisplay(selectedSchedule.start_time)}
                </div>
              </div>

              {/* Status Choices */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Execution Status <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {EXECUTION_STATUS_OPTIONS.map((opt) => {
                    const isSelected = statusForm.execution_status === opt.value;
                    return (
                      <label
                        key={opt.value}
                        onClick={() => setStatusForm({ ...statusForm, execution_status: opt.value })}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-orange-50/70 border-[#ea580c] ring-1 ring-[#ea580c]'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="execution_status"
                          value={opt.value}
                          checked={isSelected}
                          onChange={() => setStatusForm({ ...statusForm, execution_status: opt.value })}
                          className="mt-0.5 text-[#ea580c] focus:ring-[#ea580c]"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 flex items-center justify-between">
                            <span>{opt.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {opt.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={statusForm.remarks}
                  onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                  placeholder="Record real-time execution notes, mentor feedback, technical issues, or session achievements..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c] transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {submitting ? 'Updating...' : 'Save Execution Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: VIEW SCHEDULE DETAILS */}
      {/* ------------------------------------------------------------- */}
      {viewModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#ea580c]" />
                <h3 className="text-base font-bold text-slate-900">
                  Schedule Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Schedule Type:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                  selectedSchedule.type === 'pre_event'
                    ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                    : 'bg-blue-50 text-blue-700 border-blue-200/60'
                }`}>
                  {selectedSchedule.type === 'pre_event' ? 'Pre-Event' : 'Hackathon'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Title
                </span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedSchedule.title}
                </div>
              </div>

              {selectedSchedule.remarks && (
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Execution Remarks
                  </span>
                  <p className="text-slate-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 mt-1 italic whitespace-pre-wrap leading-relaxed">
                    "{selectedSchedule.remarks}"
                  </p>
                </div>
              )}

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                <span>Created: {formatDateTimeDisplay(selectedSchedule.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenStatusModal(selectedSchedule);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Update Status</span>
              </button>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: DELETE CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {deleteModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              Delete Schedule?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{selectedSchedule.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-2 pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-sm shadow-rose-500/20 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
