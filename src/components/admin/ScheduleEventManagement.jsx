import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Calendar,
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Edit3,
  Trash2,
  Eye,
  X,
  User,
  Users,
  Award,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ShieldCheck,
  Check,
  QrCode
} from 'lucide-react';
import { api, getSelectedAdminHackathon } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import QrScannerModal from '../common/QrScannerModal';

export default function ScheduleEventManagement() {
  const { showToast, hackathon: currentHackathon } = useHackathon();

  // Data states
  const [events, setEvents] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [organizersList, setOrganizersList] = useState([]);
  const [guestsList, setGuestsList] = useState([]);
  const [participantsList, setParticipantsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Backend stats consumption (Rule 4)
  const [stats, setStats] = useState({
    total_items: 0,
    active_items: 0,
    inactive_items: 0
  });

  // Filters & search (Rule 6: Backend-driven filtering)
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newGuestModalOpen, setNewGuestModalOpen] = useState(false);

  // QR Scanner for recording events & check-ins
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanTargetMode, setScanTargetMode] = useState('auto_create'); // 'auto_create' | 'create_form' | 'edit_form' | 'checkin_event'
  const [checkinTargetEvent, setCheckinTargetEvent] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const getActiveHackathonId = () => {
    const selected = getSelectedAdminHackathon();
    if (selected && selected !== 'all') return selected;
    return currentHackathon?.id || '';
  };

  // Form state
  const initialForm = {
    schedule: '',
    title: '',
    description: '',
    personType: 'none', // 'guest' | 'organizer' | 'participant' | 'none'
    guest: '',
    organizer: '',
    participant: '',
    start_time: '',
    end_time: '',
    is_active: true
  };
  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);

  // Quick New Guest form state
  const [newGuestForm, setNewGuestForm] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  const [creatingGuest, setCreatingGuest] = useState(false);

  // Body scroll lock
  const isAnyModalOpen =
    createModalOpen ||
    editModalOpen ||
    viewModalOpen ||
    deleteModalOpen ||
    newGuestModalOpen ||
    qrScannerOpen;
  useBodyScrollLock(isAnyModalOpen);

  // QR Scan Result Handler: Records attendee or pre-fills event form
  const handleQrScanSuccess = async (attendee) => {
    if (!attendee) return;

    const personType = ['guest', 'organizer', 'participant'].includes(attendee.type)
      ? attendee.type
      : 'participant';

    // Resolve matching ID from auxiliary data
    let matchedId = attendee.id;
    if (personType === 'guest') {
      const found = guestsList.find(
        (g) => String(g.id) === String(attendee.id) || g.name?.toLowerCase() === attendee.name?.toLowerCase()
      );
      if (found) {
        matchedId = found.id;
      } else if (attendee.name) {
        // If guest not found, create new guest record automatically
        try {
          const newG = await api.guests.create({
            name: attendee.name,
            organization: attendee.organization || '',
            email: attendee.email || ''
          });
          if (newG?.id) {
            matchedId = newG.id;
            setGuestsList((prev) => [...prev, newG]);
          }
        } catch {
          // ignore error
        }
      }
    } else if (personType === 'organizer') {
      const found = organizersList.find(
        (o) =>
          String(o.id) === String(attendee.id) ||
          o.user?.full_name?.toLowerCase() === attendee.name?.toLowerCase() ||
          o.user?.email?.toLowerCase() === attendee.email?.toLowerCase()
      );
      if (found) matchedId = found.id;
    } else if (personType === 'participant') {
      const found = participantsList.find(
        (p) =>
          String(p.id) === String(attendee.id) ||
          p.name?.toLowerCase() === attendee.name?.toLowerCase() ||
          p.email?.toLowerCase() === attendee.email?.toLowerCase()
      );
      if (found) matchedId = found.id;
    }

    // MODE 1: Check-in / Record directly on existing event
    if (scanTargetMode === 'checkin_event' && checkinTargetEvent?.id) {
      try {
        const patchData = {
          [personType]: matchedId || attendee.id
        };
        await api.adminScheduleEvents.patch(checkinTargetEvent.id, patchData);
        showToast(`Recorded ${attendee.name} (${personType}) on "${checkinTargetEvent.title}"!`, 'success');
        setQrScannerOpen(false);
        setCheckinTargetEvent(null);
        await fetchEvents();
      } catch (err) {
        showToast(err?.message || 'Failed to record attendee on event.', 'error');
      }
      return;
    }

    // MODE 2: Inside Create Event Form
    if (scanTargetMode === 'create_form') {
      setCreateForm((prev) => ({
        ...prev,
        personType,
        guest: personType === 'guest' ? matchedId : '',
        organizer: personType === 'organizer' ? matchedId : '',
        participant: personType === 'participant' ? matchedId : '',
        title: prev.title || `Session with ${attendee.name}`
      }));
      showToast(`Scanned ${personType}: ${attendee.name}`, 'success');
      setQrScannerOpen(false);
      return;
    }

    // MODE 3: Inside Edit Event Form
    if (scanTargetMode === 'edit_form') {
      setEditForm((prev) => ({
        ...prev,
        personType,
        guest: personType === 'guest' ? matchedId : '',
        organizer: personType === 'organizer' ? matchedId : '',
        participant: personType === 'participant' ? matchedId : ''
      }));
      showToast(`Scanned ${personType}: ${attendee.name}`, 'success');
      setQrScannerOpen(false);
      return;
    }

    // MODE 4: Auto Create Event from Top-Bar Action
    const defaultScheduleId = schedulesList[0]?.id || '';
    setCreateForm({
      schedule: defaultScheduleId,
      title: `Event Session: ${attendee.name}`,
      description: `Official schedule session with ${attendee.name} (${attendee.role || personType}). Recorded via QR verification badge.`,
      personType,
      guest: personType === 'guest' ? matchedId : '',
      organizer: personType === 'organizer' ? matchedId : '',
      participant: personType === 'participant' ? matchedId : '',
      start_time: '',
      end_time: '',
      is_active: true
    });
    setQrScannerOpen(false);
    setCreateModalOpen(true);
    showToast(`Scanned ${personType.toUpperCase()}: ${attendee.name}. Pre-filled in Event form.`, 'success');
  };

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load auxiliary lists (schedules, organizers, guests, participants)
  const loadAuxiliaryData = async () => {
    const activeHackId = getActiveHackathonId();
    const queryParams = activeHackId ? { hackathon: activeHackId } : {};

    try {
      // Fetch schedules
      const schedData = await api.adminSchedules.getAll(queryParams).catch(() => []);
      const schedList = Array.isArray(schedData)
        ? schedData
        : Array.isArray(schedData?.results)
        ? schedData.results
        : [];
      setSchedulesList(schedList);

      // Fetch committee organizers
      const orgData = await api.hackathons.organizers.getAll(queryParams).catch(() => []);
      const orgList = Array.isArray(orgData)
        ? orgData
        : Array.isArray(orgData?.results)
        ? orgData.results
        : [];
      setOrganizersList(orgList);

      // Fetch guests
      const guestData = await api.guests.getAll(queryParams).catch(() => []);
      const gList = Array.isArray(guestData)
        ? guestData
        : Array.isArray(guestData?.results)
        ? guestData.results
        : [];
      setGuestsList(gList);

      // Fetch participants
      const partData = await api.participants.getAll(queryParams).catch(() => []);
      const pList = Array.isArray(partData)
        ? partData
        : Array.isArray(partData?.results)
        ? partData.results
        : [];
      setParticipantsList(pList);
    } catch (err) {
      console.warn('Failed to load auxiliary schedule event options:', err);
    }
  };

  // Fetch Schedule Events from backend
  const fetchEvents = async (customParams) => {
    setLoading(true);
    try {
      const params = customParams !== undefined ? customParams : (() => {
        const p = {};
        const activeHackId = getActiveHackathonId();
        if (activeHackId) p.hackathon = activeHackId;
        if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
        if (scheduleFilter !== 'all') p.schedule = scheduleFilter;
        if (activeFilter === 'active') p.is_active = 'true';
        if (activeFilter === 'inactive') p.is_active = 'false';
        return p;
      })();

      const data = await api.adminScheduleEvents.getAll(params);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : data?.data || [];

      setEvents(list);

      // Consume backend stats (Rule 4)
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
      console.warn('Failed to load schedule events:', err);
      showToast(err?.message || 'Failed to load schedule events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load & search/filter watcher
  useEffect(() => {
    const params = {};
    const activeHackId = getActiveHackathonId();
    if (activeHackId) params.hackathon = activeHackId;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (scheduleFilter !== 'all') params.schedule = scheduleFilter;
    if (activeFilter === 'active') params.is_active = 'true';
    if (activeFilter === 'inactive') params.is_active = 'false';

    fetchEvents(params);
  }, [debouncedSearch, scheduleFilter, activeFilter]);

  // Reload auxiliary data when hackathon selection changes
  useEffect(() => {
    loadAuxiliaryData();
    const handleHackathonChange = () => {
      loadAuxiliaryData();
      fetchEvents();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    return () => window.removeEventListener('bic_admin_hackathon_changed', handleHackathonChange);
  }, [currentHackathon?.id]);

  // Format datetime for datetime-local input
  const formatForInput = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const formatDisplayDate = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  // Modal Open Handlers
  const handleOpenCreate = () => {
    const defaultSched = schedulesList[0]?.id || '';
    setCreateForm({
      ...initialForm,
      schedule: defaultSched
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setSelectedEvent(evt);
    let pType = 'none';
    if (evt.guest) pType = 'guest';
    else if (evt.organizer) pType = 'organizer';
    else if (evt.participant) pType = 'participant';

    setEditForm({
      schedule: evt.schedule || '',
      title: evt.title || '',
      description: evt.description || '',
      personType: pType,
      guest: evt.guest || '',
      organizer: evt.organizer || '',
      participant: evt.participant || '',
      start_time: formatForInput(evt.start_time),
      end_time: formatForInput(evt.end_time),
      is_active: evt.is_active !== false
    });
    setEditModalOpen(true);
  };

  const handleOpenView = (evt) => {
    setSelectedEvent(evt);
    setViewModalOpen(true);
  };

  const handleOpenDelete = (evt) => {
    setSelectedEvent(evt);
    setDeleteModalOpen(true);
  };

  // Quick Create Guest
  const handleQuickCreateGuest = async (e, isEditing = false) => {
    e.preventDefault();
    if (!newGuestForm.name.trim()) {
      showToast('Please enter the guest name.', 'error');
      return;
    }
    const activeHackId = getActiveHackathonId();
    setCreatingGuest(true);
    try {
      const payload = {
        name: newGuestForm.name.trim(),
        email: newGuestForm.email.trim() || null,
        phone_number: newGuestForm.phone_number.trim() || null,
        hackathon: activeHackId || null
      };
      const res = await api.guests.create(payload);
      showToast('Guest created successfully!', 'success');
      // Append to guests list
      setGuestsList((prev) => [res, ...prev]);
      // Auto-select this guest in form
      if (isEditing) {
        setEditForm((prev) => ({ ...prev, guest: res.id, personType: 'guest' }));
      } else {
        setCreateForm((prev) => ({ ...prev, guest: res.id, personType: 'guest' }));
      }
      setNewGuestForm({ name: '', email: '', phone_number: '' });
      setNewGuestModalOpen(false);
    } catch (err) {
      console.warn('Failed to create guest:', err);
      showToast(err?.message || 'Failed to create guest.', 'error');
    } finally {
      setCreatingGuest(false);
    }
  };

  // CREATE Event
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      showToast('Please provide an event title.', 'error');
      return;
    }
    if (!createForm.schedule) {
      showToast('Please select a parent schedule.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        schedule: createForm.schedule,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        is_active: Boolean(createForm.is_active),
        guest: createForm.personType === 'guest' && createForm.guest ? createForm.guest : null,
        organizer: createForm.personType === 'organizer' && createForm.organizer ? createForm.organizer : null,
        participant: createForm.personType === 'participant' && createForm.participant ? createForm.participant : null
      };

      if (createForm.start_time) {
        payload.start_time = new Date(createForm.start_time).toISOString();
      }
      if (createForm.end_time) {
        payload.end_time = new Date(createForm.end_time).toISOString();
      }

      await api.adminScheduleEvents.create(payload);
      showToast('Schedule event created successfully!', 'success');
      setCreateModalOpen(false);
      await fetchEvents();
    } catch (err) {
      console.warn('Failed to create schedule event:', err);
      showToast(err?.message || 'Failed to create schedule event.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // EDIT Event
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent?.id) return;
    if (!editForm.title.trim()) {
      showToast('Please provide an event title.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        schedule: editForm.schedule,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        is_active: Boolean(editForm.is_active),
        guest: editForm.personType === 'guest' && editForm.guest ? editForm.guest : null,
        organizer: editForm.personType === 'organizer' && editForm.organizer ? editForm.organizer : null,
        participant: editForm.personType === 'participant' && editForm.participant ? editForm.participant : null
      };

      if (editForm.start_time) {
        payload.start_time = new Date(editForm.start_time).toISOString();
      }
      if (editForm.end_time) {
        payload.end_time = new Date(editForm.end_time).toISOString();
      }

      await api.adminScheduleEvents.patch(selectedEvent.id, payload);
      showToast('Schedule event updated successfully!', 'success');
      setEditModalOpen(false);
      await fetchEvents();
    } catch (err) {
      console.warn('Failed to update schedule event:', err);
      showToast(err?.message || 'Failed to update schedule event.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE Event
  const handleDeleteSubmit = async () => {
    if (!selectedEvent?.id) return;
    setSubmitting(true);
    try {
      await api.adminScheduleEvents.delete(selectedEvent.id);
      showToast('Schedule event deleted successfully.', 'success');
      setDeleteModalOpen(false);
      await fetchEvents();
    } catch (err) {
      console.warn('Failed to delete schedule event:', err);
      showToast(err?.message || 'Failed to delete schedule event.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to render recorder badge
  const renderRecordedPersonBadge = (evt) => {
    if (evt.guest_name || evt.guest) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
          <Award className="w-3.5 h-3.5 text-purple-600" />
          <span>Guest: {evt.guest_name || 'Assigned'}</span>
        </span>
      );
    }
    if (evt.organizer_name || evt.organizer) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Organizer: {evt.organizer_name || 'Assigned'}</span>
        </span>
      );
    }
    if (evt.participant_name || evt.participant) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <User className="w-3.5 h-3.5 text-emerald-600" />
          <span>Participant: {evt.participant_name || 'Assigned'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-normal bg-slate-100 text-slate-500">
        <span>No speaker assigned</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Standard Flex Header (Rule 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Schedule Events
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage specific sub-events, workshop sessions, keynotes, guest speakers, organizers, and participants.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setScanTargetMode('auto_create');
              setQrScannerOpen(true);
            }}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-800 hover:border-[#ea580c] hover:bg-orange-50 hover:text-[#ea580c] shadow-xs transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#ea580c]" />
            <span>Scan QR to Record Event</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule Event</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (Rule 4: Backend Stats Consumption) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Events */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Events
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats.total_items ?? events.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <CalendarClock className="w-5 h-5" />
          </div>
        </div>

        {/* Active Events */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Events
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {stats.active_items ?? events.filter((e) => e.is_active !== false).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Inactive Events */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Inactive Events
            </p>
            <p className="text-2xl font-bold text-slate-600 mt-1">
              {stats.inactive_items ?? events.filter((e) => e.is_active === false).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, description..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-800"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Schedule Dropdown */}
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-slate-700 font-medium"
          >
            <option value="all">All Schedules</option>
            {schedulesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-slate-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Loading schedule events from backend...
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No schedule events found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || scheduleFilter !== 'all' || activeFilter !== 'all'
              ? 'No events match your current filter parameters. Try clearing your search.'
              : 'No sub-events or sessions have been recorded yet. Click below to add one.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Event & Description</th>
                  <th className="py-3 px-4">Parent Schedule</th>
                  <th className="py-3 px-4">Speaker / Recorded Person</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Event Title & Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {evt.title}
                      </div>
                      {evt.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-700">
                      <div className="inline-flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt.schedule_title || 'Schedule'}</span>
                      </div>
                    </td>

                    {/* Recorded Person / Speaker */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderRecordedPersonBadge(evt)}
                    </td>

                    {/* Time Window */}
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11px] text-slate-700">
                          {formatDisplayDate(evt.start_time)}
                        </span>
                        {evt.end_time && (
                          <span className="font-mono text-[11px] text-slate-400">
                            to {formatDisplayDate(evt.end_time)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status (Rule 9: Solid static indicators) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {evt.is_active !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckinTargetEvent(evt);
                            setScanTargetMode('checkin_event');
                            setQrScannerOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#ea580c] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Scan QR to Record Attendance / Speaker"
                        >
                          <QrCode className="w-4 h-4 text-[#ea580c]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenView(evt)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(evt)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {events.length} event{events.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-orange-500/30 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.schedule_title || 'Schedule'}</span>
                  </span>
                  {evt.is_active !== false ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Inactive</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2 hover:text-orange-600 transition-colors">
                  {evt.title}
                </h3>
                {evt.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                    {evt.description}
                  </p>
                )}

                <div className="mt-3">
                  {renderRecordedPersonBadge(evt)}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDisplayDate(evt.start_time)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCheckinTargetEvent(evt);
                    setScanTargetMode('checkin_event');
                    setQrScannerOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#ea580c] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                  title="Scan QR to Record Attendance / Speaker"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenView(evt)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(evt)}
                  className="px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDelete(evt)}
                  className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Schedule Event</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record a sub-event session, keynote, workshop, or speaker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Parent Schedule */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Schedule <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={createForm.schedule}
                  onChange={(e) => setCreateForm({ ...createForm, schedule: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                >
                  <option value="" disabled>Select a schedule...</option>
                  {schedulesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.type === 'pre_event' ? 'Pre-Event' : 'Hackathon'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Keynote on Agentic AI Systems"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
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
                  placeholder="Optional session agenda, notes, or speaker details..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                />
              </div>

              {/* Speaker / Recorded Person Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Record Person / Speaker Role
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setScanTargetMode('create_form');
                      setQrScannerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-[#ea580c] hover:bg-orange-100 border border-orange-200/80 transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Attendee QR</span>
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'guest', label: 'Guest Speaker' },
                    { id: 'organizer', label: 'Organizer' },
                    { id: 'participant', label: 'Participant' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setCreateForm({
                          ...createForm,
                          personType: tab.id,
                          guest: tab.id === 'guest' ? createForm.guest : '',
                          organizer: tab.id === 'organizer' ? createForm.organizer : '',
                          participant: tab.id === 'participant' ? createForm.participant : ''
                        })
                      }
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        createForm.personType === tab.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-selector based on personType */}
              {createForm.personType === 'guest' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-900">
                      Select Guest
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewGuestModalOpen(true)}
                      className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                    >
                      + Quick Add New Guest
                    </button>
                  </div>
                  <select
                    value={createForm.guest}
                    onChange={(e) => setCreateForm({ ...createForm, guest: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-800"
                  >
                    <option value="">-- Select a registered guest --</option>
                    {guestsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.email ? `(${g.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.personType === 'organizer' && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 space-y-2">
                  <label className="text-xs font-semibold text-blue-900">
                    Select Committee Organizer
                  </label>
                  <select
                    value={createForm.organizer}
                    onChange={(e) => setCreateForm({ ...createForm, organizer: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  >
                    <option value="">-- Select an organizer --</option>
                    {organizersList.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} {o.role ? `• ${o.role}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.personType === 'participant' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 space-y-2">
                  <label className="text-xs font-semibold text-emerald-900">
                    Select Participant
                  </label>
                  <select
                    value={createForm.participant}
                    onChange={(e) => setCreateForm({ ...createForm, participant: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  >
                    <option value="">-- Select a participant --</option>
                    {participantsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.email ? `(${p.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.start_time}
                    onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.end_time}
                    onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create_is_active"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="create_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Active (visible on schedule views)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-fade-in my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Schedule Event</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update event details, parent schedule, speaker, or timings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {/* Parent Schedule */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Schedule <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editForm.schedule}
                  onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                >
                  <option value="" disabled>Select a schedule...</option>
                  {schedulesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.type === 'pre_event' ? 'Pre-Event' : 'Hackathon'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                />
              </div>

              {/* Speaker / Recorded Person Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Record Person / Speaker Role
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setScanTargetMode('edit_form');
                      setQrScannerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-[#ea580c] hover:bg-orange-100 border border-orange-200/80 transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Attendee QR</span>
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'guest', label: 'Guest Speaker' },
                    { id: 'organizer', label: 'Organizer' },
                    { id: 'participant', label: 'Participant' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setEditForm({
                          ...editForm,
                          personType: tab.id,
                          guest: tab.id === 'guest' ? editForm.guest : '',
                          organizer: tab.id === 'organizer' ? editForm.organizer : '',
                          participant: tab.id === 'participant' ? editForm.participant : ''
                        })
                      }
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        editForm.personType === tab.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-selector based on personType */}
              {editForm.personType === 'guest' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-900">
                      Select Guest
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewGuestModalOpen(true)}
                      className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                    >
                      + Quick Add New Guest
                    </button>
                  </div>
                  <select
                    value={editForm.guest}
                    onChange={(e) => setEditForm({ ...editForm, guest: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-800"
                  >
                    <option value="">-- Select a registered guest --</option>
                    {guestsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.email ? `(${g.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editForm.personType === 'organizer' && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 space-y-2">
                  <label className="text-xs font-semibold text-blue-900">
                    Select Committee Organizer
                  </label>
                  <select
                    value={editForm.organizer}
                    onChange={(e) => setEditForm({ ...editForm, organizer: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  >
                    <option value="">-- Select an organizer --</option>
                    {organizersList.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} {o.role ? `• ${o.role}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editForm.personType === 'participant' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 space-y-2">
                  <label className="text-xs font-semibold text-emerald-900">
                    Select Participant
                  </label>
                  <select
                    value={editForm.participant}
                    onChange={(e) => setEditForm({ ...editForm, participant: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  >
                    <option value="">-- Select a participant --</option>
                    {participantsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.email ? `(${p.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="edit_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Active (visible on schedule views)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK NEW GUEST MODAL */}
      {newGuestModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Add New Guest</h4>
              <button
                type="button"
                onClick={() => setNewGuestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => handleQuickCreateGuest(e, editModalOpen)} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guest Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGuestForm.name}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, name: e.target.value })}
                  placeholder="e.g. Dr. Alex Morgan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newGuestForm.email}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })}
                  placeholder="alex.morgan@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newGuestForm.phone_number}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, phone_number: e.target.value })}
                  placeholder="+977 9800000000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewGuestModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGuest}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
                >
                  {creatingGuest ? 'Creating...' : 'Save Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                Schedule Event Details
              </span>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p className="text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Parent Schedule:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEvent.schedule_title || 'Assigned Schedule'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Recorded Speaker / Member:</span>
                  <div>{renderRecordedPersonBadge(selectedEvent)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEvent.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Start Time:</span>
                  <span className="font-mono text-slate-800">{formatDisplayDate(selectedEvent.start_time)}</span>
                </div>
                {selectedEvent.end_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">End Time:</span>
                    <span className="font-mono text-slate-800">{formatDisplayDate(selectedEvent.end_time)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewModalOpen(false);
                    handleOpenEdit(selectedEvent);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Schedule Event?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{selectedEvent.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL FOR RECORDING EVENT */}
      <QrScannerModal
        isOpen={qrScannerOpen}
        onClose={() => {
          setQrScannerOpen(false);
          setCheckinTargetEvent(null);
        }}
        onScanSuccess={handleQrScanSuccess}
        title={
          scanTargetMode === 'checkin_event' && checkinTargetEvent
            ? `Record Attendee: ${checkinTargetEvent.title}`
            : 'Scan QR to Record Event'
        }
        subtitle={
          scanTargetMode === 'checkin_event' && checkinTargetEvent
            ? `Scan credential pass to record attendee on "${checkinTargetEvent.title}"`
            : 'Scan attendee pass to auto-fill speaker and record schedule event'
        }
      />
    </div>
  );
}
