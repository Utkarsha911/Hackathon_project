import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, getSelectedAdminHackathon } from '../../services/api';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  AlertCircle,
  GraduationCap,
  MapPin,
  Globe,
  Mail,
  Phone,
  GitBranch,
  Trophy,
  UserCheck,
  Ban,
  Loader2,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import QrBadgeModal, { QrThumbnail } from '../common/QrBadgeModal';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_items: 0, active_items: 0, inactive_items: 0 });

  // Filters (backend-driven)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Supporting Data
  const [availableHackathons, setAvailableHackathons] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  // QR Credential Badge Modal
  const [qrAttendee, setQrAttendee] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Form State
  const initialFormState = {
    name: '',
    hackathon: '',
    college_name: '',
    affilated_university: '',
    college_address: '',
    college_website: '',
    coordinator_phone: '',
    coordinator_email: '',
    no_of_members: 4,
    status: 'submitted',
    github_repo: '',
    team_lead: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Lock scroll when any modal is open
  const isAnyModalOpen =
    createModalOpen ||
    editModalOpen ||
    detailModalOpen ||
    deleteModalOpen ||
    qrModalOpen;
  useBodyScrollLock(isAnyModalOpen);

  const handleOpenDetailModal = (team) => {
    setSelectedTeam(team);
    setDetailModalOpen(true);
    if (team?.id) {
      api.teams
        .getById(team.id)
        .then((fullTeam) => {
          if (fullTeam && fullTeam.id) {
            setSelectedTeam(fullTeam);
          }
        })
        .catch((err) => console.warn('Failed to load full team details:', err));
    }
  };

  // Fetch Hackathons and Users on mount for dropdowns
  useEffect(() => {
    // Fetch hackathons
    api.hackathons
      .getAll({ skipHackathonFilter: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        setAvailableHackathons(list);
      })
      .catch((err) => console.warn('Failed to load hackathons for team form:', err));

    // Fetch users for team lead assignment
    api.users
      .getAll({ page_size: 250 })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        setAvailableUsers(list);
      })
      .catch((err) => console.warn('Failed to load users for team lead selection:', err));
  }, []);

  // Fetch Teams directly from /api/v1/hackathons/admin/teams/ with backend query parameters
  const fetchTeams = useCallback(
    async (overrideSearch = searchTerm) => {
      setLoading(true);
      try {
        const queryParams = {};
        if (overrideSearch && overrideSearch.trim()) {
          queryParams.search = overrideSearch.trim();
        }
        if (statusFilter && statusFilter !== 'all') {
          queryParams.status = statusFilter;
        }

        const globalHackathon = getSelectedAdminHackathon();
        if (globalHackathon && globalHackathon !== 'all') {
          queryParams.hackathon = globalHackathon;
        }

        const response = await api.hackathons.adminTeams.getAll(queryParams, { forceRefresh: true });

        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.results)
          ? response.results
          : Array.isArray(response?.data)
          ? response.data
          : [];

        setTeams(list);

        // Consume backend stats (Rule 4)
        if (response?.stats && typeof response.stats === 'object') {
          setStats({
            total_items: response.stats.total_items ?? list.length,
            active_items: response.stats.active_items ?? list.filter((t) => t.is_active || ['approved', 'participation_confirmed'].includes(t.status)).length,
            inactive_items: response.stats.inactive_items ?? list.filter((t) => !t.is_active || !['approved', 'participation_confirmed'].includes(t.status)).length
          });
        } else {
          setStats({
            total_items: response?.count ?? list.length,
            active_items: list.filter((t) => ['approved', 'participation_confirmed'].includes(t.status)).length,
            inactive_items: list.filter((t) => !['approved', 'participation_confirmed'].includes(t.status)).length
          });
        }
      } catch (err) {
        console.error('Failed to fetch admin teams from /api/v1/hackathons/admin/teams/:', err);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter]
  );

  // Debounced search handling
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchTeams(val);
    }, 400);
  };

  useEffect(() => {
    fetchTeams();
  }, [statusFilter, fetchTeams]);

  // Listen to Global Admin Hackathon Selector changes (Rule 7)
  useEffect(() => {
    const handleHackathonChange = () => {
      fetchTeams();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    return () => window.removeEventListener('bic_admin_hackathon_changed', handleHackathonChange);
  }, [fetchTeams]);

  // Handle Team Lead Selection in form -> auto-fills phone & email
  const handleTeamLeadChange = (userId) => {
    const foundUser = availableUsers.find((u) => String(u.id) === String(userId));
    setFormData((prev) => ({
      ...prev,
      team_lead: userId,
      coordinator_email: prev.coordinator_email || foundUser?.email || '',
      coordinator_phone: prev.coordinator_phone || foundUser?.phone_number || ''
    }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const defaultHackathon =
      getSelectedAdminHackathon() && getSelectedAdminHackathon() !== 'all'
        ? getSelectedAdminHackathon()
        : availableHackathons.find((h) => h.is_current)?.id || availableHackathons[0]?.id || '';

    setFormData({
      ...initialFormState,
      hackathon: defaultHackathon
    });
    setFormError('');
    setFormSuccess('');
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name || '',
      hackathon: team.hackathon || team.hackathon_id || '',
      college_name: team.college_name || '',
      affilated_university: team.affilated_university || '',
      college_address: team.college_address || '',
      college_website: team.college_website || '',
      coordinator_phone: team.coordinator_phone || '',
      coordinator_email: team.coordinator_email || '',
      no_of_members: team.no_of_members || 4,
      status: team.status || 'submitted',
      github_repo: team.github_repo || '',
      team_lead: team.team_lead || team.team_lead_id || ''
    });
    setFormError('');
    setFormSuccess('');
    setEditModalOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.hackathon || !formData.team_lead) {
      setFormError('Please fill in Team Name, select a Hackathon, and select a Team Lead.');
      return;
    }

    let websiteUrl = formData.college_website?.trim() || '';
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = `https://${websiteUrl}`;
    }

    let repoUrl = formData.github_repo?.trim() || '';
    if (repoUrl && !/^https?:\/\//i.test(repoUrl)) {
      repoUrl = `https://${repoUrl}`;
    }

    // Exact Request Body specified by User
    const payload = {
      name: formData.name.trim(),
      hackathon: formData.hackathon,
      college_name: formData.college_name.trim(),
      affilated_university: formData.affilated_university.trim(),
      college_address: formData.college_address.trim(),
      college_website: websiteUrl || null,
      coordinator_phone: formData.coordinator_phone.trim(),
      coordinator_email: formData.coordinator_email.trim(),
      no_of_members: Number(formData.no_of_members) || 4,
      status: formData.status || 'submitted',
      github_repo: repoUrl || null,
      team_lead: formData.team_lead
    };

    setFormSubmitting(true);
    try {
      await api.hackathons.adminTeams.create(payload);
      setFormSuccess(`Team "${payload.name}" created successfully!`);
      setTimeout(() => {
        setCreateModalOpen(false);
        fetchTeams();
      }, 900);
    } catch (err) {
      console.error('Failed to create team:', err);
      setFormError(err?.message || 'Failed to create team. Please verify the fields.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setFormError('');
    setFormSuccess('');

    let websiteUrl = formData.college_website?.trim() || '';
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = `https://${websiteUrl}`;
    }

    let repoUrl = formData.github_repo?.trim() || '';
    if (repoUrl && !/^https?:\/\//i.test(repoUrl)) {
      repoUrl = `https://${repoUrl}`;
    }

    const payload = {
      name: formData.name.trim(),
      hackathon: formData.hackathon,
      college_name: formData.college_name.trim(),
      affilated_university: formData.affilated_university.trim(),
      college_address: formData.college_address.trim(),
      college_website: websiteUrl || null,
      coordinator_phone: formData.coordinator_phone.trim(),
      coordinator_email: formData.coordinator_email.trim(),
      no_of_members: Number(formData.no_of_members) || 4,
      status: formData.status,
      github_repo: repoUrl || null,
      team_lead: formData.team_lead
    };

    setFormSubmitting(true);
    try {
      await api.hackathons.adminTeams.patch(selectedTeam.id, payload);
      setFormSuccess(`Team "${payload.name}" updated successfully!`);
      setTimeout(() => {
        setEditModalOpen(false);
        fetchTeams();
      }, 900);
    } catch (err) {
      console.error('Failed to update team:', err);
      setFormError(err?.message || 'Failed to update team.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Status Change (Approve, Reject, or Submit)
  const handleQuickStatusChange = async (teamId, newStatus) => {
    try {
      await api.hackathons.adminTeams.patch(teamId, { status: newStatus });
      fetchTeams();
    } catch (err) {
      console.error(`Failed to change team status to ${newStatus}:`, err);
    }
  };

  // Delete Team Confirm
  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    try {
      await api.hackathons.adminTeams.delete(teamToDelete.id);
      setDeleteModalOpen(false);
      setTeamToDelete(null);
      fetchTeams();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  // Helper to resolve Hackathon Title
  const getHackathonTitle = (hackathonId) => {
    const found = availableHackathons.find((h) => String(h.id) === String(hackathonId));
    return found?.title || 'BIC Hackathon';
  };

  // Helper to resolve Team Lead Name
  const getTeamLeadName = (leadId) => {
    const found = availableUsers.find((u) => String(u.id) === String(leadId));
    if (found) {
      return `${found.first_name || ''} ${found.last_name || ''}`.trim() || found.email;
    }
    return String(leadId).slice(0, 8);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Layout Standard (Rule 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Team Management
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#c2410c] border border-orange-200">
              {stats.total_items} Squads
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage participating hackathon teams, review squad applications, and assign project tracks
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Stat Cards (Rule 4, 8, 9) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Total Teams */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-2.5 sm:p-5 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider block truncate">
              Total Squads
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-lg sm:text-3xl font-extrabold text-slate-900 truncate">
                {stats.total_items}
              </span>
              <span className="hidden sm:inline text-xs text-slate-400">Registered</span>
            </div>
          </div>
          <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Approved Teams */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-2.5 sm:p-5 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider block truncate">
              Approved
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-lg sm:text-3xl font-extrabold text-emerald-600 truncate">
                {stats.active_items}
              </span>
              <span className="hidden sm:inline text-xs text-emerald-600 font-medium">Ready</span>
            </div>
          </div>
          <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Pending / Submitted Teams */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-2.5 sm:p-5 shadow-xs flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider block truncate">
              Pending
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <span className="text-lg sm:text-3xl font-extrabold text-amber-600 truncate">
                {stats.inactive_items}
              </span>
              <span className="hidden sm:inline text-xs text-amber-600 font-medium">Review</span>
            </div>
          </div>
          <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filters Bar (Backend-Driven Search & Status) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams by name, college, email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:border-[#ea580c]"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="participation_confirmed">Participation Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="disqualified">Disqualified</option>
          </select>

          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing <strong className="text-slate-800">{teams.length}</strong> squads
          </span>
        </div>
      </div>

      {/* 4. Teams Grid / List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-[#ea580c] animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading teams from server...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No teams found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'No teams match your search or status query on the backend.'
              : 'No teams have been created for this hackathon yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => {
            const status = (team.status || 'submitted').toLowerCase();
            const isApproved = status === 'approved';
            const isConfirmed = status === 'participation_confirmed';
            const isRejected = status === 'rejected';
            const isDisqualified = status === 'disqualified';

            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-orange-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Icon + Name + Status */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center font-bold text-sm shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                          {team.name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">
                          {getHackathonTitle(team.hackathon)}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge (Rule 8 & 9: Static, clean enterprise icon) */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize shrink-0 ${
                        isConfirmed
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDisqualified
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isRejected
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isConfirmed ? (
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                      ) : isApproved ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : isDisqualified ? (
                        <Ban className="w-3 h-3 text-rose-600" />
                      ) : isRejected ? (
                        <XCircle className="w-3 h-3 text-red-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-600" />
                      )}
                      <span>{isConfirmed ? 'Participation Confirmed' : (team.status || 'Submitted')}</span>
                    </span>
                  </div>

                  {/* College & University */}
                  <div className="space-y-1 my-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-800">
                        {team.college_name || 'Independent / Open Entry'}
                      </span>
                    </div>
                    {team.affilated_university && (
                      <div className="flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{team.affilated_university}</span>
                      </div>
                    )}
                  </div>

                  {/* Team Lead & Coordinator Details Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 mb-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono uppercase text-[10px]">Team Lead</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                        {getTeamLeadName(team.team_lead)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono uppercase text-[10px]">Members</span>
                      <span className="font-medium text-slate-700">{team.no_of_members || 1} Persons</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 font-mono uppercase text-[10px]">Roster</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          (team.participants?.length || 0) === (team.no_of_members || 1)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (team.participants?.length || 0) > 0
                            ? 'bg-orange-50 text-[#ea580c] border border-orange-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {team.participants?.length || 0} / {team.no_of_members || 1} Enrolled
                      </span>
                    </div>

                    {team.coordinator_phone && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono uppercase text-[10px]">Phone</span>
                        <span className="font-medium text-slate-700">{team.coordinator_phone}</span>
                      </div>
                    )}

                    {/* Quick participant preview pills */}
                    {team.participants && team.participants.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/40 flex flex-wrap gap-1">
                        {team.participants.map((p, pIdx) => (
                          <span
                            key={p.id || pIdx}
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              pIdx === 0
                                ? 'bg-orange-100/70 text-orange-900 border border-orange-200/60'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                            title={`${p.name || 'Member'} (${p.email || 'No email'})`}
                          >
                            <span className="truncate max-w-[85px]">{p.name || 'Member'}</span>
                            {pIdx === 0 && <span className="text-[9px] font-bold text-[#ea580c]">★</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions & Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Status Toggles */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {!isApproved && !isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(team.id, 'approved')}
                        title="Approve Team"
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(team.id, 'participation_confirmed')}
                        title="Confirm Participation"
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                      >
                        Confirm
                      </button>
                    )}
                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(team.id, 'approved')}
                        title="Revert to Approved"
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                      >
                        Revert
                      </button>
                    )}
                    {!isRejected && !isDisqualified && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(team.id, 'rejected')}
                        title="Reject Team"
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                    {!isDisqualified && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(team.id, 'disqualified')}
                        title="Disqualify Team"
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                      >
                        Disqualify
                      </button>
                    )}
                  </div>

                  {/* Icon Actions: View, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDetailModal(team)}
                      title="View Details"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(team)}
                      title="Edit Team"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeamToDelete(team);
                        setDeleteModalOpen(true);
                      }}
                      title="Delete Team"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CREATE TEAM MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Register New Admin Team
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dispatches team registration payload to <code className="font-mono text-slate-700">/api/v1/hackathons/admin/teams/</code>.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CyberVanguard"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* Hackathon Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hackathon Edition <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.hackathon}
                    onChange={(e) => setFormData({ ...formData, hackathon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  >
                    <option value="">Select Hackathon</option>
                    {availableHackathons.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title} {h.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Lead Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Team Lead (User) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.team_lead}
                    onChange={(e) => handleTeamLeadChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  >
                    <option value="">Select Team Lead</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* College Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Boston International College"
                    value={formData.college_name}
                    onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* Affiliated University */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Affiliated University <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pokhara University"
                    value={formData.affilated_university}
                    onChange={(e) => setFormData({ ...formData, affilated_university: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* College Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bharatpur-10, Chitwan, Nepal"
                    value={formData.college_address}
                    onChange={(e) => setFormData({ ...formData, college_address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* Coordinator Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coordinator Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="coordinator@college.edu.np"
                    value={formData.coordinator_email}
                    onChange={(e) => setFormData({ ...formData, coordinator_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* Coordinator Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coordinator Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+977-9800000000"
                    value={formData.coordinator_phone}
                    onChange={(e) => setFormData({ ...formData, coordinator_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* Number of Members */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of Members <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={formData.no_of_members}
                    onChange={(e) => setFormData({ ...formData, no_of_members: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="participation_confirmed">Participation Confirmed</option>
                    <option value="rejected">Rejected</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>

                {/* College Website */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College Website <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://bostoncollege.edu.np"
                    value={formData.college_website}
                    onChange={(e) => setFormData({ ...formData, college_website: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* GitHub Repo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GitHub Repo Link <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={formData.github_repo}
                    onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-xs transition disabled:opacity-60 flex items-center gap-1.5"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Team</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT TEAM MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Edit Team: {selectedTeam?.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Updates team details via <code className="font-mono text-slate-700">PATCH /api/v1/hackathons/admin/teams/{selectedTeam?.id}/</code>.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hackathon Edition <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.hackathon}
                    onChange={(e) => setFormData({ ...formData, hackathon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  >
                    {availableHackathons.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title} {h.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Team Lead (User) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.team_lead}
                    onChange={(e) => handleTeamLeadChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College Name</label>
                  <input
                    type="text"
                    value={formData.college_name}
                    onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliated University</label>
                  <input
                    type="text"
                    value={formData.affilated_university}
                    onChange={(e) => setFormData({ ...formData, affilated_university: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College Address</label>
                  <input
                    type="text"
                    value={formData.college_address}
                    onChange={(e) => setFormData({ ...formData, college_address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Coordinator Email</label>
                  <input
                    type="email"
                    value={formData.coordinator_email}
                    onChange={(e) => setFormData({ ...formData, coordinator_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Coordinator Phone</label>
                  <input
                    type="tel"
                    value={formData.coordinator_phone}
                    onChange={(e) => setFormData({ ...formData, coordinator_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Members</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.no_of_members}
                    onChange={(e) => setFormData({ ...formData, no_of_members: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="participation_confirmed">Participation Confirmed</option>
                    <option value="rejected">Rejected</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College Website</label>
                  <input
                    type="url"
                    value={formData.college_website}
                    onChange={(e) => setFormData({ ...formData, college_website: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Repo</label>
                  <input
                    type="url"
                    value={formData.github_repo}
                    onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-xs transition disabled:opacity-60 flex items-center gap-1.5"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. VIEW DETAIL MODAL */}
      {detailModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-50 text-[#ea580c] font-bold border border-orange-100">
                {getHackathonTitle(selectedTeam.hackathon)}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {selectedTeam.name}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {selectedTeam.id}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono text-[11px]">Status</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                      selectedTeam.status === 'participation_confirmed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : selectedTeam.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedTeam.status === 'disqualified'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : selectedTeam.status === 'rejected'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedTeam.status === 'participation_confirmed' ? (
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                    ) : selectedTeam.status === 'approved' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : selectedTeam.status === 'disqualified' ? (
                      <Ban className="w-3 h-3 text-rose-600" />
                    ) : selectedTeam.status === 'rejected' ? (
                      <XCircle className="w-3 h-3 text-red-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    <span>
                      {selectedTeam.status === 'participation_confirmed'
                        ? 'Participation Confirmed'
                        : (selectedTeam.status || 'submitted')}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono text-[11px]">Team Lead</span>
                  <span className="font-semibold text-slate-800">
                    {getTeamLeadName(selectedTeam.team_lead)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono text-[11px]">Member Count</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTeam.no_of_members || 1}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-white border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">College / Institution</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedTeam.college_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Affiliated University</span>
                  <span className="font-medium text-slate-700">{selectedTeam.affilated_university || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">College Address</span>
                  <span className="font-medium text-slate-700">{selectedTeam.college_address || 'N/A'}</span>
                </div>
                {selectedTeam.college_website && (
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono block">Website</span>
                    <a
                      href={selectedTeam.college_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ea580c] hover:underline font-mono inline-flex items-center gap-1"
                    >
                      <span>{selectedTeam.college_website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-mono block font-bold">
                  Coordinator Contact
                </span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedTeam.coordinator_email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedTeam.coordinator_phone}</span>
                </div>
                {selectedTeam.github_repo && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-slate-400" />
                    <a
                      href={selectedTeam.github_repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ea580c] hover:underline font-mono"
                    >
                      {selectedTeam.github_repo}
                    </a>
                  </div>
                )}
              </div>

              {/* Squad Participants Roster Section */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#ea580c]" />
                    <span className="font-bold text-slate-800 text-xs">
                      Squad Participants Roster
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {selectedTeam.participants?.length || 0} of {selectedTeam.no_of_members || 1} Enrolled
                  </span>
                </div>

                {selectedTeam.participants && selectedTeam.participants.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTeam.participants.map((p, idx) => {
                      const isLeader = idx === 0;
                      const attendeeData = {
                        id: p.id || `p-${idx + 1}`,
                        type: 'participant',
                        name: p.name || 'Participant',
                        role: isLeader ? 'Team Leader' : 'Participant',
                        email: p.email,
                        phone: p.phone_number,
                        team_id: selectedTeam.id,
                        team_name: selectedTeam.name,
                        college_name: selectedTeam.college_name,
                        hackathon_id: selectedTeam.hackathon,
                        shirt_size: p.shirt_size,
                        food_preference: p.food_preference,
                        current_grade: p.current_grade,
                        emergency_contact: p.emergency_contact,
                        medical_conditions: p.medical_conditions
                      };

                      return (
                        <div
                          key={p.id || idx}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 transition hover:bg-slate-50/90"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isLeader ? 'bg-[#ea580c] text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</span>
                                  {isLeader && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-100 text-[#ea580c] font-bold">
                                      Team Leader
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                  {p.shirt_size && (
                                    <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200">
                                      T-Shirt: {p.shirt_size}
                                    </span>
                                  )}
                                  {p.food_preference && (
                                    <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 capitalize">
                                      Meal: {p.food_preference.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Participant QR Code Action & Preview */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <QrThumbnail
                                attendee={attendeeData}
                                size={44}
                                onClick={() => {
                                  setQrAttendee(attendeeData);
                                  setQrModalOpen(true);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setQrAttendee(attendeeData);
                                  setQrModalOpen(true);
                                }}
                                title="View QR Credential Badge"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-[#ea580c] hover:bg-orange-50 text-slate-700 hover:text-[#ea580c] shadow-2xs transition cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5 text-[#ea580c]" />
                                <span>QR Badge</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-mono block">Email</span>
                              <span className="font-mono text-slate-800 break-all">{p.email || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-mono block">Phone</span>
                              <span className="font-medium text-slate-800">{p.phone_number || 'N/A'}</span>
                            </div>
                            {p.current_grade && (
                              <div>
                                <span className="text-slate-400 text-[10px] uppercase font-mono block">Academic Grade</span>
                                <span className="font-medium text-slate-800">{p.current_grade}</span>
                              </div>
                            )}
                            {p.emergency_contact && (
                              <div>
                                <span className="text-slate-400 text-[10px] uppercase font-mono block">Emergency Contact</span>
                                <span className="font-medium text-slate-800">{p.emergency_contact}</span>
                              </div>
                            )}
                            {p.medical_conditions && (
                              <div className="sm:col-span-2">
                                <span className="text-slate-400 text-[10px] uppercase font-mono block">Medical / Dietary Notes</span>
                                <span className="text-amber-800 font-medium">{p.medical_conditions}</span>
                              </div>
                            )}
                          </div>

                          {/* Social & Portfolio Links */}
                          <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px] flex-wrap">
                            {p.github_profile && (
                              <a
                                href={p.github_profile}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-600 hover:text-[#ea580c] inline-flex items-center gap-1 font-mono transition"
                              >
                                <span>GitHub</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                              </a>
                            )}
                            {p.linkedin_profile && (
                              <a
                                href={p.linkedin_profile}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-600 hover:text-[#ea580c] inline-flex items-center gap-1 font-mono transition"
                              >
                                <span>LinkedIn</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                              </a>
                            )}
                            {p.portfolio_website && (
                              <a
                                href={p.portfolio_website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-600 hover:text-[#ea580c] inline-flex items-center gap-1 font-mono transition"
                              >
                                <span>Portfolio</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                              </a>
                            )}
                            {p.cv && (
                              <a
                                href={p.cv}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#ea580c] hover:underline inline-flex items-center gap-1 font-semibold transition"
                              >
                                <span>View CV</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#ea580c]" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400">
                      No participants submitted by the team leader yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Team</h4>
            <p className="text-xs text-slate-500 mt-1.5">
              Are you sure you want to permanently delete squad{' '}
              <strong className="text-slate-800 font-semibold">"{teamToDelete.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. ATTENDEE QR BADGE MODAL */}
      <QrBadgeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        attendee={qrAttendee}
      />
    </div>
  );
}
