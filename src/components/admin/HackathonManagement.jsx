import React, { useState, useEffect } from 'react';
import { api, getMediaUrl } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Trophy,
  Plus,
  Search,
  Calendar,
  MapPin,
  Clock,
  Users,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Image as ImageIcon,
  ChevronRight,
  X,
  FileText,
  Upload,
  Check,
  Flame,
  LayoutGrid,
  ListFilter
} from 'lucide-react';

// Module-level cache so tab switching within the admin panel is instant
let cachedHackathonsPayload = null;

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ensureDateFormat = (val, fallback = null) => {
  if (!val) return fallback;
  const str = String(val).trim();
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // If it's just a 4-digit year like "2026"
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }
  // Try parsing date string
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return fallback;
};

const EMPTY_FORM = {
  title: '',
  sub_heading: '',
  version: 'V1.0',
  description: '',
  venue: 'Boston International College',
  start_date: getTodayDate(),
  end_date: getTodayDate(),
  event_time: '48 Hours',
  theme: '',
  rules: '',
  status: 'draft',
  registration_start_date: getTodayDate(),
  registration_end_date: getTodayDate(),
  minimum_team_size: 1,
  maximum_team_size: 4,
  year: getTodayDate(),
  banner_image: null
};

export default function HackathonManagement() {
  const { showToast } = useHackathon();

  // Primary data state
  const [hackathons, setHackathons] = useState(() => {
    return Array.isArray(cachedHackathonsPayload?.results) ? cachedHackathonsPayload.results : [];
  });
  const [stats, setStats] = useState(() => {
    return cachedHackathonsPayload?.stats || { total_items: 0, active_items: 0, inactive_items: 0 };
  });
  const [totalCount, setTotalCount] = useState(() => cachedHackathonsPayload?.count || 0);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createImagePreview, setCreateImagePreview] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [viewingHackathon, setViewingHackathon] = useState(null);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [deletingHackathon, setDeletingHackathon] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Background scroll lock when any modal is open
  const isAnyModalOpen = Boolean(
    isCreateOpen || viewingHackathon || editingHackathon || deletingHackathon
  );
  useBodyScrollLock(isAnyModalOpen);

  // Fetch /api/v1/hackathons/
  const fetchHackathons = async (force = false) => {
    if (!force && cachedHackathonsPayload) {
      setHackathons(cachedHackathonsPayload.results || []);
      setStats(cachedHackathonsPayload.stats || { total_items: 0, active_items: 0, inactive_items: 0 });
      setTotalCount(cachedHackathonsPayload.count || 0);
      return;
    }

    setLoading(true);
    try {
      const response = await api.hackathons.getAll({}, { forceRefresh: force });

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
        : response?.data || [];

      const computedStats = response?.stats || {
        total_items: response?.count ?? list.length,
        active_items: list.filter((h) => h.status === 'published' || h.status === 'active').length,
        inactive_items: list.filter((h) => h.status === 'draft' || h.status === 'archived').length
      };

      const payload = {
        count: response?.count ?? list.length,
        next: response?.next || null,
        previous: response?.previous || null,
        results: list,
        stats: computedStats
      };

      cachedHackathonsPayload = payload;
      setHackathons(list);
      setStats(computedStats);
      setTotalCount(payload.count);
    } catch (err) {
      console.warn('Failed to fetch hackathons from /api/v1/hackathons/:', err);
      showToast(err?.message || 'Failed to load hackathons.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  // Filter hackathons
  const filteredHackathons = hackathons.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.sub_heading && item.sub_heading.toLowerCase().includes(term)) ||
      (item.venue && item.venue.toLowerCase().includes(term)) ||
      (item.version && item.version.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' ||
      (item.status && item.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  // Handle banner image file selection in Create modal
  const handleCreateImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateForm((prev) => ({ ...prev, banner_image: file }));
      setCreateImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle banner image file selection in Edit modal
  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, banner_image: file }));
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // Open Edit modal
  const handleOpenEdit = (hackathon) => {
    setEditingHackathon(hackathon);
    setEditForm({
      title: hackathon.title || '',
      sub_heading: hackathon.sub_heading || '',
      version: hackathon.version || 'V1.0',
      description: hackathon.description || '',
      venue: hackathon.venue || '',
      start_date: ensureDateFormat(hackathon.start_date, ''),
      end_date: ensureDateFormat(hackathon.end_date, ''),
      event_time: hackathon.event_time || '48 Hours',
      theme: hackathon.theme || '',
      rules: hackathon.rules || '',
      status: hackathon.status || 'draft',
      registration_start_date: ensureDateFormat(hackathon.registration_start_date, ''),
      registration_end_date: ensureDateFormat(hackathon.registration_end_date, ''),
      minimum_team_size: hackathon.minimum_team_size ?? 1,
      maximum_team_size: hackathon.maximum_team_size ?? 4,
      year: ensureDateFormat(hackathon.year, getTodayDate()),
      banner_image: null
    });
    setEditImagePreview(hackathon.banner_image ? getMediaUrl(hackathon.banner_image) : '');
  };

  // Submit Create Hackathon to POST /api/v1/hackathons/
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      showToast('Please provide a hackathon title.', 'error');
      return;
    }

    setSubmittingCreate(true);
    try {
      const formData = new FormData();
      formData.append('title', createForm.title.trim());
      if (createForm.sub_heading) formData.append('sub_heading', createForm.sub_heading.trim());
      if (createForm.version) formData.append('version', createForm.version.trim());
      if (createForm.description) formData.append('description', createForm.description.trim());
      if (createForm.venue) formData.append('venue', createForm.venue.trim());

      // Ensure all date fields strictly adhere to YYYY-MM-DD
      const startDateFormatted = ensureDateFormat(createForm.start_date);
      if (startDateFormatted) formData.append('start_date', startDateFormatted);

      const endDateFormatted = ensureDateFormat(createForm.end_date);
      if (endDateFormatted) formData.append('end_date', endDateFormatted);

      const regStartFormatted = ensureDateFormat(createForm.registration_start_date);
      if (regStartFormatted) formData.append('registration_start_date', regStartFormatted);

      const regEndFormatted = ensureDateFormat(createForm.registration_end_date);
      if (regEndFormatted) formData.append('registration_end_date', regEndFormatted);

      const yearFormatted =
        ensureDateFormat(createForm.year) ||
        startDateFormatted ||
        getTodayDate();
      formData.append('year', yearFormatted);

      if (createForm.event_time) formData.append('event_time', createForm.event_time.trim());
      if (createForm.theme) formData.append('theme', createForm.theme.trim());
      if (createForm.rules) formData.append('rules', createForm.rules.trim());
      if (createForm.status) formData.append('status', createForm.status);
      formData.append('minimum_team_size', Number(createForm.minimum_team_size) || 1);
      formData.append('maximum_team_size', Number(createForm.maximum_team_size) || 4);

      if (createForm.banner_image instanceof File) {
        formData.append('banner_image', createForm.banner_image);
      }

      const created = await api.hackathons.create(formData);
      showToast(`Hackathon "${createForm.title}" created successfully!`, 'success');

      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      setCreateImagePreview('');
      // Refresh hackathons list
      await fetchHackathons(true);
    } catch (err) {
      console.error('Failed to create hackathon:', err);
      showToast(err?.message || 'Failed to create hackathon.', 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Submit Edit Hackathon to PUT/PATCH /api/v1/hackathons/{id}/
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingHackathon || !editForm.title.trim()) {
      showToast('Title is required.', 'error');
      return;
    }

    setSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.append('title', editForm.title.trim());
      formData.append('sub_heading', editForm.sub_heading ? editForm.sub_heading.trim() : '');
      formData.append('version', editForm.version ? editForm.version.trim() : 'V1.0');
      formData.append('description', editForm.description ? editForm.description.trim() : '');
      formData.append('venue', editForm.venue ? editForm.venue.trim() : '');

      // Ensure all date fields strictly adhere to YYYY-MM-DD
      const startDateFormatted = ensureDateFormat(editForm.start_date);
      if (startDateFormatted) formData.append('start_date', startDateFormatted);

      const endDateFormatted = ensureDateFormat(editForm.end_date);
      if (endDateFormatted) formData.append('end_date', endDateFormatted);

      const regStartFormatted = ensureDateFormat(editForm.registration_start_date);
      if (regStartFormatted) formData.append('registration_start_date', regStartFormatted);

      const regEndFormatted = ensureDateFormat(editForm.registration_end_date);
      if (regEndFormatted) formData.append('registration_end_date', regEndFormatted);

      const yearFormatted =
        ensureDateFormat(editForm.year) ||
        startDateFormatted ||
        ensureDateFormat(editingHackathon.year, getTodayDate());
      formData.append('year', yearFormatted);

      if (editForm.event_time) formData.append('event_time', editForm.event_time.trim());
      if (editForm.theme) formData.append('theme', editForm.theme.trim());
      if (editForm.rules) formData.append('rules', editForm.rules.trim());
      if (editForm.status) formData.append('status', editForm.status);
      formData.append('minimum_team_size', Number(editForm.minimum_team_size) || 1);
      formData.append('maximum_team_size', Number(editForm.maximum_team_size) || 4);

      if (editForm.banner_image instanceof File) {
        formData.append('banner_image', editForm.banner_image);
      }

      await api.hackathons.patch(editingHackathon.id, formData);
      showToast('Hackathon updated successfully!', 'success');

      setEditingHackathon(null);
      await fetchHackathons(true);
    } catch (err) {
      console.error('Failed to update hackathon:', err);
      showToast(err?.message || 'Failed to update hackathon.', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit Delete Hackathon to DELETE /api/v1/hackathons/{id}/
  const handleDeleteSubmit = async () => {
    if (!deletingHackathon) return;
    setSubmittingDelete(true);
    try {
      await api.hackathons.delete(deletingHackathon.id);
      showToast(`Hackathon "${deletingHackathon.title}" deleted.`, 'success');
      setDeletingHackathon(null);
      await fetchHackathons(true);
    } catch (err) {
      console.error('Failed to delete hackathon:', err);
      showToast(err?.message || 'Failed to delete hackathon.', 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'draft').toLowerCase();
    if (s === 'published' || s === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
          {status || 'Active'}
        </span>
      );
    }
    if (s === 'draft') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
          Draft
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Hackathon Management
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#c2410c] border border-orange-200">
              {stats.total_items ?? totalCount} Editions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, configure, and inspect platform hackathon editions, registration timelines, and event parameters
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setCreateForm(EMPTY_FORM);
              setCreateImagePreview('');
              setIsCreateOpen(true);
            }}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Hackathon</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Hackathons */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Editions
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {stats.total_items ?? totalCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#e8622a]" />
              <span>Platform hackathons in database</span>
            </div>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
            style={{ backgroundColor: '#fff3ef' }}
          >
            <Trophy className="w-6 h-6" style={{ color: '#e8622a' }} />
          </div>
        </div>

        {/* Active Items */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active / Published
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {stats.active_items ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Open or published to public</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner shrink-0 border border-emerald-100">
            <Flame className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Inactive Items */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Draft / Inactive
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1">
              {stats.inactive_items ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Work in progress editions</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shadow-inner shrink-0 border border-amber-100">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, edition version, venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white placeholder-slate-400 focus:outline-none focus:border-[#e8622a] transition"
          />
        </div>

        {/* Status Filter & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {['all', 'published', 'draft'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-orange-50 text-[#e8622a]' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-orange-50 text-[#e8622a]' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Hackathons View */}
      {loading && hackathons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-2 border-orange-200 border-t-[#e8622a] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">
            Loading hackathons from /api/v1/hackathons/...
          </p>
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Hackathons Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'No hackathons match the applied search filter.'
              : 'No hackathon editions have been created yet.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setCreateForm(EMPTY_FORM);
              setCreateImagePreview('');
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#e8622a' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Hackathon</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHackathons.map((hackathon) => {
            const bannerUrl = hackathon.banner_image ? getMediaUrl(hackathon.banner_image) : null;
            return (
              <div
                key={hackathon.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
              >
                {/* Banner Thumbnail */}
                <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt={hackathon.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100"
                    style={{ display: bannerUrl ? 'none' : 'flex' }}
                  >
                    <Trophy className="w-8 h-8 text-slate-300 mb-1" />
                    <span className="text-[11px] font-medium text-slate-400">No Banner Image</span>
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(hackathon.status)}
                  </div>

                  {/* Version Pill */}
                  {hackathon.version && (
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {hackathon.version}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#e8622a] transition truncate">
                      {hackathon.title}
                    </h3>
                    {hackathon.sub_heading && (
                      <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                        {hackathon.sub_heading}
                      </p>
                    )}

                    {hackathon.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {hackathon.description}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      {hackathon.venue && (
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{hackathon.venue}</span>
                        </div>
                      )}
                      {(hackathon.start_date || hackathon.end_date) && (
                        <div className="flex items-center gap-2 truncate">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {hackathon.start_date || 'TBD'} → {hackathon.end_date || 'TBD'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>
                            Team: {hackathon.minimum_team_size || 1} - {hackathon.maximum_team_size || 4}
                          </span>
                        </span>
                        {hackathon.event_time && (
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{hackathon.event_time}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewingHackathon(hackathon)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(hackathon)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Hackathon"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingHackathon(hackathon)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Hackathon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Edition</th>
                  <th className="py-3.5 px-4">Venue & Duration</th>
                  <th className="py-3.5 px-4">Event Dates</th>
                  <th className="py-3.5 px-4">Registration Window</th>
                  <th className="py-3.5 px-3">Team Size</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredHackathons.map((hackathon) => {
                  const bannerUrl = hackathon.banner_image
                    ? getMediaUrl(hackathon.banner_image)
                    : null;
                  return (
                    <tr key={hackathon.id} className="hover:bg-slate-50/80 transition group">
                      {/* Edition Info with Banner */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {bannerUrl ? (
                              <img
                                src={bannerUrl}
                                alt={hackathon.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"
                              style={{ display: bannerUrl ? 'none' : 'flex' }}
                            >
                              <Trophy className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-[#e8622a] transition truncate">
                                {hackathon.title}
                              </span>
                              {hackathon.version && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200 shrink-0 font-bold">
                                  {hackathon.version}
                                </span>
                              )}
                            </div>
                            {hackathon.sub_heading && (
                              <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                {hackathon.sub_heading}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Venue & Duration */}
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[180px] font-medium text-slate-800">
                          {hackathon.venue || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{hackathon.event_time || '—'}</span>
                        </div>
                      </td>

                      {/* Event Dates */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div>{hackathon.start_date || '—'}</div>
                        <div className="text-slate-400 text-[10px]">to {hackathon.end_date || '—'}</div>
                      </td>

                      {/* Registration Window */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div>{hackathon.registration_start_date || '—'}</div>
                        <div className="text-slate-400 text-[10px]">
                          to {hackathon.registration_end_date || '—'}
                        </div>
                      </td>

                      {/* Team Size */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>
                            {hackathon.minimum_team_size || 1} - {hackathon.maximum_team_size || 4}
                          </span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(hackathon.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingHackathon(hackathon)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Inspect details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(hackathon)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit hackathon"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingHackathon(hackathon)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete hackathon"
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
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE HACKATHON MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: '#fff3ef' }}
                >
                  <Trophy className="w-5 h-5" style={{ color: '#e8622a' }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Hackathon</h3>
                  <p className="text-xs text-slate-400">
                    Call POST /api/v1/hackathons/ with complete edition specifications
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Title & Sub Heading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hackathon Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BIC HACKATHON 2026"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sub Heading / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hack The City"
                    value={createForm.sub_heading}
                    onChange={(e) => setCreateForm({ ...createForm, sub_heading: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              {/* Version & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Version <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. V4.0"
                    value={createForm.version}
                    onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Boston International College"
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              {/* Event Dates & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 48 Hours"
                    value={createForm.event_time}
                    onChange={(e) => setCreateForm({ ...createForm, event_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              {/* Registration Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.registration_start_date}
                    onChange={(e) => setCreateForm({ ...createForm, registration_start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration End Date
                  </label>
                  <input
                    type="date"
                    value={createForm.registration_end_date}
                    onChange={(e) => setCreateForm({ ...createForm, registration_end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              {/* Team Size, Status & Edition Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={createForm.minimum_team_size}
                    onChange={(e) => setCreateForm({ ...createForm, minimum_team_size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={createForm.maximum_team_size}
                    onChange={(e) => setCreateForm({ ...createForm, maximum_team_size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Edition Date (Year)
                  </label>
                  <input
                    type="date"
                    value={createForm.year}
                    onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banner Image
                </label>
                <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                  {createImagePreview ? (
                    <img
                      src={createImagePreview}
                      alt="Banner Preview"
                      className="w-24 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCreateImageChange}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#c2410c] hover:file:bg-orange-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Upload high resolution horizontal banner (JPEG, PNG, WEBP)
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe the hackathon theme, goals, and opportunities..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#e8622a' }}
                >
                  {submittingCreate ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Hackathon</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT HACKATHON MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {editingHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#e8622a]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit {editingHackathon.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update edition parameters and registration windows
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingHackathon(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hackathon Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sub Heading
                  </label>
                  <input
                    type="text"
                    value={editForm.sub_heading}
                    onChange={(e) => setEditForm({ ...editForm, sub_heading: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={editForm.version}
                    onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={editForm.venue}
                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Duration
                  </label>
                  <input
                    type="text"
                    value={editForm.event_time}
                    onChange={(e) => setEditForm({ ...editForm, event_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editForm.minimum_team_size}
                    onChange={(e) => setEditForm({ ...editForm, minimum_team_size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editForm.maximum_team_size}
                    onChange={(e) => setEditForm({ ...editForm, maximum_team_size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Edition Date (Year)
                  </label>
                  <input
                    type="date"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banner Image
                </label>
                <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                  {editImagePreview ? (
                    <img
                      src={editImagePreview}
                      alt="Banner Preview"
                      className="w-24 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#c2410c] hover:file:bg-orange-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Leave empty to keep existing banner
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingHackathon(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#e8622a' }}
                >
                  {submittingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW HACKATHON DETAILS MODAL                                   */}
      {/* ------------------------------------------------------------- */}
      {viewingHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner shrink-0"
                  style={{ backgroundColor: '#fff3ef' }}
                >
                  <Trophy className="w-5 h-5" style={{ color: '#e8622a' }} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {viewingHackathon.title}
                    </h3>
                    {viewingHackathon.version && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px] font-bold shrink-0">
                        {viewingHackathon.version}
                      </span>
                    )}
                    <span className="shrink-0">{getStatusBadge(viewingHackathon.status)}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate">ID: {viewingHackathon.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingHackathon(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Banner Image */}
              {viewingHackathon.banner_image && (
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56">
                  <img
                    src={getMediaUrl(viewingHackathon.banner_image)}
                    alt={viewingHackathon.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Venue
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {viewingHackathon.venue || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Event Duration
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {viewingHackathon.event_time || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Event Dates
                  </span>
                  <span className="text-xs font-mono text-slate-800 mt-1 block">
                    {viewingHackathon.start_date || '—'} → {viewingHackathon.end_date || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Registration Dates
                  </span>
                  <span className="text-xs font-mono text-slate-800 mt-1 block">
                    {viewingHackathon.registration_start_date || '—'} →{' '}
                    {viewingHackathon.registration_end_date || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Team Size Allowed
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {viewingHackathon.minimum_team_size || 1} to {viewingHackathon.maximum_team_size || 4} Members
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Edition Year
                  </span>
                  <span className="text-xs font-mono text-slate-800 mt-1 block">
                    {viewingHackathon.year || '—'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {viewingHackathon.description && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Description
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {viewingHackathon.description}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Created: {viewingHackathon.created_at ? new Date(viewingHackathon.created_at).toLocaleString() : '—'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingHackathon;
                      setViewingHackathon(null);
                      handleOpenEdit(target);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Edit Hackathon
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingHackathon(null)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition"
                    style={{ backgroundColor: '#e8622a' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      {deletingHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Delete Hackathon?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1.5 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-800">"{deletingHackathon.title}"</strong>? This will remove
              all associated timelines and configurations.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingHackathon(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDeleteSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingDelete ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
