import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getMediaUrl, getAdminUser, setAdminUser } from '../../services/api';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Key,
  Mail,
  User,
  Copy,
  Code2,
  Filter,
  Check,
  X,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  ImageIcon,
  Edit3,
  Phone,
  Calendar,
  Save,
  FileText,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import sampleUsers from '../../data/json/users.json';

// Module-level in-memory cache to ensure data loads once and NEVER re-fetches
// until the user explicitly clicks the Refresh button or reloads the webpage.
let cachedUsersData = null;
let cachedGroupsData = null;
let cachedTotalCount = null;
let hasLoadedOnce = false;

export default function UserManagement() {
  // Initialize with cached data if already loaded one time
  const [groups, setGroups] = useState(() => {
    if (hasLoadedOnce && Array.isArray(cachedGroupsData)) {
      return cachedGroupsData;
    }
    return [];
  });
  const [teamsList, setTeamsList] = useState([]);

  const [usersList, setUsersList] = useState(() => {
    if (hasLoadedOnce && Array.isArray(cachedUsersData)) {
      return cachedUsersData;
    }
    return Array.isArray(sampleUsers) ? sampleUsers : [];
  });

  const [totalCount, setTotalCount] = useState(() => cachedTotalCount ?? (sampleUsers?.length || 0));
  const [usersLoading, setUsersLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Read ?search from URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('search') || '';

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParamQuery);
  const [groupFilter, setGroupFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [isTypingPause, setIsTypingPause] = useState(false);

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [showNetworkBypass, setShowNetworkBypass] = useState(false);

  // Registration Form State strictly matching requested body
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'user',
    groups: [],
    team: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [viewPayloadModalUser, setViewPayloadModalUser] = useState(null);
  const [detailModalLoading, setDetailModalLoading] = useState(false);

  // Admin Edit User Modal State (for PATCH /api/v1/users/{id}/update/)
  const [editUser, setEditUser] = useState(null);

  // Disable background scrolling when any modal in UserManagement is opened
  useBodyScrollLock(Boolean(isRegisterModalOpen || viewPayloadModalUser || editUser));
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editActiveTab, setEditActiveTab] = useState('profile');
  const [editFormData, setEditFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    profile_picture: '',
    bio: '',
    role: 'user',
    is_verified: true,
    is_active: true,
    is_staff: false,
    groups: []
  });

  // Edit image upload state
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editImageRemoved, setEditImageRemoved] = useState(false);
  const editFileInputRef = useRef(null);

  // Track initial mount so we don't double fire
  const isFirstRender = useRef(true);

  // 1. Fetch Users List: GET /api/v1/users/?search=...
  const fetchUsers = async (query = '', force = false) => {
    // If already loaded once without search query and not forced, reuse cached
    if (hasLoadedOnce && !force && !query && cachedUsersData) {
      return;
    }

    setUsersLoading(true);
    try {
      const params = query ? { search: query } : {};
      const data = await api.users.getAll(params, { forceRefresh: force });
      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      const count = data?.count !== undefined ? Number(data.count) : list.length;
      setTotalCount(count);

      // Cache only default un-queried fetch
      if (!query) {
        cachedTotalCount = count;
        if (list.length > 0) {
          cachedUsersData = list;
        }
      }

      if (list.length > 0) {
        setUsersList(list);
      } else if (query) {
        // Filter sample users locally as fallback if server is offline or returns empty
        const q = query.toLowerCase();
        const fallbackFiltered = (sampleUsers || []).filter(
          (u) =>
            String(u.full_name || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase().includes(q) ||
            String(u.email || '').toLowerCase().includes(q) ||
            String(u.id || '').includes(q)
        );
        setUsersList(fallbackFiltered);
        setTotalCount(fallbackFiltered.length);
      } else if (Array.isArray(sampleUsers)) {
        setUsersList(sampleUsers);
      }
      hasLoadedOnce = true;
    } catch (err) {
      console.warn('api.users.getAll fetch error, using local search fallback:', err);
      if (query) {
        const q = query.toLowerCase();
        const fallbackFiltered = (sampleUsers || []).filter(
          (u) =>
            String(u.full_name || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase().includes(q) ||
            String(u.email || '').toLowerCase().includes(q) ||
            String(u.id || '').includes(q)
        );
        setUsersList(fallbackFiltered);
        setTotalCount(fallbackFiltered.length);
      } else if (Array.isArray(sampleUsers) && !cachedUsersData) {
        setUsersList(sampleUsers);
        cachedUsersData = sampleUsers;
      }
      hasLoadedOnce = true;
    } finally {
      setUsersLoading(false);
    }
  };

  // 2. Fetch Groups: GET /api/v1/users/groups/list_groups/
  const fetchGroups = async (force = false) => {
    if (hasLoadedOnce && !force && cachedGroupsData) {
      return;
    }

    setGroupsLoading(true);
    try {
      const data = await api.users.listGroups({ forceRefresh: force });
      const rawList = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : Array.isArray(data?.groups)
        ? data.groups
        : [];

      if (rawList.length > 0) {
        const parsed = rawList.map((item, idx) => ({
          id: item.id !== undefined ? Number(item.id) : idx,
          name: String(item.name || `Group ${item.id ?? idx}`),
          permissions_name: item.permissions_name || null,
          description: item.description || ''
        }));
        setGroups(parsed);
        cachedGroupsData = parsed;
      } else {
        setGroups([]);
        cachedGroupsData = [];
      }
      hasLoadedOnce = true;
    } catch (err) {
      console.warn('api.users.listGroups fetch error:', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  // On mount: load once if not cached, or load with initial search query
  useEffect(() => {
    if (!hasLoadedOnce || searchParamQuery) {
      fetchUsers(searchParamQuery, Boolean(searchParamQuery));
      fetchGroups(false);
      api.teams
        .getAll()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.results || res?.data || [];
          setTeamsList(list);
        })
        .catch(() => {
          setTeamsList([]);
        });
    }
  }, []);

  // Debounced Search: Wait 2-second pause after user enters key, then call API
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentParam = searchParams.get('search') || '';
    const trimmed = searchTerm.trim();

    if (trimmed === currentParam) {
      setIsTypingPause(false);
      return;
    }

    // Indicate that we are waiting for the 2 second pause after keystroke
    setIsTypingPause(true);

    const timer = setTimeout(() => {
      setIsTypingPause(false);

      if (trimmed) {
        setSearchParams({ search: trimmed }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }

      // Execute API call after 2-second pause
      fetchUsers(trimmed, true);
    }, 2000); // 2-second pause after user enters key

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsTypingPause(false);
      const trimmed = searchTerm.trim();
      if (trimmed) {
        setSearchParams({ search: trimmed }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
      fetchUsers(trimmed, true);
    }
  };

  // Synchronize any groups discovered from user objects (e.g. group 12 "Something")
  useEffect(() => {
    if (Array.isArray(usersList) && usersList.length > 0) {
      setGroups((prev) => {
        const groupMap = new Map();
        (prev || []).forEach((g) => {
          groupMap.set(Number(g.id), g);
        });

        usersList.forEach((u) => {
          if (Array.isArray(u.groups)) {
            u.groups.forEach((g) => {
              if (typeof g === 'object' && g !== null && g.id !== undefined) {
                const id = Number(g.id);
                if (!groupMap.has(id)) {
                  groupMap.set(id, {
                    id,
                    name: String(g.name || `Group ${id}`),
                    permissions_name: g.permissions_name || null
                  });
                }
              }
            });
          }
        });

        const merged = Array.from(groupMap.values());
        cachedGroupsData = merged;
        return merged;
      });
    }
  }, [usersList]);

  // Safe group name resolver
  const getGroupName = (groupId) => {
    if (groupId === null || groupId === undefined) return 'Unassigned';
    if (typeof groupId === 'object') {
      return String(groupId.name || groupId.title || `Group ${groupId.id ?? 0}`);
    }
    const id = Number(groupId);
    const found = groups.find((g) => Number(g.id) === id);
    if (found) return String(found.name);
    return `Group ${isNaN(id) ? String(groupId) : id}`;
  };

  // Toggle group selection for registration form
  const toggleGroupSelection = (groupId) => {
    const id = Number(groupId);
    setFormData((prev) => {
      const current = Array.isArray(prev.groups) ? prev.groups : [];
      if (current.includes(id)) {
        return { ...prev, groups: current.filter((g) => g !== id) };
      } else {
        return { ...prev, groups: [...current, id] };
      }
    });
  };

  // Open Detail Modal directly using existing record without redundant API fetch
  const handleOpenDetailModal = (user) => {
    setViewPayloadModalUser(user);
  };

  // Open Edit User Modal directly from selected user record without redundant API fetch
  const openEditModal = (user) => {
    setEditUser(user);
    setEditError('');
    setEditSuccess('');
    setEditActiveTab('profile');

    const rawGroups = user?.groups || user?.group || [];
    const groupIds = Array.isArray(rawGroups)
      ? rawGroups
          .map((g) => (typeof g === 'object' && g !== null ? Number(g.id) : Number(g)))
          .filter((n) => !isNaN(n))
      : [];

    setEditFormData({
      email: user?.email || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || '',
      date_of_birth: user?.date_of_birth || '',
      profile_picture: user?.profile_picture || '',
      bio: user?.bio || '',
      role: user?.role || 'user',
      is_verified: Boolean(user?.is_verified),
      is_active: user?.is_active !== undefined ? Boolean(user?.is_active) : true,
      is_staff: Boolean(user?.is_staff),
      is_superuser: Boolean(user?.is_superuser),
      groups: groupIds
    });

    setEditImageFile(null);
    setEditImageRemoved(false);
    setEditImagePreview(user?.profile_picture ? getMediaUrl(user.profile_picture) : '');
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  // Toggle group selection for admin edit form
  const toggleEditGroup = (groupId) => {
    const id = Number(groupId);
    setEditFormData((prev) => {
      const current = Array.isArray(prev.groups) ? prev.groups : [];
      if (current.includes(id)) {
        return { ...prev, groups: current.filter((g) => g !== id) };
      } else {
        return { ...prev, groups: [...current, id] };
      }
    });
  };

  // Submit Admin User Update -> ONLY patches the updated details (diff-based PATCH)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditSaving(true);
    setEditError('');
    setEditSuccess('');

    // Compute diff: strictly ONLY include fields that were updated
    const patchPayload = {};

    if (editFormData.email.trim() && editFormData.email.trim() !== (editUser.email || '')) {
      patchPayload.email = editFormData.email.trim();
    }
    if (editFormData.first_name.trim() !== (editUser.first_name || '')) {
      patchPayload.first_name = editFormData.first_name.trim();
    }
    if (editFormData.last_name.trim() !== (editUser.last_name || '')) {
      patchPayload.last_name = editFormData.last_name.trim();
    }
    if (editFormData.phone_number.trim() !== (editUser.phone_number || '')) {
      patchPayload.phone_number = editFormData.phone_number.trim();
    }
    if ((editFormData.date_of_birth || '') !== (editUser.date_of_birth || '')) {
      patchPayload.date_of_birth = editFormData.date_of_birth || null;
    }
    if (editFormData.profile_picture.trim() !== (editUser.profile_picture || '')) {
      patchPayload.profile_picture = editFormData.profile_picture.trim() || null;
    }
    if (editFormData.bio.trim() !== (editUser.bio || '')) {
      patchPayload.bio = editFormData.bio.trim();
    }
    if (editFormData.role !== (editUser.role || 'user')) {
      patchPayload.role = editFormData.role;
    }
    if (Boolean(editFormData.is_verified) !== Boolean(editUser.is_verified)) {
      patchPayload.is_verified = Boolean(editFormData.is_verified);
    }
    if (Boolean(editFormData.is_active) !== Boolean(editUser.is_active !== undefined ? editUser.is_active : true)) {
      patchPayload.is_active = Boolean(editFormData.is_active);
    }
    if (Boolean(editFormData.is_staff) !== Boolean(editUser.is_staff)) {
      patchPayload.is_staff = Boolean(editFormData.is_staff);
    }
    if (Boolean(editFormData.is_superuser) !== Boolean(editUser.is_superuser)) {
      patchPayload.is_superuser = Boolean(editFormData.is_superuser);
    }

    const initialGroupIds = (
      Array.isArray(editUser.groups)
        ? editUser.groups.map((g) => (typeof g === 'object' && g !== null ? Number(g.id) : Number(g)))
        : []
    ).sort((a, b) => a - b);
    const currentGroupIds = [...editFormData.groups.map(Number)].sort((a, b) => a - b);
    if (JSON.stringify(initialGroupIds) !== JSON.stringify(currentGroupIds)) {
      patchPayload.groups = currentGroupIds;
    }

    const hasImageChange = editImageFile !== null || (editImageRemoved && Boolean(editUser?.profile_picture));

    // If no changes made, notify gently and close
    if (Object.keys(patchPayload).length === 0 && !hasImageChange) {
      setEditSuccess('No changes to update.');
      setTimeout(() => {
        setEditUser(null);
        setEditSuccess('');
      }, 700);
      setEditSaving(false);
      return;
    }

    let requestBody;
    if (editImageFile) {
      const fd = new FormData();
      Object.entries(patchPayload).forEach(([key, val]) => {
        if (key === 'groups' && Array.isArray(val)) {
          val.forEach((gid) => fd.append('groups', gid));
        } else if (val !== null && val !== undefined) {
          fd.append(key, val);
        }
      });
      fd.append('profile_picture', editImageFile);
      requestBody = fd;
    } else if (editImageRemoved) {
      requestBody = { ...patchPayload, profile_picture: null };
    } else {
      requestBody = patchPayload;
    }

    try {
      const updatedUser = await api.users.update(editUser.id, requestBody, { method: 'PATCH' });
      const mergedUser = updatedUser && typeof updatedUser === 'object' && updatedUser.id
        ? updatedUser
        : {
            ...editUser,
            ...patchPayload,
            profile_picture: editImagePreview || (editImageRemoved ? null : editUser?.profile_picture)
          };

      if (!mergedUser.profile_picture && editImagePreview) {
        mergedUser.profile_picture = editImagePreview;
      }

      setUsersList((prev) =>
        prev.map((u) => (String(u.id) === String(editUser.id) ? { ...u, ...mergedUser } : u))
      );
      if (Array.isArray(cachedUsersData)) {
        cachedUsersData = cachedUsersData.map((u) =>
          String(u.id) === String(editUser.id) ? { ...u, ...mergedUser } : u
        );
      }

      // If updating currently logged in user, keep local storage in sync
      const currentAdmin = getAdminUser();
      if (currentAdmin && String(currentAdmin.id) === String(editUser.id)) {
        setAdminUser({ ...currentAdmin, ...mergedUser });
        window.dispatchEvent(new CustomEvent('bic_user_updated', { detail: mergedUser }));
      }

      setEditSuccess('User details updated successfully.');
      setTimeout(() => {
        setEditUser(null);
        setEditSuccess('');
      }, 1000);
    } catch (err) {
      console.error('Failed to update user via admin endpoint:', err);
      setEditError(err?.message || 'Failed to update user details.');
    } finally {
      setEditSaving(false);
    }
  };
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setShowNetworkBypass(false);

    if (!formData.email.trim() || !formData.first_name.trim() || !formData.last_name.trim()) {
      setRegisterError('Please fill in email, first name, and last name.');
      return;
    }

    if (!formData.password) {
      setRegisterError('Password is required.');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setRegisterError('Password and password confirmation do not match.');
      return;
    }

    if (!formData.groups || formData.groups.length === 0) {
      setRegisterError('Please select at least one group for the user.');
      return;
    }

    const payload = {
      email: formData.email.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      role: formData.role || 'user',
      password: formData.password,
      password_confirm: formData.password_confirm,
      groups: (formData.groups || []).map((g) => Number(g))
    };

    setRegisterLoading(true);

    try {
      const response = await api.users.register(payload);

      setRegisterSuccess(`User "${payload.email}" registered successfully!`);

      const newUserRecord = {
        id: response?.id || Date.now(),
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        full_name: `${payload.first_name} ${payload.last_name}`,
        role: response?.role || 'user',
        team: formData.team || null,
        profile_picture: response?.profile_picture || null,
        is_verified: response?.is_verified ?? false,
        created_at: new Date().toISOString(),
        groups: (payload.groups || []).map((gid) => {
          const found = groups.find((g) => g.id === gid);
          return { id: gid, name: found ? found.name : `Group ${gid}` };
        })
      };

      setUsersList((prev) => {
        const updated = [newUserRecord, ...(Array.isArray(prev) ? prev : [])];
        cachedUsersData = updated;
        return updated;
      });

      setTotalCount((c) => {
        const newCount = c + 1;
        cachedTotalCount = newCount;
        return newCount;
      });

      setTimeout(() => {
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          password_confirm: '',
          role: 'user',
          groups: groups[0]?.id !== undefined ? [groups[0].id] : [],
          team: ''
        });
        setIsRegisterModalOpen(false);
        setRegisterSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Registration failed:', err);
      const isNetworkError =
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.status === 0;

      if (isNetworkError) {
        setRegisterError(
          'Could not connect to /api/v1/users/register/. Ensure the backend is active.'
        );
        setShowNetworkBypass(true);
      } else {
        setRegisterError(err.message || 'Registration failed. Check the form fields.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleOfflineSimulation = () => {
    const payload = {
      email: formData.email.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      groups: (formData.groups || []).map((g) => Number(g))
    };

    const newUserRecord = {
      id: Date.now(),
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      full_name: `${payload.first_name} ${payload.last_name}`,
      role: formData.role || 'user',
      profile_picture: null,
      is_verified: false,
      created_at: new Date().toISOString(),
      groups: (payload.groups || []).map((gid) => {
        const found = groups.find((g) => g.id === gid);
        return { id: gid, name: found ? found.name : `Group ${gid}` };
      })
    };

    setUsersList((prev) => {
      const updated = [newUserRecord, ...(Array.isArray(prev) ? prev : [])];
      cachedUsersData = updated;
      return updated;
    });

    setTotalCount((c) => {
      const newCount = c + 1;
      cachedTotalCount = newCount;
      return newCount;
    });

    setRegisterSuccess(`User "${payload.email}" saved in preview mode!`);

    setTimeout(() => {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
        role: 'user',
        groups: groups[0]?.id !== undefined ? [groups[0].id] : [],
        team: ''
      });
      setIsRegisterModalOpen(false);
      setRegisterSuccess('');
      setShowNetworkBypass(false);
    }, 1200);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(usersList)) return [];

    return usersList.filter((user) => {
      if (!user) return false;
      const fullName = String(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`).toLowerCase();
      const email = String(user.email || '').toLowerCase();
      const id = String(user.id || '');
      const query = (searchTerm || '').toLowerCase();

      const matchesSearch = fullName.includes(query) || email.includes(query) || id.includes(query);
      if (!matchesSearch) return false;

      if (groupFilter !== 'all') {
        const filterId = Number(groupFilter);
        const rawGroups = user.groups || user.group || [];
        const userGroupsList = Array.isArray(rawGroups) ? rawGroups : [rawGroups];
        const hasGroup = userGroupsList.some((g) => {
          const gid = typeof g === 'object' && g !== null ? g.id : g;
          return Number(gid) === filterId;
        });
        if (!hasGroup) return false;
      }

      if (teamFilter !== 'all') {
        const userTeam = String(user.team || user.team_name || '');
        if (userTeam.toLowerCase() !== teamFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [usersList, searchTerm, groupFilter, teamFilter]);

  const copyToClipboard = (text, id) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(String(text || ''));
      }
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentUser = getAdminUser();
  const userRole = (currentUser?.role || '').toLowerCase();
  const isAdmin =
    userRole === 'admin' ||
    userRole === 'administrator' ||
    userRole === 'super admin' ||
    Boolean(currentUser?.is_superuser) ||
    Boolean(currentUser?.is_staff);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">
          User Management is only accessible to users with the Administrator role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            User Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System accounts, roles, group memberships, and profile details
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsRegisterModalOpen(true);
              setRegisterError('');
              setRegisterSuccess('');
            }}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New User</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search users via ?search= (name, email, ID)..."
            className="w-full pl-9 pr-36 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e8622a] focus:ring-1 focus:ring-[#e8622a]/20"
          />
          {searchTerm && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isTypingPause ? (
                <span
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 animate-pulse"
                  title="Calling API after 2 second pause..."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>2s pause...</span>
                </span>
              ) : usersLoading ? (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-[#e8622a] flex items-center gap-1.5">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Searching...</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#ea580c] select-none">
                  ?search={searchTerm.length > 8 ? `${searchTerm.slice(0, 8)}...` : searchTerm}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIsTypingPause(false);
                  setSearchParams({}, { replace: true });
                  fetchUsers('', true);
                }}
                className="text-slate-400 hover:text-slate-700 p-0.5 text-xs font-bold"
                title="Clear Search"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Group Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Group:</span>
          </div>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:border-[#e8622a]"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (ID: {g.id})
              </option>
            ))}
          </select>

          {/* Team Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pl-1">
            <Users className="w-3.5 h-3.5" />
            <span>Team:</span>
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:border-[#e8622a]"
          >
            <option value="all">All Teams</option>
            {teamsList.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-400 pl-2">
            Total Users: <strong className="text-slate-700">{totalCount || filteredUsers.length}</strong>
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role & Status</th>
                <th className="py-3.5 px-4">Assigned Group & Team</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Try adjusting your search criteria' : 'Click "Register New User" to create one'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, uIdx) => {
                  const firstName = String(user?.first_name || '');
                  const lastName = String(user?.last_name || '');
                  const fullName = String(user?.full_name || `${firstName} ${lastName}`.trim() || 'User');
                  const email = String(user?.email || '');
                  const userId = String(user?.id ?? `usr-${uIdx}`);
                  const initials = `${firstName[0] || fullName[0] || 'U'}${lastName[0] || ''}`.toUpperCase();
                  const role = String(user?.role || 'user');
                  const isVerified = Boolean(user?.is_verified);

                  // Profile picture URL resolving
                  const profilePicUrl = user?.profile_picture ? getMediaUrl(user.profile_picture) : null;

                  const rawGroups = user?.groups || user?.group || [];
                  const userGroups = Array.isArray(rawGroups) ? rawGroups : [rawGroups];

                  return (
                    <tr key={userId || email} className="hover:bg-slate-50/80 transition-colors">
                      {/* User with Profile Picture Link */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {profilePicUrl ? (
                            <img
                              src={profilePicUrl}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm border border-slate-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                            style={{
                              backgroundColor: '#e8622a',
                              display: profilePicUrl ? 'none' : 'flex'
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: #{userId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[200px]" title={email}>
                            {email}
                          </span>
                        </div>
                      </td>

                      {/* Role & Verification Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {role}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-slate-400'}`}
                            />
                            <span>{isVerified ? 'Verified' : 'Unverified'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Groups & Team */}
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {userGroups.length === 0 && !user?.team ? (
                          <span className="text-slate-400 italic">No groups</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {userGroups.length > 0 && (
                              <span className="font-medium text-slate-800">
                                {userGroups
                                  .map((gid, gIdx) => {
                                    const gidVal = typeof gid === 'object' && gid !== null ? (gid.id ?? gIdx) : gid;
                                    return typeof gid === 'object' && gid !== null
                                      ? (gid.name || `Group ${gidVal}`)
                                      : getGroupName(gid);
                                  })
                                  .join(', ')}
                              </span>
                            )}
                            {user?.team && (
                              <span className="text-slate-500 text-[11px]">
                                Team: {String(user.team)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(email, userId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Copy Email"
                          >
                            {copiedId === userId ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#e8622a] hover:bg-orange-50 transition"
                            title="Edit User (PATCH /api/v1/users/{id}/update/)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDetailModal(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#e8622a] hover:bg-orange-50 transition"
                            title="View Full Live Details"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: '#e8622a' }}
                >
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Register New User
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Create a user account with role and group permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              {registerError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Registration Error</p>
                    <p className="mt-0.5 leading-relaxed">{registerError}</p>
                    {showNetworkBypass && (
                      <div className="mt-3 pt-2 border-t border-red-200/70">
                        <button
                          type="button"
                          onClick={handleOfflineSimulation}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Save in Preview Mode</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {registerSuccess && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{registerSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#e8622a] focus:ring-1 focus:ring-[#e8622a]/20"
                    />
                  </div>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="First name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#e8622a] focus:ring-1 focus:ring-[#e8622a]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Last name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#e8622a] focus:ring-1 focus:ring-[#e8622a]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Role</span>
                      <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Account access level</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:border-[#e8622a] focus:ring-1 focus:ring-[#e8622a]/20 font-medium capitalize"
                  >
                    <option value="user">User</option>
                    <option value="participant">Participant</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {/* Password & Password Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#e8622a] focus:ring-1 focus:ring-[#e8622a]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password Confirm <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm password"
                        value={formData.password_confirm}
                        onChange={(e) =>
                          setFormData({ ...formData, password_confirm: e.target.value })
                        }
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#e8622a] focus:ring-1 focus:ring-[#e8622a]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Groups Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Groups <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Assign one or more groups
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {groups.map((group) => {
                      const isSelected = (formData.groups || []).includes(Number(group.id));
                      return (
                        <div
                          key={group.id}
                          onClick={() => toggleGroupSelection(group.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-orange-50/80 border-[#e8622a] text-slate-900 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-[#e8622a] focus:ring-[#e8622a]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">
                                {group.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                ID: {group.id}
                              </span>
                            </div>
                            {group.description && (
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Selected Group IDs array:{' '}
                    <code className="text-[#e8622a] font-mono font-bold bg-orange-50 px-1 py-0.5 rounded">
                      [{ (formData.groups || []).join(', ') }]
                    </code>
                  </div>
                </div>

                {/* Team Selection (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Assigned Team (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Link user to a hackathon team
                    </span>
                  </div>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:border-[#e8622a]"
                  >
                    <option value="">No Team Assigned (Independent)</option>
                    {teamsList.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.track || t.college_org || 'Team'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all disabled:opacity-60"
                    style={{ backgroundColor: '#e8622a' }}
                  >
                    {registerLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register User</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL VIEW MODAL */}
      {viewPayloadModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] sm:max-h-[88vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: '#e8622a' }}
                >
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    User Profile & Details
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Account profile, assigned roles, and group memberships.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewPayloadModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Picture & User Banner Card */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
              {viewPayloadModalUser.profile_picture ? (
                <img
                  src={getMediaUrl(viewPayloadModalUser.profile_picture)}
                  alt={viewPayloadModalUser.full_name || viewPayloadModalUser.email}
                  className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 shadow-md shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md shrink-0"
                style={{
                  backgroundColor: '#e8622a',
                  display: viewPayloadModalUser.profile_picture ? 'none' : 'flex'
                }}
              >
                {viewPayloadModalUser.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-base truncate">
                  {viewPayloadModalUser.full_name ||
                    `${viewPayloadModalUser.first_name || ''} ${viewPayloadModalUser.last_name || ''}`.trim() ||
                    'User'}
                </div>
                <div className="text-xs text-slate-500 font-mono truncate" title={viewPayloadModalUser.email}>
                  {viewPayloadModalUser.email}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                    Role: {viewPayloadModalUser.role || 'user'}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      viewPayloadModalUser.is_verified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {viewPayloadModalUser.is_verified ? '✓ Verified' : 'Unverified'}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      viewPayloadModalUser.is_active !== false
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {viewPayloadModalUser.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                  {viewPayloadModalUser.is_staff && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Staff
                    </span>
                  )}
                  {viewPayloadModalUser.is_superuser && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Superuser
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile & Personal Info Grid */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Phone Number</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {viewPayloadModalUser.phone_number || '— (Not provided)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Date of Birth</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {viewPayloadModalUser.date_of_birth || '— (Not provided)'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Biography</span>
                <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {viewPayloadModalUser.bio || 'No biography written for this user.'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Account Created</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  {viewPayloadModalUser.created_at ? new Date(viewPayloadModalUser.created_at).toLocaleString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Last Updated</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  {viewPayloadModalUser.updated_at ? new Date(viewPayloadModalUser.updated_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {/* Group Memberships & Permissions breakdown */}
            {Array.isArray(viewPayloadModalUser.groups) && viewPayloadModalUser.groups.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned Groups:</span>
                </div>
                <p className="text-xs text-slate-800 font-medium">
                  {viewPayloadModalUser.groups
                    .map((group) => (typeof group === 'object' ? group.name || `Group ${group.id}` : getGroupName(group)))
                    .join(', ')}
                </p>
                {viewPayloadModalUser.groups.some((g) => g.permissions_name) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                    {viewPayloadModalUser.groups.map((group) => {
                      if (!group.permissions_name) return null;
                      return (
                        <div key={group.id} className="text-xs">
                          {Object.entries(group.permissions_name).map(([category, perms]) => (
                            <div key={category} className="text-slate-600">
                              <span className="font-semibold text-slate-700">{category}: </span>
                              <span>
                                {Array.isArray(perms) ? perms.map((p) => p.name).join(', ') : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                User #{viewPayloadModalUser.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewPayloadModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const target = viewPayloadModalUser;
                    setViewPayloadModalUser(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs hover:opacity-90"
                  style={{ backgroundColor: '#e8622a' }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT USER MODAL (DIFFERENT TABS: PROFILE, ROLE, AND OTHER) */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div
                  className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: '#e8622a' }}
                >
                  <Edit3 className="w-4 sm:w-5 h-4 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    Edit User Account
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    {editUser.first_name || editUser.last_name
                      ? `${editUser.first_name || ''} ${editUser.last_name || ''}`.trim()
                      : editUser.email} (ID: #{editUser.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB BAR: PROFILE, ROLE, AND OTHER */}
            <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50/70 gap-1 sm:gap-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setEditActiveTab('profile')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  editActiveTab === 'profile'
                    ? 'border-[#e8622a] text-[#e8622a] bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setEditActiveTab('role')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  editActiveTab === 'role'
                    ? 'border-[#e8622a] text-[#e8622a] bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Role & Groups</span>
              </button>
              <button
                type="button"
                onClick={() => setEditActiveTab('other')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  editActiveTab === 'other'
                    ? 'border-[#e8622a] text-[#e8622a] bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Other & Status</span>
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Status Alerts */}
              {editError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">Error: </span>
                    {editError}
                  </div>
                </div>
              )}

              {editSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{editSuccess}</span>
                </div>
              )}

              <form id="admin-user-edit-form" onSubmit={handleEditSubmit} className="space-y-4">
                {/* TAB 1: PROFILE FIELDS */}
                {editActiveTab === 'profile' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editFormData.first_name}
                          onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editFormData.last_name}
                          onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email Address <span className="text-red-500">*</span></span>
                      </label>
                      <input
                        type="email"
                        required
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition font-mono"
                        placeholder="user@example.com"
                      />
                    </div>

                    {/* Phone & Date of Birth */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone Number</span>
                        </label>
                        <input
                          type="tel"
                          value={editFormData.phone_number}
                          onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                          placeholder="+977-9800000000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Date of Birth</span>
                        </label>
                        <input
                          type="date"
                          value={editFormData.date_of_birth}
                          onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                        />
                      </div>
                    </div>

                    {/* Profile Picture Upload Area */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          <span>Profile Picture</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">PNG, JPG, WEBP (Max 5MB)</span>
                      </label>

                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.type.startsWith('image/')) {
                              setEditError('Please choose a valid image file.');
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              setEditError('Image size exceeds 5MB limit.');
                              return;
                            }
                            setEditError('');
                            setEditImageFile(file);
                            setEditImageRemoved(false);
                            const reader = new FileReader();
                            reader.onload = (ev) => setEditImagePreview(ev.target.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/60 transition-all flex flex-col sm:flex-row items-center gap-3.5">
                        <div className="relative group shrink-0">
                          {editImagePreview ? (
                            <img
                              src={editImagePreview}
                              alt="Avatar preview"
                              className="w-14 h-14 rounded-full object-cover border-2 border-orange-400 shadow-sm"
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base text-white shadow-sm"
                              style={{ backgroundColor: '#e8622a' }}
                            >
                              {((editFormData.first_name?.[0] || 'U') + (editFormData.last_name?.[0] || '')).toUpperCase()}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            title="Change image"
                            className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Camera className="w-4 h-4 drop-shadow" />
                          </button>
                        </div>

                        <div className="flex-1 text-center sm:text-left min-w-0">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#e8622a]" />
                              <span>{editImagePreview ? 'Change Image' : 'Upload Image'}</span>
                            </button>

                            {editImagePreview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditImageFile(null);
                                  setEditImagePreview('');
                                  setEditImageRemoved(true);
                                  if (editFileInputRef.current) editFileInputRef.current.value = '';
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 truncate">
                            {editImageFile ? (
                              <span className="font-medium text-emerald-600">
                                Selected: {editImageFile.name} ({(editImageFile.size / 1024).toFixed(0)} KB)
                              </span>
                            ) : (
                              'Click to browse image from your device.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Biography</span>
                      </label>
                      <textarea
                        rows={3}
                        value={editFormData.bio}
                        onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                        placeholder="User bio, role details, or hackathon notes..."
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: ROLE & GROUPS */}
                {editActiveTab === 'role' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* System Role Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <span>System Role <span className="text-red-500">*</span></span>
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition capitalize font-semibold"
                      >
                        <option value="user">User</option>
                        <option value="participant">Participant</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {/* Group Memberships (Multi-select) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assigned Groups</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {editFormData.groups.length} selected
                        </span>
                      </label>
                      <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                        {groups.map((group) => {
                          const id = Number(group.id);
                          const isSelected = editFormData.groups.includes(id);
                          return (
                            <label
                              key={id}
                              className="flex items-center gap-2.5 py-1 px-2 hover:bg-white rounded-lg cursor-pointer text-xs text-slate-700 font-medium transition"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleEditGroup(id)}
                                className="w-4 h-4 rounded text-[#e8622a] border-slate-300 focus:ring-[#e8622a]"
                              />
                              <span>{group.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: OTHER & STATUS */}
                {editActiveTab === 'other' && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xs text-slate-500">
                      Configure account verification, activation state, and security flags.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={editFormData.is_verified}
                          onChange={(e) => setEditFormData({ ...editFormData, is_verified: e.target.checked })}
                          className="rounded border-slate-300 text-[#e8622a] focus:ring-[#e8622a]"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">Verified User</div>
                          <div className="text-[10px] text-slate-400">Account identity verified</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={editFormData.is_active}
                          onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                          className="rounded border-slate-300 text-[#e8622a] focus:ring-[#e8622a]"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">Active Account</div>
                          <div className="text-[10px] text-slate-400">Permit user to login</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={editFormData.is_staff}
                          onChange={(e) => setEditFormData({ ...editFormData, is_staff: e.target.checked })}
                          className="rounded border-slate-300 text-[#e8622a] focus:ring-[#e8622a]"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">Staff Member</div>
                          <div className="text-[10px] text-slate-400">Access to admin tools</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={editFormData.is_superuser}
                          onChange={(e) => setEditFormData({ ...editFormData, is_superuser: e.target.checked })}
                          className="rounded border-slate-300 text-[#e8622a] focus:ring-[#e8622a]"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">Superuser</div>
                          <div className="text-[10px] text-slate-400">Unrestricted system access</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-400">
                Only modified fields will be updated.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  disabled={editSaving}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="admin-user-edit-form"
                  disabled={editSaving}
                  className="px-5 py-2 text-white text-xs font-semibold rounded-xl shadow-xs hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: '#e8622a' }}
                >
                  {editSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
