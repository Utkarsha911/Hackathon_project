import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getSelectedAdminHackathon } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  User,
  Building2,
  CheckSquare,
  Square,
  FileText,
  Calendar
} from 'lucide-react';

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-[#ea580c]',
  },
  urgent: {
    label: 'Urgent',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
};

export default function OrganizerTaskManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const { showToast } = useHackathon();

  // Data states
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    urgent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Aux data for dropdowns
  const [organizersList, setOrganizersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [hackathonsList, setHackathonsList] = useState([]);

  // Search & Filter state (Backend-driven)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const searchDebounceRef = useRef(null);

  // Sync status filter when sidebar dropdown item is clicked (searchParams changes)
  const urlStatus = searchParams.get('status') || 'all';
  useEffect(() => {
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
  }, [urlStatus]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    organizer: '',
    department: '',
    priority: 'medium',
    deadline: '',
    is_completed: false,
    link: '',
    notes: '',
    hackathon: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View details modal
  const [viewingTask, setViewingTask] = useState(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Lock body scroll when any modal is open
  useBodyScrollLock(isModalOpen || Boolean(viewingTask) || deleteModal.isOpen);

  // Load organizers, departments, and hackathons for selects
  useEffect(() => {
    // Hackathons
    api.hackathons
      .getAll({ skipHackathonFilter: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : res?.data || [];
        setHackathonsList(list);
      })
      .catch((err) => console.warn('Failed to fetch hackathons in OrganizerTaskManagement:', err));

    // Departments
    api.departments
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
        setDepartmentsList(list);
      })
      .catch((err) => console.warn('Failed to fetch departments in OrganizerTaskManagement:', err));

    // Organizers
    api.hackathons.organizers
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
        setOrganizersList(list);
      })
      .catch((err) => console.warn('Failed to fetch organizers in OrganizerTaskManagement:', err));
  }, []);

  // Fetch organizer tasks with backend-driven filters
  const fetchTasks = useCallback(
    async (
      searchTerm = searchQuery,
      currentStatus = statusFilter,
      currentPriority = priorityFilter,
      currentDepartment = departmentFilter
    ) => {
      setIsLoading(true);
      try {
        const params = {};
        if (searchTerm?.trim()) {
          params.search = searchTerm.trim();
        }
        if (currentStatus === 'completed') {
          params.is_completed = 'true';
        } else if (currentStatus === 'pending') {
          params.is_completed = 'false';
        }
        if (currentPriority && currentPriority !== 'all') {
          params.priority = currentPriority;
        }
        if (currentDepartment && currentDepartment !== 'all') {
          params.department = currentDepartment;
        }

        const res = await api.organizerTasks.getAll(params, { forceRefresh: true });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
          ? res.results
          : [];
        setTasks(list);
        setTotalCount(res?.count ?? list.length);

        if (res?.stats) {
          setStats(res.stats);
        } else {
          setStats({
            total: list.length,
            completed: list.filter((t) => t.is_completed).length,
            pending: list.filter((t) => !t.is_completed).length,
            urgent: list.filter((t) => t.priority === 'urgent' || t.priority === 'high').length,
          });
        }
      } catch (err) {
        console.error('Failed to load organizer tasks:', err);
        showToast(err?.message || 'Failed to load organizer tasks.', 'error');
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, statusFilter, priorityFilter, departmentFilter, showToast]
  );

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Global hackathon changed listener
  useEffect(() => {
    const handleHackathonChange = () => {
      fetchTasks();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    return () => {
      window.removeEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    };
  }, [fetchTasks]);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchTasks(val, statusFilter, priorityFilter, departmentFilter);
    }, 350);
  };

  // Status Filter change
  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val === 'all') next.delete('status');
      else next.set('status', val);
      return next;
    });
    fetchTasks(searchQuery, val, priorityFilter, departmentFilter);
  };

  // Priority Filter change
  const handlePriorityFilterChange = (e) => {
    const val = e.target.value;
    setPriorityFilter(val);
    fetchTasks(searchQuery, statusFilter, val, departmentFilter);
  };

  // Department Filter change
  const handleDepartmentFilterChange = (e) => {
    const val = e.target.value;
    setDepartmentFilter(val);
    fetchTasks(searchQuery, statusFilter, priorityFilter, val);
  };

  // Quick Toggle Completed
  const handleToggleComplete = async (task, e) => {
    if (e) e.stopPropagation();
    const newCompleted = !task.is_completed;
    try {
      await api.organizerTasks.patch(task.id, {
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      });
      showToast(newCompleted ? 'Task marked as completed.' : 'Task marked as pending.', 'success');
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task completion:', err);
      showToast(err?.message || 'Failed to update task completion status.', 'error');
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    const activeHackathon = getSelectedAdminHackathon();
    setForm({
      name: '',
      description: '',
      organizer: organizersList[0]?.id || '',
      department: departmentsList[0]?.id || '',
      priority: 'medium',
      deadline: '',
      is_completed: false,
      link: '',
      notes: '',
      hackathon: activeHackathon && activeHackathon !== 'all' ? activeHackathon : hackathonsList[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task, e) => {
    if (e) e.stopPropagation();
    setEditingTask(task);

    // Format deadline for datetime-local input
    let formattedDeadline = '';
    if (task.deadline) {
      try {
        const d = new Date(task.deadline);
        if (!isNaN(d.getTime())) {
          formattedDeadline = d.toISOString().slice(0, 16);
        }
      } catch {
        formattedDeadline = '';
      }
    }

    setForm({
      name: task.name || '',
      description: task.description || '',
      organizer: typeof task.organizer === 'object' ? task.organizer?.id : task.organizer || '',
      department: typeof task.department === 'object' ? task.department?.id : task.department || '',
      priority: task.priority || 'medium',
      deadline: formattedDeadline,
      is_completed: Boolean(task.is_completed),
      link: task.link || '',
      notes: task.notes || '',
      hackathon: typeof task.hackathon === 'object' ? task.hackathon?.id : task.hackathon || '',
    });
    setIsModalOpen(true);
  };

  // Submit Create or Edit Task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Please provide a task name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        organizer: form.organizer || null,
        department: form.department || null,
        priority: form.priority || 'medium',
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        is_completed: Boolean(form.is_completed),
        link: form.link?.trim() || '',
        notes: form.notes?.trim() || '',
      };
      if (form.hackathon) {
        payload.hackathon = form.hackathon;
      }

      if (editingTask) {
        await api.organizerTasks.update(editingTask.id, payload);
        showToast('Task updated successfully.', 'success');
      } else {
        await api.organizerTasks.create(payload);
        showToast('Task created successfully.', 'success');
      }
      setIsModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Failed to save organizer task:', err);
      showToast(err?.message || 'Failed to save task.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    setIsDeleting(true);
    try {
      await api.organizerTasks.delete(deleteModal.item.id);
      showToast('Task deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, item: null });
      if (viewingTask?.id === deleteModal.item.id) {
        setViewingTask(null);
      }
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast(err?.message || 'Failed to delete task.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Standard Unboxed Header - Rule 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Organizer Tasks
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Committee task delegation, sprint milestones, and departmental deadlines
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
          style={{ backgroundColor: '#ea580c' }}
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* 2. KPI Stat Cards (Consuming Backend Stats - Rule 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c]">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats.total ?? totalCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Milestones tracked</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 font-mono">
              {stats.pending ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">In progress milestones</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              {stats.completed ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Milestones resolved</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              High / Urgent
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-700 font-mono">
              {stats.urgent ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Critical priorities</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar (Backend-Driven - Rule 6) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tasks, organizers..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Segmented Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleStatusFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange('pending')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange('completed')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={handlePriorityFilterChange}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={handleDepartmentFilterChange}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          >
            <option value="all">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Tasks Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
            <p className="text-sm">Loading organizer tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Tasks Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No organizer tasks matched your current filter selection.'
                : 'No tasks have been assigned to organizers yet.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs cursor-pointer"
              style={{ backgroundColor: '#ea580c' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Task</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Assignee & Dept</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/60 transition group cursor-pointer"
                      onClick={() => setViewingTask(task)}
                    >
                      {/* Checkbox Toggle */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleComplete(task, e)}
                          className="text-slate-400 hover:text-emerald-600 transition p-1"
                          title={task.is_completed ? 'Mark pending' : 'Mark completed'}
                        >
                          {task.is_completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Task Name & Description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className={task.is_completed ? 'line-through text-slate-400' : ''}>
                            {task.name}
                          </span>
                          {task.link && (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#ea580c] hover:underline"
                              title="External Resource Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Assignee & Dept */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {task.organizer_name ? task.organizer_name[0].toUpperCase() : 'O'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block text-xs">
                              {task.organizer_name || 'Unassigned'}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              <Building2 className="w-3 h-3" />
                              {task.department_name || 'No department'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Priority (Static badge - Rule 9) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${priority.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dotClass}`} />
                          {priority.label}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {formatDate(task.deadline)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(task, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, item: task })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Task"
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
        )}
      </div>

      {/* 5. Create / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 my-6">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c]">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTask ? 'Edit Organizer Task' : 'Assign New Task'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Delegate sprint deliverables and track completion
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Task Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Set up local DNS proxy, Prepare catering schedule"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assignee (Organizer) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.organizer}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition text-slate-700"
                  >
                    <option value="">Select an organizer...</option>
                    {organizersList.map((org) => {
                      const user = org.user || {};
                      const name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Organizer';
                      return (
                        <option key={org.id} value={org.id}>
                          {name} ({org.designation || 'Staff'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition text-slate-700"
                  >
                    <option value="">Select department...</option>
                    {departmentsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition text-slate-700"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Task Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, checklist items, or operational criteria..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Documentation / Link <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/..."
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budget approved, pending vendor confirmation"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_completed}
                    onChange={(e) => setForm({ ...form, is_completed: e.target.checked })}
                    className="w-4 h-4 rounded text-[#ea580c] focus:ring-[#ea580c]"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Mark task as completed
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Task Details Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c]">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingTask.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Deadline: {formatDate(viewingTask.deadline)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Assignee</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{viewingTask.organizer_name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Department</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{viewingTask.department_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Priority</span>
                  <span className="font-bold capitalize text-slate-900 mt-0.5 block">{viewingTask.priority}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Status</span>
                  <span className={`font-bold mt-0.5 block ${viewingTask.is_completed ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {viewingTask.is_completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>

              {viewingTask.description && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Description
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                    {viewingTask.description}
                  </p>
                </div>
              )}

              {viewingTask.notes && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Internal Notes
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                    {viewingTask.notes}
                  </p>
                </div>
              )}

              {viewingTask.link && (
                <div>
                  <a
                    href={viewingTask.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-[#c2410c] text-xs font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Linked Resource</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleComplete(viewingTask)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                  viewingTask.is_completed
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{viewingTask.is_completed ? 'Mark as Pending' : 'Mark as Completed'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Task?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete task{' '}
                <strong className="text-slate-800">"{deleteModal.item?.name}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
