import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, getSelectedAdminHackathon } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  HelpCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
  Layers
} from 'lucide-react';

export default function FaqManagement() {
  const { showToast } = useHackathon();

  // Data states
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, active_items: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Available hackathons for select dropdown in modals
  const [hackathonsList, setHackathonsList] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({
    hackathon: '',
    question: '',
    answer: '',
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
        console.warn('Failed to load hackathons list in FaqManagement:', err);
      });
  }, []);

  // Fetch FAQs from backend with backend-driven search (Rule 6 & 7)
  const fetchFaqs = useCallback(
    async (searchTerm = searchQuery) => {
      setIsLoading(true);
      try {
        const params = {};
        if (searchTerm?.trim()) {
          params.search = searchTerm.trim();
        }
        const res = await api.faqs.getAll(params, { forceRefresh: true });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
          ? res.results
          : [];
        setFaqs(list);
        if (res?.stats) {
          setStats(res.stats);
        } else {
          setStats({ total_items: list.length, active_items: list.length });
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
        showToast(err?.message || 'Failed to load FAQs.', 'error');
        setFaqs([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, showToast]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Listen for global hackathon edition changes
  useEffect(() => {
    const handleHackathonChange = () => {
      fetchFaqs();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    return () => {
      window.removeEventListener('bic_admin_hackathon_changed', handleHackathonChange);
    };
  }, [fetchFaqs]);

  // Debounced search handler (Rule 7)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchFaqs(val);
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
    setEditingFaq(null);
    setForm({
      hackathon: getDefaultHackathonId(),
      question: '',
      answer: '',
      order: faqs.length,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setForm({
      hackathon: faq.hackathon || getDefaultHackathonId(),
      question: faq.question || '',
      answer: faq.answer || '',
      order: faq.order ?? 0,
    });
    setIsModalOpen(true);
  };

  // Submit Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim()) {
      showToast('FAQ question is required.', 'error');
      return;
    }
    if (!form.answer.trim()) {
      showToast('FAQ answer is required.', 'error');
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
        question: form.question.trim(),
        answer: form.answer.trim(),
        order: Number(form.order) || 0,
      };

      if (editingFaq) {
        await api.faqs.update(editingFaq.id, payload);
        showToast('FAQ updated successfully!', 'success');
      } else {
        await api.faqs.create(payload);
        showToast('FAQ created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      showToast(err?.message || 'Failed to save FAQ.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setIsDeleting(true);
    try {
      await api.faqs.delete(deleteModal.item.id);
      showToast('FAQ deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, item: null });
      fetchFaqs();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(err?.message || 'Failed to delete FAQ.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getHackathonTitle = (id) => {
    const found = hackathonsList.find((h) => h.id === id);
    return found ? `${found.title} (${found.version || 'Active'})` : 'Hackathon Edition';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Layout Standard (Rule 1: Unboxed flex header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            FAQ Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage frequently asked questions, participant rules, and hacker guidelines
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
            <span>Add FAQ</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Rule 4: Consume backend stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total FAQs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total FAQs
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c]">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats.total_items ?? faqs.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Questions configured in CRM</p>
          </div>
        </div>

        {/* Active FAQs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Published FAQs
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-700 font-mono">
              {stats.active_items ?? faqs.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Publicly displayed to participants</p>
          </div>
        </div>

        {/* Active API Status */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Backend Endpoint
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>FAQs API Live</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
              /api/v1/hackathons-crm/faqs/
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search FAQs by question or answer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchFaqs('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
          {faqs.length} {faqs.length === 1 ? 'Question' : 'Questions'} Loaded
        </span>
      </div>

      {/* 4. FAQs Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-[#ea580c] animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading FAQs from backend...</span>
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No FAQs found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No FAQs match your search query. Try another keyword.'
              : 'Add your first frequently asked question to provide guidance to applicants.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create FAQ</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-16">Display Order</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Answer</th>
                  <th className="py-3 px-4">Hackathon Edition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faqs.map((faq) => {
                  return (
                    <tr key={faq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{faq.order ?? 0}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">{faq.question}</div>
                      </td>
                      <td className="py-3 px-4 max-w-md truncate" title={faq.answer}>
                        {faq.answer || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">
                            {getHackathonTitle(faq.hackathon)}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(faq)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                            title="Edit FAQ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                item: faq,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete FAQ"
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
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Endpoint: <code className="font-mono text-slate-600">/api/v1/hackathons-crm/faqs/</code>
                  </p>
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

              {/* Order */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                />
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="e.g. Who can participate in the hackathon?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                  required
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="4"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Detailed explanation answering eligibility, hardware, food, rules, or prizes..."
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
                  <span>{editingFaq ? 'Save Changes' : 'Create FAQ'}</span>
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
              Delete FAQ?
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">
                {deleteModal.item?.question}
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
