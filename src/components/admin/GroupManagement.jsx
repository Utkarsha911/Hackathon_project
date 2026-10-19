import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Users,
  Plus,
  Shield,
  Key,
  Search,
  FolderTree,
  Lock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Code2,
  Sparkles,
  Edit3,
  Save
} from 'lucide-react';

const FALLBACK_PERMISSIONS = {
  Category: [
    { id: 33, name: 'Can add Category', codename: 'add_category' },
    { id: 34, name: 'Can change Category', codename: 'change_category' },
    { id: 35, name: 'Can delete Category', codename: 'delete_category' },
    { id: 36, name: 'Can view Category', codename: 'view_category' }
  ],
  Comment: [
    { id: 45, name: 'Can add Comment', codename: 'add_comment' },
    { id: 46, name: 'Can change Comment', codename: 'change_comment' },
    { id: 47, name: 'Can delete Comment', codename: 'delete_comment' },
    { id: 48, name: 'Can view Comment', codename: 'view_comment' }
  ],
  Post: [
    { id: 41, name: 'Can add Post', codename: 'add_post' },
    { id: 42, name: 'Can change Post', codename: 'change_post' },
    { id: 43, name: 'Can delete Post', codename: 'delete_post' },
    { id: 44, name: 'Can view Post', codename: 'view_post' }
  ],
  Tag: [
    { id: 37, name: 'Can add Tag', codename: 'add_tag' },
    { id: 38, name: 'Can change Tag', codename: 'change_tag' },
    { id: 39, name: 'Can delete Tag', codename: 'delete_tag' },
    { id: 40, name: 'Can view Tag', codename: 'view_tag' }
  ],
  Activity: [
    { id: 49, name: 'Can add Activity', codename: 'add_activity' },
    { id: 50, name: 'Can change Activity', codename: 'change_activity' },
    { id: 51, name: 'Can delete Activity', codename: 'delete_activity' },
    { id: 52, name: 'Can view Activity', codename: 'view_activity' }
  ],
  Notification: [
    { id: 25, name: 'Can add Notification', codename: 'add_notification' },
    { id: 26, name: 'Can change Notification', codename: 'change_notification' },
    { id: 27, name: 'Can delete Notification', codename: 'delete_notification' },
    { id: 28, name: 'Can view Notification', codename: 'view_notification' }
  ],
  Notificationpreference: [
    { id: 29, name: 'Can add Notification Preference', codename: 'add_notificationpreference' },
    { id: 30, name: 'Can change Notification Preference', codename: 'change_notificationpreference' },
    { id: 31, name: 'Can delete Notification Preference', codename: 'delete_notificationpreference' },
    { id: 32, name: 'Can view Notification Preference', codename: 'view_notificationpreference' }
  ],
  User: [
    { id: 21, name: 'Can add User', codename: 'add_user' },
    { id: 22, name: 'Can change User', codename: 'change_user' },
    { id: 23, name: 'Can delete User', codename: 'delete_user' },
    { id: 24, name: 'Can view User', codename: 'view_user' }
  ]
};

// Module-level in-memory cache to retain state across Admin tab switches
let cachedGroupsList = null;
let cachedPermissionsCatalog = null;

export default function GroupManagement() {
  const { showToast } = useHackathon();
  const [groups, setGroups] = useState(() => (Array.isArray(cachedGroupsList) ? cachedGroupsList : []));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Edit Group / Update Permissions Modal State
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editSelectedPermissions, setEditSelectedPermissions] = useState([]);
  const [editSearchTerm, setEditSearchTerm] = useState('');
  const [editCollapsedCategories, setEditCollapsedCategories] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);

  // Create Group Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Disable background scrolling when any modal in GroupManagement is opened
  useBodyScrollLock(Boolean(isCreateModalOpen || editingGroup || selectedGroup));
  const [permissionsCatalog, setPermissionsCatalog] = useState(() => cachedPermissionsCatalog || FALLBACK_PERMISSIONS);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Form State
  const [groupName, setGroupName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // 1. Fetch Groups list from GET /api/v1/users/groups/list_groups/
  const fetchGroups = async (force = false) => {
    if (!force && Array.isArray(cachedGroupsList)) {
      setGroups(cachedGroupsList);
      return;
    }
    setLoading(true);
    try {
      const response = await api.users.listGroups({ forceRefresh: force });
      const list = Array.isArray(response)
        ? response
        : response?.results || response?.data || [];
      setGroups(list);
      cachedGroupsList = list;
    } catch (err) {
      console.warn('Group list API error:', err);
      setGroups([]);
      cachedGroupsList = [];
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Permissions from GET /api/v1/users/groups/list_permissions/
  const fetchPermissions = async (force = false) => {
    if (!force && cachedPermissionsCatalog) {
      setPermissionsCatalog(cachedPermissionsCatalog);
      return;
    }
    setPermissionsLoading(true);
    try {
      const response = await api.users.listPermissions({ forceRefresh: force });
      if (response && typeof response === 'object' && Object.keys(response).length > 0) {
        setPermissionsCatalog(response);
        cachedPermissionsCatalog = response;
      }
    } catch (err) {
      console.warn('Permissions list API error, using catalog fallback:', err);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(false);
  }, []);

  // When opening Create Modal, ensure permissions catalog is loaded
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateSuccess('');
    setCreateError('');
    fetchPermissions();
  };

  // Toggle individual permission ID
  const togglePermission = (id) => {
    const numId = Number(id);
    setSelectedPermissions((prev) =>
      prev.includes(numId) ? prev.filter((p) => p !== numId) : [...prev, numId]
    );
  };

  // Toggle all permissions in a category
  const toggleCategoryAll = (categoryItems) => {
    const itemIds = categoryItems.map((p) => Number(p.id));
    const allSelected = itemIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all in category
      setSelectedPermissions((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      // Select all in category
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  // Toggle category accordion collapse
  const toggleCategoryCollapse = (cat) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // 3. Submit Create Group POST /api/v1/users/groups/create_group/
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setCreateError('Group name is required.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setCreateError('Please select at least one permission.');
      return;
    }

    const payload = {
      name: trimmedName,
      permissions: selectedPermissions.map(Number)
    };

    setCreateLoading(true);

    try {
      const response = await api.users.createGroup(payload);

      setCreateSuccess(`Group "${trimmedName}" created successfully!`);

      // Refresh groups list or append newly created group
      const newGroupObj = {
        id: response?.id || Date.now(),
        name: trimmedName,
        permissions_name: response?.permissions_name || {
          Category: selectedPermissions.map((pid) => ({ id: pid, name: `Perm #${pid}` }))
        }
      };

      setGroups((prev) => [newGroupObj, ...prev.filter((g) => g.id !== newGroupObj.id)]);

      // Auto close after brief success display
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess('');
        cachedGroupsList = null;
        fetchGroups(true);
      }, 1400);
    } catch (err) {
      console.error('Create group error:', err);
      const detail = err.message || 'Failed to create group.';
      setCreateError(detail);
    } finally {
      setCreateLoading(false);
    }
  };

  // Helper: Extract numeric permission IDs from a group object
  const extractGroupPermissionIds = (grp) => {
    if (!grp) return [];
    if (Array.isArray(grp.permissions)) {
      return grp.permissions
        .map((p) => (typeof p === 'object' && p !== null ? Number(p.id) : Number(p)))
        .filter((n) => !isNaN(n) && n > 0);
    }
    if (grp.permissions_name && typeof grp.permissions_name === 'object') {
      const ids = [];
      Object.values(grp.permissions_name).forEach((list) => {
        if (Array.isArray(list)) {
          list.forEach((p) => {
            const id = typeof p === 'object' && p !== null ? Number(p.id) : Number(p);
            if (!isNaN(id) && id > 0) ids.push(id);
          });
        }
      });
      return ids;
    }
    return [];
  };

  // Open Edit Modal for a group
  const handleOpenEditModal = (grp) => {
    setEditingGroup(grp);
    setEditGroupName(grp.name || '');
    const currentIds = extractGroupPermissionIds(grp);
    setEditSelectedPermissions(currentIds);
    setEditSearchTerm('');
    fetchPermissions();
  };

  // Toggle individual permission in edit modal
  const toggleEditPermission = (id) => {
    const numId = Number(id);
    setEditSelectedPermissions((prev) =>
      prev.includes(numId) ? prev.filter((p) => p !== numId) : [...prev, numId]
    );
  };

  // Toggle category all in edit modal
  const toggleEditCategoryAll = (categoryItems) => {
    const itemIds = categoryItems.map((p) => Number(p.id));
    const allSelected = itemIds.every((id) => editSelectedPermissions.includes(id));
    if (allSelected) {
      setEditSelectedPermissions((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setEditSelectedPermissions((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const toggleEditCategoryCollapse = (cat) => {
    setEditCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const selectAllEditPermissions = () => {
    const allIds = [];
    Object.values(permissionsCatalog).forEach((items) => {
      if (Array.isArray(items)) {
        items.forEach((p) => allIds.push(Number(p.id)));
      }
    });
    setEditSelectedPermissions(Array.from(new Set(allIds)));
  };

  const clearAllEditPermissions = () => {
    setEditSelectedPermissions([]);
  };

  // Submit Update Group: Calls PUT/PATCH /api/v1/users/groups/{id}/update_group/
  const handleUpdateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!editingGroup) return;

    const trimmedName = editGroupName.trim();
    if (!trimmedName) {
      showToast('Group name is required.', 'error');
      return;
    }

    if (editSelectedPermissions.length === 0) {
      showToast('Please select at least one permission.', 'error');
      return;
    }

    setUpdateLoading(true);

    const payload = {
      name: trimmedName,
      permissions: editSelectedPermissions.map(Number)
    };

    try {
      // Calls /api/v1/users/groups/{id}/update_group/
      const response = await api.users.updateGroup(editingGroup.id, payload);

      showToast(`Group "${trimmedName}" permissions updated successfully!`, 'success');

      // Reconstruct permissions_name from permissionsCatalog for immediate UI update
      const updatedPermsMap = {};
      Object.entries(permissionsCatalog).forEach(([cat, list]) => {
        if (Array.isArray(list)) {
          const matching = list.filter((p) => editSelectedPermissions.includes(Number(p.id)));
          if (matching.length > 0) {
            updatedPermsMap[cat] = matching;
          }
        }
      });

      const updatedGroup = {
        ...editingGroup,
        ...(response && typeof response === 'object' ? response : {}),
        name: trimmedName,
        permissions: editSelectedPermissions.map(Number),
        permissions_name:
          response?.permissions_name ||
          (Object.keys(updatedPermsMap).length > 0 ? updatedPermsMap : editingGroup.permissions_name)
      };

      setGroups((prev) => prev.map((g) => (g.id === editingGroup.id ? updatedGroup : g)));

      if (selectedGroup && selectedGroup.id === editingGroup.id) {
        setSelectedGroup(updatedGroup);
      }

      cachedGroupsList = null;
      setEditingGroup(null);

      // Refresh in background
      fetchGroups(true);
    } catch (err) {
      console.error('Update group permissions error:', err);
      const msg =
        err?.data?.detail ||
        (Array.isArray(err?.data?.non_field_errors) ? err.data.non_field_errors.join(' ') : null) ||
        err?.message ||
        'Failed to update group permissions.';
      showToast(msg, 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (g.name || '').toLowerCase().includes(term);
    const idMatch = String(g.id).includes(term);
    return nameMatch || idMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Group Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure permission groups and category access
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Group</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search group name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#e8622a]"
          />
        </div>
        <span className="text-xs text-slate-400 text-right sm:text-left">
          Showing <strong>{filteredGroups.length}</strong> groups
        </span>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#e8622a] mx-auto flex items-center justify-center mb-3">
            <FolderTree className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No groups found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No groups match your search query.'
              : 'No permission groups exist yet. Click "Create New Group" to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const permsMap = group.permissions_name || {};
            const categories = Object.keys(permsMap);
            let totalPerms = 0;
            categories.forEach((cat) => {
              if (Array.isArray(permsMap[cat])) {
                totalPerms += permsMap[cat].length;
              }
            });

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-orange-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center font-bold text-sm">
                        <FolderTree className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {group.name}
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          Group ID: {group.id}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200">
                      {totalPerms} Perms
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {group.description || 'Configured group with scoped category permissions.'}
                  </p>

                  {/* Categories */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Permission Scopes:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200"
                          >
                            {cat} ({Array.isArray(permsMap[cat]) ? permsMap[cat].length : 0})
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Standard access</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(group)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white shadow-xs hover:shadow-sm active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: '#ea580c' }}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Permissions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                    title="View Permissions Details"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GROUP MODAL: Uses /api/v1/users/groups/create_group/ & /api/v1/users/groups/list_permissions/ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Create New Group
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define name and assign categorized security permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Error / Success Alerts */}
            {createError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{createSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateGroupSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Group Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Moderator, Content Lead..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#e8622a]"
                  required
                />
              </div>

              {/* Permissions Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Permissions <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Choose permissions to grant to this group
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Quick select category permissions [33, 34, 35, 36]
                        setSelectedPermissions([33, 34, 35, 36]);
                      }}
                      className="text-xs font-semibold text-[#e8622a] bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 hover:bg-orange-100 transition"
                    >
                      Select Category [33,34,35,36]
                    </button>
                    <span className="text-xs font-bold text-slate-600">
                      {selectedPermissions.length} selected
                    </span>
                  </div>
                </div>

                {/* Categories and Permissions List */}
                <div className="space-y-3 max-h-72 overflow-y-auto p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                  {Object.entries(permissionsCatalog).map(([category, items]) => {
                    const isCollapsed = Boolean(collapsedCategories[category]);
                    const itemIds = (Array.isArray(items) ? items : []).map((p) => Number(p.id));
                    const selectedCount = itemIds.filter((id) => selectedPermissions.includes(id)).length;
                    const allSelected = selectedCount === itemIds.length && itemIds.length > 0;

                    return (
                      <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                        {/* Category Header */}
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleCategoryCollapse(category)}
                            className="flex items-center gap-2 font-bold text-xs text-slate-800 hover:text-[#e8622a] transition"
                          >
                            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{category}</span>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono">
                              ({selectedCount}/{itemIds.length})
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCategoryAll(items)}
                            className="text-[11px] font-semibold text-[#e8622a] hover:underline"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {/* Category Permissions */}
                        {!isCollapsed && (
                          <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Array.isArray(items) && items.map((perm) => {
                              const isChecked = selectedPermissions.includes(Number(perm.id));
                              return (
                                <label
                                  key={perm.id}
                                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                    isChecked
                                      ? 'bg-orange-50/70 border-[#e8622a] text-slate-900 shadow-2xs'
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(perm.id)}
                                    className="mt-0.5 rounded text-[#e8622a] focus:ring-[#e8622a]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-800 truncate" title={perm.name}>
                                      {perm.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                      <span>ID: {perm.id}</span>
                                      <span>({perm.codename})</span>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>



              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {createLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Group...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Group</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#e8622a]" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedGroup.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedGroup.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedGroup.permissions_name && Object.keys(selectedGroup.permissions_name).length > 0 ? (
                Object.entries(selectedGroup.permissions_name).map(([category, perms]) => (
                  <div key={category} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                      {category}
                    </div>
                    <div className="space-y-1.5">
                      {Array.isArray(perms) && perms.map((p) => (
                        <div key={p.id || p.codename} className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 ml-2">({p.codename})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No explicit permissions object returned for this group.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const grp = selectedGroup;
                  setSelectedGroup(null);
                  handleOpenEditModal(grp);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:shadow-sm transition cursor-pointer"
                style={{ backgroundColor: '#ea580c' }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Permissions</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE GROUP PERMISSIONS MODAL: Calls /api/v1/users/groups/{id}/update_group/ */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      Update Group Permissions
                    </h3>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      ID: {editingGroup.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    /api/v1/users/groups/{editingGroup.id}/update_group/
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingGroup(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateGroupSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Group Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#e8622a]"
                  required
                />
              </div>

              {/* Permissions Header & Actions */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Assigned Permissions <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200">
                      {editSelectedPermissions.length} selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllEditPermissions}
                      className="text-[11px] font-semibold text-slate-600 hover:text-[#e8622a] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllEditPermissions}
                      className="text-[11px] font-semibold text-slate-600 hover:text-red-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Filter input */}
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editSearchTerm}
                    onChange={(e) => setEditSearchTerm(e.target.value)}
                    placeholder="Filter permissions by name or codename..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#e8622a]"
                  />
                </div>

                {/* Categorized Permissions Accordions */}
                <div className="space-y-3">
                  {Object.entries(permissionsCatalog).map(([category, items]) => {
                    const filteredItems = (Array.isArray(items) ? items : []).filter((p) => {
                      if (!editSearchTerm.trim()) return true;
                      const term = editSearchTerm.toLowerCase();
                      return (
                        (p.name || '').toLowerCase().includes(term) ||
                        (p.codename || '').toLowerCase().includes(term)
                      );
                    });

                    if (filteredItems.length === 0) return null;

                    const catIds = filteredItems.map((p) => Number(p.id));
                    const selectedCountInCat = catIds.filter((id) =>
                      editSelectedPermissions.includes(id)
                    ).length;
                    const allCatSelected =
                      catIds.length > 0 && selectedCountInCat === catIds.length;
                    const isCollapsed = Boolean(editCollapsedCategories[category]);

                    return (
                      <div
                        key={category}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                      >
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => toggleEditCategoryCollapse(category)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-[#e8622a] text-left cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{category}</span>
                            <span className="text-[10px] font-normal text-slate-500">
                              ({selectedCountInCat}/{filteredItems.length})
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleEditCategoryAll(filteredItems)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                              allCatSelected
                                ? 'bg-orange-50 text-[#e8622a] border-orange-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {allCatSelected ? 'Deselect Category' : 'Select Category'}
                          </button>
                        </div>

                        {!isCollapsed && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                            {filteredItems.map((p) => {
                              const isChecked = editSelectedPermissions.includes(Number(p.id));
                              return (
                                <label
                                  key={p.id}
                                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                    isChecked
                                      ? 'bg-orange-50/60 border-orange-200 text-slate-900'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleEditPermission(p.id)}
                                    className="mt-0.5 rounded text-[#e8622a] focus:ring-[#e8622a]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold leading-tight">{p.name}</div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                      {p.codename}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {updateLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes via API...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Group Permissions</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
