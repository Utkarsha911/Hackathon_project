import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, getSelectedAdminHackathon } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileText
} from 'lucide-react';

export default function DepartmentManagement() {
  const { showToast } = useHackathon();

  // Data states
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, active_items: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Available hackathons for select dropdown in modals
  const [hackathonsList, setHackathonsList] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({
    name: '',
    description: '',
    hackathon: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(isModalOpen || deleteModal.isOpen);

  // Fetch hackathons for form selection
  useEffect(() => {
    api.hackathons
      .getAll({ skipHackathonFilter: true })
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
          ? res.results
          : res?.data || [];
        setHackathonsList(list);
      })
      .catch((err) => {
        console.warn('Failed to load hackathons list in DepartmentManagement:', err);
      });
  }, []);

  // Fetch departments from backend with backend-driven search
  const fetchDepartments = useCallback(
    async (searchTerm = searchQuery) => {
      setIsLoading(true);
      try {
        const params = {};
        if (searchTerm?.trim()) {
          params.search = searchTerm.trim();
        }
        const res = await api.departments.getAll(params, { forceRefresh: true });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
          ? res.results
          : [];
        setDepartments(list);
        if (res?.stats) {
          setStats(res.stats);
        } else {
          setStats({ total_items: list.length, active_items: list.length });
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
        showToast(err?.message || 'Failed to load departments.', 'error');
        setDepartments([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, showToast]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Listen for global hackathon edition changes
  useEffect(() => {
    const handleHackathonChange = () => {
      fetchDepartments();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    return () => {
      window.removeEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    };
  }, [fetchDepartments]);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchDepartments(val);
    }, 350);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDepartment(null);
    const activeHackathon = getSelectedAdminHackathon();
    setForm({
      name: '',
      description: '',
      hackathon: activeHackathon && activeHackathon !== 'all' ? activeHackathon : '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept) => {
    setEditingDepartment(dept);
    const hackathonVal =
      typeof dept.hackathon === 'object' && dept.hackathon !== null
        ? dept.hackathon.id
        : dept.hackathon || '';
    setForm({
      name: dept.name || dept.title || '',
      description: dept.description || '',
      hackathon: hackathonVal,
    });
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Please enter a department name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        title: form.name.trim(),
        description: form.description.trim(),
      };
      if (form.hackathon) {
        payload.hackathon = form.hackathon;
      }

      if (editingDepartment) {
        await api.departments.update(editingDepartment.id, payload);
        showToast('Department updated successfully.', 'success');
      } else {
        await api.departments.create(payload);
        showToast('Department created successfully.', 'success');
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to save department:', err);
      showToast(err?.message || 'Failed to save department.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (dept) => {
    setDeleteModal({
      isOpen: true,
      item: dept,
    });
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    setIsDeleting(true);
    try {
      await api.departments.delete(deleteModal.item.id);
      showToast('Department deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, item: null });
      fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department:', err);
      showToast(err?.message || 'Failed to delete department.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Standard Unboxed Header - Rule 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Departments Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organizing committees and functional departments for task and officer assignments
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
          style={{ backgroundColor: '#ea580c' }}
        >
          <Plus className="w-4 h-4" />
          <span>Create Department</span>
        </button>
      </div>

      {/* 2. KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Departments
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c] shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-slate-900 font-mono truncate">
              {stats.total_items ?? departments.length}
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">Functional committees in system</p>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Status
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-emerald-700 font-mono truncate">
              Active
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">Available for organizer assignments</p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search departments..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          />
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
            <p className="text-sm">Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Departments Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No departments matched your search query.'
                : 'No departments have been added yet.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs cursor-pointer"
                style={{ backgroundColor: '#ea580c' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Department</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => {
                  const name = dept.name || dept.title || 'Untitled Department';
                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID: {dept.id?.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-md">
                        <p className="line-clamp-2 leading-relaxed text-xs">
                          {dept.description || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(dept)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Department"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(dept)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Department"
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

      {/* 5. Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDepartment ? 'Edit Department' : 'Create New Department'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure committee department details
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
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Operations, Logistics & Hospitality"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Associated Hackathon Edition <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={form.hackathon}
                  onChange={(e) => setForm({ ...form, hackathon: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition text-slate-700"
                >
                  <option value="">Global / All Hackathons</option>
                  {hackathonsList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title} {h.version ? `(${h.version})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Outline responsibilities and role assignments..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition resize-none"
                />
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
                  <span>{editingDepartment ? 'Save Changes' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Department?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800">
                  "{deleteModal.item?.name || deleteModal.item?.title}"
                </strong>
                ? This action cannot be undone.
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
