import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Mail,
  Building2,
  Phone,
  Calendar,
  Award,
  ShieldCheck,
  QrCode,
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api, getSelectedAdminHackathon, getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';
import QrBadgeModal, { QrThumbnail } from '../common/QrBadgeModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalPortal from '../common/ModalPortal';

export default function CustomerManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'participants';

  // Global hackathon edition
  const selectedHackathonId = getSelectedAdminHackathon();

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Data states
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, active_items: 0, inactive_items: 0 });

  // QR Modal
  const [qrAttendee, setQrAttendee] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Guest CRUD Modals
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [guestFormData, setGuestFormData] = useState({
    name: '',
    organization: '',
    designation: '',
    email: '',
    phone_number: '',
    bio: '',
    hackathon: selectedHackathonId || ''
  });
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [deleteGuestModalOpen, setDeleteGuestModalOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);

  // Body scroll lock
  const isAnyModalOpen = qrModalOpen || guestModalOpen || deleteGuestModalOpen;
  useBodyScrollLock(isAnyModalOpen);

  // Switch tabs
  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
    setSearchInput('');
    setAppliedSearch('');
  };

  // 1. Fetch Participants (backend-driven)
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedHackathonId) params.hackathon = selectedHackathonId;
      if (appliedSearch) params.search = appliedSearch;

      const res = await api.participants.getAll(params);
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];
      setParticipants(list);
      setStats({
        total_items: res?.stats?.total_items ?? res?.count ?? list.length,
        active_items: res?.stats?.active_items ?? list.length,
        inactive_items: res?.stats?.inactive_items ?? 0
      });
    } catch (err) {
      console.error('Failed to load participants from backend:', err);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHackathonId, appliedSearch]);

  // 2. Fetch Organizers (backend-driven)
  const fetchOrganizers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedHackathonId) params.hackathon = selectedHackathonId;
      if (appliedSearch) params.search = appliedSearch;

      const res = await api.hackathons.organizers.getAll(params);
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];
      setOrganizers(list);
      setStats({
        total_items: res?.stats?.total_items ?? res?.count ?? list.length,
        active_items: res?.stats?.active_items ?? list.length,
        inactive_items: res?.stats?.inactive_items ?? 0
      });
    } catch (err) {
      console.error('Failed to load organizers from backend:', err);
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHackathonId, appliedSearch]);

  // 3. Fetch Guests (backend-driven)
  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedHackathonId) params.hackathon = selectedHackathonId;
      if (appliedSearch) params.search = appliedSearch;

      const res = await api.guests.getAll(params);
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];
      setGuests(list);
      setStats({
        total_items: res?.stats?.total_items ?? res?.count ?? list.length,
        active_items: res?.stats?.active_items ?? list.length,
        inactive_items: res?.stats?.inactive_items ?? 0
      });
    } catch (err) {
      console.error('Failed to load guests from backend:', err);
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHackathonId, appliedSearch]);

  // Trigger fetch depending on activeTab
  useEffect(() => {
    if (activeTab === 'organizers') {
      fetchOrganizers();
    } else if (activeTab === 'guests') {
      fetchGuests();
    } else {
      fetchParticipants();
    }
  }, [activeTab, fetchParticipants, fetchOrganizers, fetchGuests]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  // Guest CRUD handlers
  const handleOpenCreateGuest = () => {
    setEditingGuest(null);
    setGuestFormData({
      name: '',
      organization: '',
      designation: '',
      email: '',
      phone_number: '',
      bio: '',
      hackathon: selectedHackathonId || ''
    });
    setGuestError('');
    setGuestModalOpen(true);
  };

  const handleOpenEditGuest = (guest) => {
    setEditingGuest(guest);
    setGuestFormData({
      name: guest.name || '',
      organization: guest.organization || '',
      designation: guest.designation || '',
      email: guest.email || '',
      phone_number: guest.phone_number || '',
      bio: guest.bio || '',
      hackathon: guest.hackathon?.id || guest.hackathon || selectedHackathonId || ''
    });
    setGuestError('');
    setGuestModalOpen(true);
  };

  const handleSaveGuest = async (e) => {
    e.preventDefault();
    setGuestSubmitting(true);
    setGuestError('');

    try {
      const payload = {
        name: guestFormData.name.trim(),
        organization: guestFormData.organization.trim(),
        designation: guestFormData.designation.trim(),
        email: guestFormData.email.trim(),
        phone_number: guestFormData.phone_number.trim(),
        bio: guestFormData.bio.trim()
      };

      if (guestFormData.hackathon) {
        payload.hackathon = Number(guestFormData.hackathon);
      }

      if (editingGuest) {
        await api.guests.patch(editingGuest.id, payload);
      } else {
        await api.guests.create(payload);
      }

      setGuestModalOpen(false);
      fetchGuests();
    } catch (err) {
      setGuestError(err?.message || 'Failed to save guest record.');
    } finally {
      setGuestSubmitting(false);
    }
  };

  const handleDeleteGuestConfirm = async () => {
    if (!guestToDelete) return;
    try {
      await api.guests.delete(guestToDelete.id);
      setDeleteGuestModalOpen(false);
      setGuestToDelete(null);
      fetchGuests();
    } catch (err) {
      alert(err?.message || 'Failed to delete guest.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Standard Flex Header (Rule 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === 'organizers'
                ? 'Organizer Credential Directory'
                : activeTab === 'guests'
                ? 'Guest Credential Directory'
                : 'Participant Credential Directory'}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] border border-orange-200">
              {stats.total_items} Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeTab === 'organizers'
              ? 'Manage official committee members, leaders, and their QR check-in badges'
              : activeTab === 'guests'
              ? 'Distinguished speakers, VIP guests, and designated event check-in passes'
              : 'Registered hackathon attendees, squad participants, and verifiable QR badges'}
          </p>
        </div>

        {activeTab === 'guests' && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateGuest}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition cursor-pointer"
              style={{ backgroundColor: '#ea580c' }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Guest</span>
            </button>
          </div>
        )}
      </div>

      {/* Segmented Tab Switcher (Rule 3 compatible with query params) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => handleTabChange('participants')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'participants'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>Participants</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('organizers')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'organizers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>Organizers</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('guests')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'guests'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>Guests & VIPs</span>
        </button>
      </div>

      {/* Search Bar (Backend-driven Rule 6) */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, email, organization...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#ea580c]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            Search
          </button>
        </div>

        <div className="text-xs text-slate-500 text-right sm:text-left">
          Total Records: <strong>{stats.total_items}</strong>
        </div>
      </form>

      {/* Loading Shimmer */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">
            Fetching {activeTab} credentials from backend...
          </p>
        </div>
      ) : null}

      {/* 1. PARTICIPANTS TAB CONTENT */}
      {!loading && activeTab === 'participants' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {participants.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Participants Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {appliedSearch
                  ? 'No participants matched your search criteria.'
                  : 'No participants registered for the selected edition.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Participant</th>
                    <th className="py-3.5 px-4">Squad / Team</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Preferences</th>
                    <th className="py-3.5 px-4 text-center">QR Pass</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {participants.map((p, idx) => {
                    const attendeeData = {
                      id: p.id || idx + 1,
                      type: 'participant',
                      name: p.name || 'Participant',
                      role: 'Participant',
                      email: p.email,
                      phone: p.phone_number,
                      team_name: p.team?.name || p.team_name || 'Individual',
                      college_name: p.current_grade,
                      shirt_size: p.shirt_size,
                      food_preference: p.food_preference,
                      hackathon_id: selectedHackathonId
                    };

                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-xs shrink-0">
                              {(p.name || 'P')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{p.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: #PART-{String(p.id || idx + 1).padStart(4, '0')}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {p.team?.name || p.team_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                              <Users className="w-3 h-3 text-[#ea580c]" />
                              <span>{p.team?.name || p.team_name}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No squad</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{p.email || 'N/A'}</span>
                            </div>
                            {p.phone_number && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{p.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.shirt_size && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200">
                                {p.shirt_size}
                              </span>
                            )}
                            {p.food_preference && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] capitalize border border-emerald-200">
                                {p.food_preference.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <QrThumbnail
                              attendee={attendeeData}
                              size={40}
                              onClick={() => {
                                setQrAttendee(attendeeData);
                                setQrModalOpen(true);
                              }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setQrAttendee(attendeeData);
                              setQrModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-[#ea580c] hover:bg-orange-50 text-slate-700 hover:text-[#ea580c] shadow-2xs transition cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#ea580c]" />
                            <span>View Pass</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. ORGANIZERS TAB CONTENT */}
      {!loading && activeTab === 'organizers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {organizers.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Organizers Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {appliedSearch
                  ? 'No organizers matched your search criteria.'
                  : 'No organizers assigned to the current hackathon.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Organizer</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-center">QR Pass</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {organizers.map((org, idx) => {
                    const user = org.user || {};
                    const name =
                      user.full_name ||
                      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                      user.email ||
                      'Organizer';
                    const avatarUrl = getUserAvatarUrl(user.profile_picture);

                    const attendeeData = {
                      id: org.id || idx + 1,
                      type: 'organizer',
                      name,
                      role: org.designation || 'Organizer',
                      email: user.email,
                      phone: user.phone_number,
                      department: org.department_name || (typeof org.department === 'object' ? org.department?.name : null),
                      hackathon_id: selectedHackathonId,
                      avatar: avatarUrl
                    };

                    return (
                      <tr key={org.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarUrl}
                              alt={name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-50"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_USER_AVATAR;
                              }}
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: #ORG-{String(org.id || idx + 1).padStart(4, '0')}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-[#ea580c] border border-orange-200">
                            <Award className="w-3 h-3" />
                            <span>{org.designation || 'Organizer'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {attendeeData.department ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{attendeeData.department}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">General</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono">{user.email || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <QrThumbnail
                              attendee={attendeeData}
                              size={40}
                              onClick={() => {
                                setQrAttendee(attendeeData);
                                setQrModalOpen(true);
                              }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setQrAttendee(attendeeData);
                              setQrModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-[#ea580c] hover:bg-orange-50 text-slate-700 hover:text-[#ea580c] shadow-2xs transition cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#ea580c]" />
                            <span>View Pass</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. GUESTS & VIPS TAB CONTENT */}
      {!loading && activeTab === 'guests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {guests.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Guests Recorded</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Record VIP attendees, keynote speakers, and mentors to generate verifiable check-in credentials.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateGuest}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs cursor-pointer"
                style={{ backgroundColor: '#ea580c' }}
              >
                <Plus className="w-4 h-4" />
                <span>Add First Guest</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Guest / VIP</th>
                    <th className="py-3.5 px-4">Organization & Title</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Bio / Notes</th>
                    <th className="py-3.5 px-4 text-center">QR Pass</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {guests.map((g, idx) => {
                    const attendeeData = {
                      id: g.id || idx + 1,
                      type: 'guest',
                      name: g.name || 'Guest',
                      role: g.designation || 'Special Guest',
                      organization: g.organization,
                      designation: g.designation,
                      email: g.email,
                      phone: g.phone_number,
                      hackathon_id: selectedHackathonId,
                      bio: g.bio
                    };

                    return (
                      <tr key={g.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {(g.name || 'G')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{g.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: #GST-{String(g.id || idx + 1).padStart(4, '0')}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{g.designation || 'Guest Speaker'}</span>
                            </span>
                            {g.organization && (
                              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{g.organization}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="space-y-0.5">
                            {g.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono">{g.email}</span>
                              </div>
                            )}
                            {g.phone_number && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{g.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs">
                          <span className="line-clamp-2">{g.bio || 'Honored guest attendee'}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <QrThumbnail
                              attendee={attendeeData}
                              size={40}
                              onClick={() => {
                                setQrAttendee(attendeeData);
                                setQrModalOpen(true);
                              }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setQrAttendee(attendeeData);
                                setQrModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-[#ea580c] hover:bg-orange-50 text-slate-700 hover:text-[#ea580c] shadow-2xs transition cursor-pointer"
                              title="View QR Badge"
                            >
                              <QrCode className="w-3.5 h-3.5 text-[#ea580c]" />
                              <span>QR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditGuest(g)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                              title="Edit Guest"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGuestToDelete(g);
                                setDeleteGuestModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete Guest"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* REUSABLE ATTENDEE QR BADGE MODAL */}
      <QrBadgeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        attendee={qrAttendee}
      />

      {/* MODAL PORTAL */}
      <ModalPortal>
      {/* CREATE / EDIT GUEST MODAL */}
      {guestModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingGuest ? 'Edit Guest Record' : 'Record New Guest'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add distinguished attendees, speakers, or mentors
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuestModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="p-6 space-y-4">
              {guestError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{guestError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={guestFormData.name}
                  onChange={(e) => setGuestFormData({ ...guestFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BIC Innovation Labs"
                    value={guestFormData.organization}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, organization: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Keynote Speaker / Judge"
                    value={guestFormData.designation}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, designation: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={guestFormData.email}
                    onChange={(e) => setGuestFormData({ ...guestFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+977 9800000000"
                    value={guestFormData.phone_number}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, phone_number: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bio / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief background or role in the event..."
                  value={guestFormData.bio}
                  onChange={(e) => setGuestFormData({ ...guestFormData, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={guestSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {guestSubmitting ? 'Saving...' : editingGuest ? 'Update Guest' : 'Save Guest'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* DELETE GUEST MODAL */}
      {deleteGuestModalOpen && guestToDelete && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Guest Record</h4>
            <p className="text-xs text-slate-500 mt-1.5">
              Are you sure you want to remove <strong className="text-slate-800">"{guestToDelete.name}"</strong>?
              Their credential pass will be invalidated.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteGuestModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGuestConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition"
              >
                Delete Guest
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
