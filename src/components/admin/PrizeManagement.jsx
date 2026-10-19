import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, getSelectedAdminHackathon } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Trophy,
  Plus,
  Search,
  Edit3,
  Trash2,
  DollarSign,
  Award,
  X,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';

export default function PrizeManagement() {
  const { showToast } = useHackathon();

  // Data states
  const [prizes, setPrizes] = useState([]);
  const [stats, setStats] = useState({ total_prizes: 0, total_prize_money: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Available hackathons for select dropdown in modals
  const [hackathonsList, setHackathonsList] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({
    hackathon: '',
    title: '',
    description: '',
    prize_money: '',
    order: 0,
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
        console.warn('Failed to load hackathons list in PrizeManagement:', err);
      });
  }, []);

  // Fetch Prizes from backend with backend-driven search (Rule 6 & 7)
  const fetchPrizes = useCallback(
    async (searchTerm = searchQuery) => {
      setIsLoading(true);
      try {
        const params = {};
        if (searchTerm?.trim()) {
          params.search = searchTerm.trim();
        }
        const res = await api.prizes.getAll(params, { forceRefresh: true });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
            ? res.results
            : [];
        setPrizes(list);
        if (res?.stats) {
          setStats(res.stats);
        } else {
          const totalMoney = list.reduce((acc, p) => acc + (Number(p.prize_money) || 0), 0);
          setStats({ total_prizes: list.length, total_prize_money: totalMoney });
        }
      } catch (err) {
        console.error('Failed to load prizes:', err);
        showToast(err?.message || 'Failed to load prizes.', 'error');
        setPrizes([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, showToast]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchPrizes();
  }, [fetchPrizes]);

  // Listen for global hackathon edition changes
  useEffect(() => {
    const handleHackathonChange = () => {
      fetchPrizes();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    return () => {
      window.removeEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    };
  }, [fetchPrizes]);

  // Debounced search handler (Rule 7)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchPrizes(val);
    }, 350);
  };

  // Helper to get fallback default hackathon ID
  const getDefaultHackathonId = () => {
    const stored = getSelectedAdminHackathon();
    if (stored && stored !== 'all') return stored;
    const current = hackathonsList.find((h) => h.is_current === true);
    if (current?.id) return current.id;
    return hackathonsList[0]?.id || '';
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPrize(null);
    setForm({
      hackathon: getDefaultHackathonId(),
      title: '',
      description: '',
      prize_money: '',
      order: prizes.length,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prize) => {
    setEditingPrize(prize);
    setForm({
      hackathon: prize.hackathon || getDefaultHackathonId(),
      title: prize.title || '',
      description: prize.description || '',
      prize_money: prize.prize_money || '',
      order: prize.order ?? 0,
    });
    setIsModalOpen(true);
  };

  // Submit Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Prize title is required.', 'error');
      return;
    }
    if (!form.hackathon) {
      showToast('Please select a hackathon edition.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        hackathon: form.hackathon,
        title: form.title.trim(),
        description: form.description.trim(),
        prize_money: form.prize_money !== '' ? String(form.prize_money) : null,
        order: Number(form.order) || 0,
      };

      if (editingPrize) {
        await api.prizes.update(editingPrize.id, payload);
        showToast('Prize updated successfully!', 'success');
      } else {
        await api.prizes.create(payload);
        showToast('Prize created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchPrizes();
    } catch (err) {
      console.error('Failed to save prize:', err);
      showToast(err?.message || 'Failed to save prize.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setIsDeleting(true);
    try {
      await api.prizes.delete(deleteModal.item.id);
      showToast('Prize deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, item: null });
      fetchPrizes();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(err?.message || 'Failed to delete prize.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getHackathonTitle = (id) => {
    const found = hackathonsList.find((h) => h.id === id);
    return found ? `${found.title} (${found.version || 'Active'})` : 'Hackathon Edition';
  };

  const totalPrizePoolFormatted = (
    Number(stats.total_prize_money) ||
    prizes.reduce((acc, p) => acc + (Number(p.prize_money) || 0), 0)
  ).toLocaleString();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Layout Standard (Rule 1: Unboxed flex header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Prize Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure cash awards, track bounties, and grants across platform hackathon editions
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Prize</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Rule 4: Consume backend stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Prizes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Prizes
            </span>

          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats.total_prizes ?? prizes.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Award tiers configured</p>
          </div>
        </div>

        {/* Total Prize Pool */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Prize Pool
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              NPR {totalPrizePoolFormatted}
            </div>
            <p className="text-xs text-slate-500 mt-1">Direct cash distribution</p>
          </div>
        </div>

        {/* Active API Status */}

      </div>

      {/* 3. Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search prizes by title or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchPrizes('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
          {prizes.length} {prizes.length === 1 ? 'Prize' : 'Prizes'} Loaded
        </span>
      </div>

      {/* 4. Prizes Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#ea580c] animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading prizes from backend...</span>
        </div>
      ) : prizes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No prizes found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No prizes match your search criteria. Try a different query.'
              : 'Add your first prize tier to get started with awards distribution.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Prize</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-16">Rank / Order</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Cash Bounty</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Hackathon Edition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prizes.map((prize) => {
                  const amount = Number(prize.prize_money) || 0;
                  return (
                    <tr key={prize.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{prize.order ?? 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{prize.title}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {amount > 0 ? `NPR ${amount.toLocaleString()}` : 'Trophy / Grant'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={prize.description}>
                        {prize.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">
                            {getHackathonTitle(prize.hackathon)}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prize)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                            title="Edit Prize"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                item: prize,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Prize"
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
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#ea580c]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPrize ? 'Edit Prize' : 'Create New Prize'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Hackathon Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hackathon Edition <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.hackathon}
                  onChange={(e) => setForm({ ...form, hackathon: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                  required
                >
                  <option value="">Select a hackathon...</option>
                  {hackathonsList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title} ({h.version || 'Active'}{h.is_current ? ' ★ Current' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Order */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prize Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Grand Champion, 1st Runner Up"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order / Rank
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                  />
                </div>
              </div>

              {/* Prize Money */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prize Money (NPR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    NPR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.prize_money}
                    onChange={(e) => setForm({ ...form, prize_money: e.target.value })}
                    placeholder="e.g. 50000.00"
                    className="w-full pl-12 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Perks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details regarding cloud compute credits, trophies, certificates, incubation opportunities..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
                  style={{ backgroundColor: '#ea580c' }}
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPrize ? 'Save Changes' : 'Create Prize'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 shadow-2xl animate-fade-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Delete Prize?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">
                {deleteModal.item?.title}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
