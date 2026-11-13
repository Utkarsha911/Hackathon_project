import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { api, getMediaUrl, getUserAvatarUrl, DEFAULT_USER_AVATAR, getSelectedAdminHackathon, setSelectedAdminHackathon, getAdminUser } from '../../services/api';
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
  Layers,
  Image as ImageIcon,
  ChevronRight,
  X,
  FileText,
  Upload,
  Check,
  Flame,
  LayoutGrid,
  ListFilter,
  Award,
  UserCheck,
  Mail,
  Hash,
  Building2,
  QrCode,
  Shirt
} from 'lucide-react';
import PrizeManagement from './PrizeManagement';
import TermsManagement from './TermsManagement';
import FaqManagement from './FaqManagement';
import ContactManagement from './ContactManagement';
import QrBadgeModal from '../common/QrBadgeModal';
import ModalPortal from '../common/ModalPortal';

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
  is_current: true,
  is_tshirt_included: false,
  registration_start_date: getTodayDate(),
  registration_end_date: getTodayDate(),
  registration_fee: 0,
  minimum_team_size: 1,
  maximum_team_size: 4,
  year: getTodayDate(),
  banner_image: null
};

export default function HackathonManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'hackathons';
  const { showToast, hackathon: currentHackathon } = useHackathon();

  // Permission resolution
  const currentUser = getAdminUser();
  const isSuperOrStaff = Boolean(
    currentUser?.is_superuser === true ||
    currentUser?.is_staff === true ||
    ['admin', 'administrator', 'super admin'].includes((currentUser?.role || '').toLowerCase())
  );

  const checkHasPermission = (scopes) => {
    if (isSuperOrStaff) return true;
    const userGroupsList = Array.isArray(currentUser?.groups) ? currentUser.groups : [];
    if (!userGroupsList || userGroupsList.length === 0) return false;
    const scopeList = (Array.isArray(scopes) ? scopes : [scopes]).map((s) => s.toLowerCase());

    for (const group of userGroupsList) {
      if (!group || typeof group !== 'object') continue;
      if (group.permissions_name && typeof group.permissions_name === 'object') {
        for (const [category, perms] of Object.entries(group.permissions_name)) {
          const catLower = category.toLowerCase();
          if (scopeList.includes(catLower)) return true;
          if (Array.isArray(perms)) {
            for (const perm of perms) {
              const pStr = (perm?.codename || perm?.name || '').toLowerCase();
              if (scopeList.some((s) => pStr === s || pStr.endsWith(`_${s}`))) return true;
            }
          }
        }
      }
    }
    return false;
  };

  const canAccessHackathons = checkHasPermission(['hackathon']);
  const canAccessOrganizers = checkHasPermission(['organizer']);
  const canAccessPrizes = isSuperOrStaff || checkHasPermission(['prizes']);
  const canAccessFaqs = isSuperOrStaff || checkHasPermission(['faq']);
  const canAccessContacts = isSuperOrStaff || checkHasPermission(['contact']);
  const canAccessTerms = isSuperOrStaff || checkHasPermission(['participationterms']);
  const canAccessHackathonCrm = canAccessPrizes || canAccessFaqs || canAccessContacts || canAccessTerms;

  // Auto redirect unauthorized or relocated tab requests
  useEffect(() => {
    if (activeTab === 'teams') {
      navigate('/admin-control-site/teams', { replace: true });
    } else if (activeTab === 'guests') {
      navigate('/admin-control-site/participants?tab=guests', { replace: true });
    } else if (activeTab === 'prizes' && !canAccessPrizes) {
      setSearchParams({ tab: canAccessHackathons ? 'hackathons' : 'organizers' }, { replace: true });
    } else if (activeTab === 'faqs' && !canAccessFaqs) {
      setSearchParams({ tab: canAccessHackathons ? 'hackathons' : 'organizers' }, { replace: true });
    } else if (activeTab === 'contacts' && !canAccessContacts) {
      setSearchParams({ tab: canAccessHackathons ? 'hackathons' : 'organizers' }, { replace: true });
    } else if (activeTab === 'terms' && !canAccessTerms) {
      setSearchParams({ tab: canAccessHackathons ? 'hackathons' : 'organizers' }, { replace: true });
    } else if (activeTab === 'organizers' && !canAccessOrganizers && canAccessHackathons) {
      setSearchParams({ tab: 'hackathons' }, { replace: true });
    } else if (activeTab === 'hackathons' && !canAccessHackathons && canAccessOrganizers) {
      setSearchParams({ tab: 'organizers' }, { replace: true });
    }
  }, [activeTab, canAccessHackathons, canAccessOrganizers, canAccessPrizes, canAccessFaqs, canAccessContacts, canAccessTerms, canAccessHackathonCrm, setSearchParams, navigate]);

  // Primary data state (Hackathons)
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

  // Modals state (Hackathons)
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

  // -------------------------------------------------------------
  // ORGANIZERS STATE & MODALS
  // -------------------------------------------------------------
  const [organizers, setOrganizers] = useState([]);
  const [organizersStats, setOrganizersStats] = useState({ total_items: 0, active_items: 0, inactive_items: 0 });
  const [organizersLoading, setOrganizersLoading] = useState(false);
  const [organizerSearchInput, setOrganizerSearchInput] = useState('');
  const [appliedOrganizerSearch, setAppliedOrganizerSearch] = useState('');
  const [organizerHackathonFilter, setOrganizerHackathonFilter] = useState('');

  // Dropdown lists for Add/Edit Organizer modal
  const [availableUsers, setAvailableUsers] = useState([]);
  const [, setLoadingUsers] = useState(false);
  const [availableHackathons, setAvailableHackathons] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Modals state (Organizers)
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgForm, setOrgForm] = useState({
    user: '',
    hackathon: '',
    designation: '',
    order: 0,
    department: '',
  });
  const [submittingOrg, setSubmittingOrg] = useState(false);
  const [viewingOrg, setViewingOrg] = useState(null);
  const [deletingOrg, setDeletingOrg] = useState(null);
  const [submittingDeleteOrg, setSubmittingDeleteOrg] = useState(false);

  // QR Credential Badge Modal
  const [qrAttendee, setQrAttendee] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Background scroll lock when any modal is open
  const isAnyModalOpen = Boolean(
    isCreateOpen ||
      viewingHackathon ||
      editingHackathon ||
      deletingHackathon ||
      isOrgModalOpen ||
      viewingOrg ||
      deletingOrg ||
      qrModalOpen
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

      // Validate selected admin hackathon against live list (clear stale IDs from previous databases)
      const stored = getSelectedAdminHackathon();
      const currentH = list.find((h) => h.is_current === true);
      const exists = list.some((h) => h.id === stored);
      if (stored && !exists) {
        const nextId = currentH?.id || list[0]?.id || '';
        setSelectedAdminHackathon(nextId);
      }
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

  // -------------------------------------------------------------
  // ORGANIZERS FETCH & HANDLERS
  // -------------------------------------------------------------
  const fetchAvailableUsers = async () => {
    if (availableUsers.length > 0) return;
    setLoadingUsers(true);
    try {
      const res = await api.users.getOrganizers({ page_size: 200 });
      const list = Array.isArray(res) ? res : res?.results || [];
      setAvailableUsers(list);
    } catch (err) {
      console.warn('Failed to load users for selector from /api/v1/users/organizers/:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAvailableHackathons = async () => {
    try {
      const res = await api.hackathons.getAll();
      const list = Array.isArray(res) ? res : res?.results || [];
      setAvailableHackathons(list);
    } catch (err) {
      console.warn('Failed to load hackathons list:', err);
    }
  };

  const fetchAvailableDepartments = async () => {
    try {
      const res = await api.departments.getAll();
      const list = Array.isArray(res) ? res : res?.results || [];
      setAvailableDepartments(list);
    } catch (err) {
      console.warn('Failed to load departments list in HackathonManagement:', err);
    }
  };

  const fetchOrganizers = async (overrides = {}) => {
    setOrganizersLoading(true);
    try {
      const search = overrides.search !== undefined ? overrides.search : appliedOrganizerSearch;
      const hackathonId = overrides.hackathon !== undefined ? overrides.hackathon : organizerHackathonFilter;

      const params = {};
      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (hackathonId && hackathonId !== 'all') {
        params.hackathon = hackathonId;
      }

      const res = await api.hackathons.organizers.getAll(params);
      const list = Array.isArray(res) ? res : res?.results || [];
      const computedStats = res?.stats || {
        total_items: res?.count ?? list.length,
        active_items: list.filter((o) => o?.user?.is_active !== false).length,
        inactive_items: list.filter((o) => o?.user?.is_active === false).length
      };

      setOrganizers(list);
      setOrganizersStats(computedStats);
    } catch (err) {
      console.warn('Failed to fetch organizers:', err);
      showToast(err?.message || 'Failed to load hackathon organizers.', 'error');
    } finally {
      setOrganizersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'organizers') {
      fetchOrganizers();
      fetchAvailableHackathons();
      fetchAvailableDepartments();
    }
  }, [activeTab, appliedOrganizerSearch, organizerHackathonFilter]);

  useEffect(() => {
    const handleGlobalHackathonChange = () => {
      if (activeTab === 'organizers') {
        fetchOrganizers();
      } else {
        fetchHackathons(true);
      }
    };
    window.addEventListener('bic_admin_hackathon_changed', handleGlobalHackathonChange);
    return () => {
      window.removeEventListener('bic_admin_hackathon_changed', handleGlobalHackathonChange);
    };
  }, [activeTab]);

  const getHackathonTitle = (hackathonIdOrObj) => {
    if (!hackathonIdOrObj) return '—';
    if (typeof hackathonIdOrObj === 'object' && hackathonIdOrObj.title) {
      return `${hackathonIdOrObj.title} ${hackathonIdOrObj.version ? `(${hackathonIdOrObj.version})` : ''}`.trim();
    }
    const id = typeof hackathonIdOrObj === 'string' ? hackathonIdOrObj : hackathonIdOrObj.id;
    const found = availableHackathons.find((h) => h.id === id) || hackathons.find((h) => h.id === id);
    if (found) {
      return `${found.title} ${found.version ? `(${found.version})` : ''}`.trim();
    }
    return id ? `${id.substring(0, 8)}...` : '—';
  };

  const handleOrganizerSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedOrganizerSearch(organizerSearchInput);
  };

  const handleClearOrganizerSearch = () => {
    setOrganizerSearchInput('');
    setAppliedOrganizerSearch('');
  };

  const handleOpenCreateOrg = () => {
    const activeHId = getSelectedAdminHackathon();
    const defaultHackathon =
      activeHId && activeHId !== 'all'
        ? activeHId
        : currentHackathon?.id || availableHackathons[0]?.id || hackathons[0]?.id || '';

    setEditingOrg(null);
    setOrgForm({
      user: '',
      hackathon: defaultHackathon,
      designation: '',
      order: (organizers?.length || 0) + 1,
      department: '',
    });
    fetchAvailableUsers();
    fetchAvailableHackathons();
    fetchAvailableDepartments();
    setIsOrgModalOpen(true);
  };

  const handleOpenEditOrg = (org) => {
    setEditingOrg(org);
    setOrgForm({
      user: org.user?.id || org.user || '',
      hackathon: typeof org.hackathon === 'object' ? org.hackathon?.id : org.hackathon || '',
      designation: org.designation || '',
      order: org.order ?? 0,
      department: typeof org.department === 'object' ? org.department?.id : org.department || '',
    });
    fetchAvailableUsers();
    fetchAvailableHackathons();
    fetchAvailableDepartments();
    setIsOrgModalOpen(true);
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    if (!orgForm.user) {
      showToast('Please select a user account.', 'error');
      return;
    }
    if (!orgForm.hackathon) {
      showToast('Please select a hackathon edition.', 'error');
      return;
    }
    if (!orgForm.designation.trim()) {
      showToast('Please provide an organizer designation.', 'error');
      return;
    }

    setSubmittingOrg(true);
    try {
      const payload = {
        user: orgForm.user,
        user_id: orgForm.user,
        hackathon: orgForm.hackathon,
        designation: orgForm.designation.trim(),
        order: parseInt(orgForm.order, 10) || 0,
        department: orgForm.department || null,
      };

      if (editingOrg) {
        await api.hackathons.organizers.update(editingOrg.id, payload);
        showToast('Organizer updated successfully.', 'success');
      } else {
        await api.hackathons.organizers.create(payload);
        showToast('Organizer added successfully.', 'success');
      }

      setIsOrgModalOpen(false);
      setEditingOrg(null);
      fetchOrganizers();
    } catch (err) {
      console.error('Error saving organizer:', err);
      showToast(err?.message || 'Failed to save organizer.', 'error');
    } finally {
      setSubmittingOrg(false);
    }
  };

  const handleDeleteOrgSubmit = async () => {
    if (!deletingOrg) return;
    setSubmittingDeleteOrg(true);
    try {
      await api.hackathons.organizers.delete(deletingOrg.id);
      showToast('Organizer removed successfully.', 'success');
      setDeletingOrg(null);
      fetchOrganizers();
    } catch (err) {
      console.error('Error deleting organizer:', err);
      showToast(err?.message || 'Failed to delete organizer.', 'error');
    } finally {
      setSubmittingDeleteOrg(false);
    }
  };

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
      is_current: hackathon.is_current !== undefined ? hackathon.is_current : true,
      is_tshirt_included: Boolean(hackathon.is_tshirt_included),
      registration_start_date: ensureDateFormat(hackathon.registration_start_date || hackathon.registration_startdate, ''),
      registration_end_date: ensureDateFormat(hackathon.registration_end_date || hackathon.registration_enddate, ''),
      registration_fee: hackathon.registration_fee ?? 0,
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
      if (regStartFormatted) {
        formData.append('registration_start_date', regStartFormatted);
        formData.append('registration_startdate', regStartFormatted);
      }

      const regEndFormatted = ensureDateFormat(createForm.registration_end_date);
      if (regEndFormatted) {
        formData.append('registration_end_date', regEndFormatted);
        formData.append('registration_enddate', regEndFormatted);
      }

      const yearFormatted =
        ensureDateFormat(createForm.year) ||
        startDateFormatted ||
        getTodayDate();
      formData.append('year', yearFormatted);

      if (createForm.event_time) formData.append('event_time', createForm.event_time.trim());
      if (createForm.theme) formData.append('theme', createForm.theme.trim());
      if (createForm.rules) formData.append('rules', createForm.rules.trim());
      if (createForm.status) formData.append('status', createForm.status);
      formData.append('is_current', createForm.is_current !== false ? 'true' : 'false');
      formData.append('is_tshirt_included', createForm.is_tshirt_included ? 'true' : 'false');
      formData.append('minimum_team_size', Number(createForm.minimum_team_size) || 1);
      formData.append('maximum_team_size', Number(createForm.maximum_team_size) || 4);
      formData.append('registration_fee', Number(createForm.registration_fee) || 0);

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
      if (regStartFormatted) {
        formData.append('registration_start_date', regStartFormatted);
        formData.append('registration_startdate', regStartFormatted);
      }

      const regEndFormatted = ensureDateFormat(editForm.registration_end_date);
      if (regEndFormatted) {
        formData.append('registration_end_date', regEndFormatted);
        formData.append('registration_enddate', regEndFormatted);
      }

      const yearFormatted =
        ensureDateFormat(editForm.year) ||
        startDateFormatted ||
        ensureDateFormat(editingHackathon.year, getTodayDate());
      formData.append('year', yearFormatted);

      if (editForm.event_time) formData.append('event_time', editForm.event_time.trim());
      if (editForm.theme) formData.append('theme', editForm.theme.trim());
      if (editForm.rules) formData.append('rules', editForm.rules.trim());
      if (editForm.status) formData.append('status', editForm.status);
      if (editForm.is_current !== undefined) {
        formData.append('is_current', editForm.is_current ? 'true' : 'false');
      }
      if (editForm.is_tshirt_included !== undefined) {
        formData.append('is_tshirt_included', editForm.is_tshirt_included ? 'true' : 'false');
      }
      formData.append('minimum_team_size', Number(editForm.minimum_team_size) || 1);
      formData.append('maximum_team_size', Number(editForm.maximum_team_size) || 4);
      formData.append('registration_fee', Number(editForm.registration_fee) || 0);

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
      {activeTab === 'teams' ? (
        <Navigate to="/admin-control-site/teams" replace />
      ) : activeTab === 'guests' ? (
        <Navigate to="/admin-control-site/participants?tab=guests" replace />
      ) : activeTab === 'organizers' ? (
        <div className="space-y-6">
          {/* Header with Title and Add Organizer Button (Rule 1) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Hackathon Organizers
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#c2410c] border border-orange-200">
                  {organizersStats.total_items ?? organizers.length} Assigned
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage committee leads, officers, and event coordinators assigned to platform hackathons
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenCreateOrg}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
                style={{ backgroundColor: '#ea580c' }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Organizer</span>
              </button>
            </div>
          </div>

          {/* Stats Cards (Rule 4) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Total Organizers */}
            <div className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
                  Organizers
                </div>
                <div className="text-lg sm:text-3xl font-extrabold text-slate-900 mt-0.5 sm:mt-1 truncate">
                  {organizersStats.total_items ?? organizers.length}
                </div>
                <div className="hidden sm:flex text-[11px] text-slate-400 mt-1 items-center gap-1">
                  <Award className="w-3 h-3 text-[#ea580c]" />
                  <span>Committee members in database</span>
                </div>
              </div>
              <div
                className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0"
                style={{ backgroundColor: '#fff3ef' }}
              >
                <Award className="w-3.5 h-3.5 sm:w-6 sm:h-6" style={{ color: '#ea580c' }} />
              </div>
            </div>

            {/* Active Accounts */}
            <div className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
                  Active
                </div>
                <div className="text-lg sm:text-3xl font-extrabold text-emerald-600 mt-0.5 sm:mt-1 truncate">
                  {organizersStats.active_items ?? 0}
                </div>
                <div className="hidden sm:flex text-[11px] text-slate-400 mt-1 items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Enabled user profiles</span>
                </div>
              </div>
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>

            {/* Inactive Accounts */}
            <div className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
                  Inactive
                </div>
                <div className="text-lg sm:text-3xl font-extrabold text-slate-700 mt-0.5 sm:mt-1 truncate">
                  {organizersStats.inactive_items ?? 0}
                </div>
                <div className="hidden sm:flex text-[11px] text-slate-400 mt-1 items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-slate-400" />
                  <span>Pending or deactivated profiles</span>
                </div>
              </div>
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-slate-100 flex items-center justify-center shadow-inner shrink-0 border border-slate-200">
                <AlertCircle className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Search & Hackathon Filter Bar (Rule 6: Backend-driven filtering) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <form onSubmit={handleOrganizerSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={organizerSearchInput}
                onChange={(e) => setOrganizerSearchInput(e.target.value)}
                placeholder="Search organizers by name, email, designation... (Press Enter)"
                className="w-full pl-9.5 pr-20 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {organizerSearchInput && (
                  <button
                    type="button"
                    onClick={handleClearOrganizerSearch}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white transition cursor-pointer shadow-xs"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px]">
                <select
                  value={organizerHackathonFilter}
                  onChange={(e) => setOrganizerHackathonFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                >
                  <option value="">All Hackathon Editions</option>
                  {availableHackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title} {h.version ? `(${h.version})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table / Empty State / Loading State */}
          {organizersLoading && organizers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="w-8 h-8 border-2 border-orange-200 border-t-[#ea580c] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-500">
                Loading organizers from /api/v1/hackathons/organizers/...
              </p>
            </div>
          ) : organizers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Organizers Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                {appliedOrganizerSearch || organizerHackathonFilter
                  ? 'No organizers match the applied filter criteria.'
                  : 'No organizers have been assigned to hackathon editions yet.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateOrg}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition"
                style={{ backgroundColor: '#ea580c' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Organizer</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 w-20">Order</th>
                      <th className="py-3 px-4">Organizer</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Hackathon Edition</th>
                      <th className="py-3 px-4">User Status</th>
                      <th className="py-3 px-4 text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {organizers.map((org) => {
                      const user = org.user || {};
                      const avatarUrl = getUserAvatarUrl(user.profile_picture);
                      const displayName =
                        user.full_name ||
                        `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                        user.email ||
                        'Unnamed User';
                      const initial = (user.first_name?.[0] || user.full_name?.[0] || user.email?.[0] || 'O').toUpperCase();

                      return (
                        <tr key={org.id} className="hover:bg-slate-50/60 transition group">
                          {/* Order */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              #{org.order ?? 0}
                            </span>
                          </td>

                          {/* Organizer Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0 bg-slate-50"
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_USER_AVATAR;
                                }}
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                                  <span>{displayName}</span>
                                  {user.is_verified && (
                                    <span title="Verified user">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate">
                                  {user.email || 'No email'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Designation */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-[#c2410c] border border-orange-100">
                              <Award className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                              <span>{org.designation || 'Organizer'}</span>
                            </span>
                          </td>

                          {/* Department */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {org.department_name || (typeof org.department === 'object' ? org.department?.name || org.department?.title : null) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{org.department_name || (typeof org.department === 'object' ? org.department?.name || org.department?.title : null)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">—</span>
                            )}
                          </td>

                          {/* Hackathon Edition */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">
                              {getHackathonTitle(org.hackathon)}
                            </div>
                          </td>

                          {/* User Status */}
                          <td className="py-3.5 px-4">
                            {user.is_active !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setQrAttendee({
                                    id: org.id,
                                    type: 'organizer',
                                    name: displayName,
                                    role: org.designation || 'Organizer',
                                    email: user.email,
                                    phone: user.phone_number,
                                    department: org.department_name,
                                    hackathon_id: org.hackathon,
                                    avatar: avatarUrl
                                  });
                                  setQrModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                                title="View QR Badge"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewingOrg(org)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditOrg(org)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                                title="Edit Organizer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingOrg(org)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Delete Organizer"
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
        </div>
      ) : activeTab === 'prizes' ? (
        <PrizeManagement />
      ) : activeTab === 'faqs' ? (
        <FaqManagement />
      ) : activeTab === 'terms' ? (
        <TermsManagement />
      ) : activeTab === 'contacts' ? (
        <ContactManagement />
      ) : (
        <>
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
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Total Hackathons */}
        <div className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
              Editions
            </div>
            <div className="text-lg sm:text-3xl font-extrabold text-slate-900 mt-0.5 sm:mt-1 truncate">
              {stats.total_items ?? totalCount}
            </div>
            <div className="hidden sm:flex text-[11px] text-slate-400 mt-1 items-center gap-1">
              <Trophy className="w-3 h-3 text-[#e8622a]" />
              <span>Platform hackathons in database</span>
            </div>
          </div>
          <div
            className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0"
            style={{ backgroundColor: '#fff3ef' }}
          >
            <Trophy className="w-3.5 h-3.5 sm:w-6 sm:h-6" style={{ color: '#e8622a' }} />
          </div>
        </div>

        {/* Active Items */}
        <div className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
              Active
            </div>
            <div className="text-lg sm:text-3xl font-extrabold text-emerald-600 mt-0.5 sm:mt-1 truncate">
              {stats.active_items ?? 0}
            </div>
            <div className="hidden sm:flex text-[11px] text-slate-400 mt-1 items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Open or published to public</span>
            </div>
          </div>
          <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner shrink-0 border border-emerald-100">
            <Flame className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
        </div>

        {/* Inactive Items */}
        <div className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
              Draft
            </div>
            <div className="text-lg sm:text-3xl font-extrabold text-slate-700 mt-0.5 sm:mt-1 truncate">
              {stats.inactive_items ?? 0}
            </div>
            <div className="hidden sm:flex text-[11px] text-slate-400 mt-1 items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Work in progress editions</span>
            </div>
          </div>
          <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-amber-50 flex items-center justify-center shadow-inner shrink-0 border border-amber-100">
            <Clock className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-amber-600" />
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
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100/70">
                        <span className="text-[11px] text-slate-500">T-Shirt / Swag:</span>
                        {hackathon.is_tshirt_included ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                            <Shirt className="w-3 h-3 text-emerald-600" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium text-[10px]">
                            <span>No</span>
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
                  <th className="py-3.5 px-3">Fee</th>
                  <th className="py-3.5 px-3">T-Shirt</th>
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
                        <div>{hackathon.registration_start_date || hackathon.registration_startdate || '—'}</div>
                        <div className="text-slate-400 text-[10px]">
                          to {hackathon.registration_end_date || hackathon.registration_enddate || '—'}
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

                      {/* Registration Fee */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-700">
                          NPR {Number(hackathon.registration_fee || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* T-Shirt Included */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {hackathon.is_tshirt_included ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <Shirt className="w-3 h-3 text-emerald-600" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-medium">
                            <span>No</span>
                          </span>
                        )}
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
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE HACKATHON MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      <ModalPortal>
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
            <div className="relative bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
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
                    placeholder="e.g. V5.0"
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Fee (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={createForm.registration_fee}
                    onChange={(e) => setCreateForm({ ...createForm, registration_fee: e.target.value })}
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

                {/* Set as Current Edition toggle */}
                <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.is_current !== false}
                      onChange={(e) => setCreateForm({ ...createForm, is_current: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ea580c]"></div>
                  </label>
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Set as Current Hackathon Edition (`is_current: true`)</span>
                    <p className="text-[11px] text-slate-500">Marks this edition as active for the public customer site</p>
                  </div>
                </div>

                {/* T-Shirt Included toggle */}
                <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(createForm.is_tshirt_included)}
                      onChange={(e) => setCreateForm({ ...createForm, is_tshirt_included: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ea580c]"></div>
                  </label>
                  <div>
                    <span className="text-xs font-semibold text-slate-800">T-Shirt / Merchandise Included (`is_tshirt_included: true`)</span>
                    <p className="text-[11px] text-slate-500">Collects participant t-shirt sizes on registration forms and rosters</p>
                  </div>
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

                </div>

                {/* Modal Footer */}
                <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
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
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT HACKATHON MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {editingHackathon && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
            <div className="relative bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
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

              {/* Registration Dates for Edit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.registration_start_date}
                    onChange={(e) => setEditForm({ ...editForm, registration_start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration End Date
                  </label>
                  <input
                    type="date"
                    value={editForm.registration_end_date}
                    onChange={(e) => setEditForm({ ...editForm, registration_end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Fee (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.registration_fee}
                    onChange={(e) => setEditForm({ ...editForm, registration_fee: e.target.value })}
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

                {/* Set as Current Edition toggle */}
                <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_current !== false}
                      onChange={(e) => setEditForm({ ...editForm, is_current: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ea580c]"></div>
                  </label>
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Set as Current Hackathon Edition (`is_current: true`)</span>
                    <p className="text-[11px] text-slate-500">Marks this edition as active for the public customer site</p>
                  </div>
                </div>

                {/* T-Shirt Included toggle */}
                <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.is_tshirt_included)}
                      onChange={(e) => setEditForm({ ...editForm, is_tshirt_included: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ea580c]"></div>
                  </label>
                  <div>
                    <span className="text-xs font-semibold text-slate-800">T-Shirt / Merchandise Included (`is_tshirt_included: true`)</span>
                    <p className="text-[11px] text-slate-500">Collects participant t-shirt sizes on registration forms and rosters</p>
                  </div>
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

                </div>

                <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
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
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW HACKATHON DETAILS MODAL                                   */}
      {/* ------------------------------------------------------------- */}
      {viewingHackathon && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
            <div className="relative bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0 ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs sm:text-sm">
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
                    {viewingHackathon.registration_start_date || viewingHackathon.registration_startdate || '—'} →{' '}
                    {viewingHackathon.registration_end_date || viewingHackathon.registration_enddate || '—'}
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
                    Registration Fee
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    NPR {Number(viewingHackathon.registration_fee || 0).toLocaleString()}
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

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    T-Shirt / Merchandise
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {viewingHackathon.is_tshirt_included ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Included (`is_tshirt_included: true`)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        <span>Not Included (`false`)</span>
                      </span>
                    )}
                  </div>
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

              </div>

              {/* Modal Footer */}
              <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
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
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Edit Hackathon
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingHackathon(null)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
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
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
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
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT ORGANIZER MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
            <div className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: '#fff3ef' }}
                  >
                    <Award className="w-5 h-5" style={{ color: '#ea580c' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingOrg ? 'Edit Hackathon Organizer' : 'Add Hackathon Organizer'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Assign a platform user as committee officer for a hackathon edition
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOrgModalOpen(false);
                    setEditingOrg(null);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveOrg} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Select User */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organizer User Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={orgForm.user}
                  onChange={(e) => setOrgForm((prev) => ({ ...prev, user: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                >
                  <option value="">Select a user account...</option>
                  {availableUsers.map((u) => {
                    const name =
                      u.full_name ||
                      `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                      u.email;
                    return (
                      <option key={u.id} value={u.id}>
                        {name} ({u.email})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select an authenticated user to be designated as an organizer.
                </p>
              </div>

              {/* Select Hackathon Edition */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hackathon Edition <span className="text-red-500">*</span>
                </label>
                <select
                  value={orgForm.hackathon}
                  onChange={(e) => setOrgForm((prev) => ({ ...prev, hackathon: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                >
                  <option value="">Select a hackathon edition...</option>
                  {availableHackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title} {h.version ? `(${h.version})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={orgForm.department}
                  onChange={(e) => setOrgForm((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                >
                  <option value="">Select a department (Optional)...</option>
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Assign this organizer to a specific organizing department.
                </p>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgForm.designation}
                  onChange={(e) => setOrgForm((prev) => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g. Technical Officer, Operations Lead, Sponsorship Head"
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Sequence / Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={orgForm.order}
                  onChange={(e) => setOrgForm((prev) => ({ ...prev, order: e.target.value }))}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Determines sorting position on the organizers lineup (lower numbers appear first).
                </p>
              </div>

                </div>

                {/* Actions */}
                <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgModalOpen(false);
                      setEditingOrg(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOrg}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: '#ea580c' }}
                  >
                    {submittingOrg ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingOrg ? 'Update Organizer' : 'Add Organizer'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW ORGANIZER MODAL                                          */}
      {/* ------------------------------------------------------------- */}
      {viewingOrg && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
            <div className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: '#fff3ef' }}
                  >
                    <Award className="w-5 h-5" style={{ color: '#ea580c' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Organizer Details
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      ID: {viewingOrg.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingOrg(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={getUserAvatarUrl(viewingOrg.user?.profile_picture)}
                  alt={viewingOrg.user?.full_name || 'Organizer'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm bg-white shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_USER_AVATAR;
                  }}
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    {viewingOrg.user?.full_name || `${viewingOrg.user?.first_name || ''} ${viewingOrg.user?.last_name || ''}`.trim() || 'Unnamed User'}
                    {viewingOrg.user?.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {viewingOrg.user?.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-[#c2410c]">
                    <Award className="w-3.5 h-3.5" />
                    {viewingOrg.designation}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">
                    Hackathon Edition
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {getHackathonTitle(viewingOrg.hackathon)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">
                    Display Order
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block font-mono">
                    #{viewingOrg.order ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">
                    Account Status
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {viewingOrg.user?.is_active !== false ? 'Active Account' : 'Inactive'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase">
                    User Role
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block capitalize">
                    {viewingOrg.user?.role || 'User'}
                  </span>
                </div>
              </div>

              </div>

              {/* Modal Footer */}
              <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Created: {viewingOrg.created_at ? new Date(viewingOrg.created_at).toLocaleString() : '—'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingOrg;
                      setViewingOrg(null);
                      handleOpenEditOrg(target);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Edit Organizer
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingOrg(null)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
                    style={{ backgroundColor: '#ea580c' }}
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
      {/* DELETE ORGANIZER CONFIRMATION MODAL                           */}
      {/* ------------------------------------------------------------- */}
      {deletingOrg && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center">
                Remove Organizer?
              </h3>
              <p className="text-xs text-slate-500 text-center mt-1.5 leading-relaxed">
                Are you sure you want to remove{' '}
                <strong className="text-slate-800">
                  "{deletingOrg.user?.full_name || deletingOrg.user?.email || 'this organizer'}"
                </strong>{' '}
                as {deletingOrg.designation} from this hackathon edition?
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingOrg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingDeleteOrg}
                  onClick={handleDeleteOrgSubmit}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingDeleteOrg ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR CREDENTIAL BADGE MODAL */}
      <QrBadgeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        attendee={qrAttendee}
      />
      </ModalPortal>
    </div>
  );
}
