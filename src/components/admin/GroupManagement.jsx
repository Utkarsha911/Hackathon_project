import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Plus,
  Shield,
  Key,
  Search,
  RefreshCw,
  FolderTree,
  Lock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Code2,
  Sparkles
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

const INITIAL_GROUPS = [
  {
    id: 12,
    name: 'Something',
    description: 'Category & content management permissions',
    permissions_name: {
      Category: [
        { id: 33, name: 'Can add Category', codename: 'add_category' },
        { id: 34, name: 'Can change Category', codename: 'change_category' },
        { id: 35, name: 'Can delete Category', codename: 'delete_category' },
        { id: 36, name: 'Can view Category', codename: 'view_category' }
      ]
    }
  }
];

export default function GroupManagement() {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Create Group Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [permissionsCatalog, setPermissionsCatalog] = useState(FALLBACK_PERMISSIONS);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Form State: matches { "name": "Something", "permissions": [33, 34, 35, 36] }
  const [groupName, setGroupName] = useState('Something');
  const [selectedPermissions, setSelectedPermissions] = useState([33, 34, 35, 36]);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // 1. Fetch Groups list from GET /api/v1/users/groups/list_groups/
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.users.listGroups();
      const list = Array.isArray(response)
        ? response
        : response?.results || response?.data || [];
      if (list && list.length > 0) {
        setGroups(list);
      }
    } catch (err) {
      console.warn('Group list API error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Permissions from GET /api/v1/users/groups/list_permissions/
  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const response = await api.users.listPermissions();
      if (response && typeof response === 'object' && Object.keys(response).length > 0) {
        setPermissionsCatalog(response);
      }
    } catch (err) {
      console.warn('Permissions list API error, using catalog fallback:', err);
      // Fallback is already initialized
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
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
        fetchGroups();
      }, 1400);
    } catch (err) {
      console.error('Create group error:', err);
      const detail = err.message || 'Failed to create group.';
      setCreateError(detail);
    } finally {
      setCreateLoading(false);
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#e8622a]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Group</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
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
        <span className="text-xs text-slate-400">
          Showing <strong>{filteredGroups.length}</strong> groups
        </span>
      </div>

      {/* Groups Grid */}
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

              <button
                type="button"
                onClick={() => setSelectedGroup(group)}
                className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-semibold text-[#e8622a] bg-orange-50/70 hover:bg-orange-100 border border-orange-200 transition flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>View Full Permissions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* CREATE GROUP MODAL: Uses /api/v1/users/groups/create_group/ & /api/v1/users/groups/list_permissions/ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[92vh] flex flex-col my-auto">
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
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Something, Moderator, Content Lead..."
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#e8622a]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setGroupName('Something')}
                    className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    title="Set name to 'Something'"
                  >
                    Use &quot;Something&quot;
                  </button>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
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

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
