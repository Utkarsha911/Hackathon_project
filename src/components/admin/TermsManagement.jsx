// src/components/admin/TermsManagement.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Plus, Edit3, Trash2, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { api, getSelectedAdminHackathon } from "../../services/api";
import { useHackathon } from "../../context/HackathonContext";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import ModalPortal from "../common/ModalPortal";

const TermsManagement = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useHackathon();

  // Scroll lock for modal forms
  useBodyScrollLock(showForm);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const hackathonId = getSelectedAdminHackathon();
      const params = hackathonId ? { hackathon: hackathonId } : {};
      const data = await api.crm.getTerms(params);
      setTerms(data?.results ?? (Array.isArray(data) ? data : []));
    } catch (e) {
      console.error('Failed to fetch terms', e);
      showToast?.('Failed to load terms and conditions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const openCreate = () => {
    setFormData({ title: "", content: "" });
    setEditingTerm(null);
    setShowForm(true);
  };

  const openEdit = (term) => {
    setFormData({ title: term.title, content: term.content });
    setEditingTerm(term);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const hackathonId = getSelectedAdminHackathon();
      const payload = {
        ...formData,
        ...(hackathonId ? { hackathon: hackathonId } : {}),
      };
      if (editingTerm) {
        await api.crm.updateTerm(editingTerm.id, payload);
        showToast?.('Term updated successfully', 'success');
      } else {
        await api.crm.createTerm(payload);
        showToast?.('Term created successfully', 'success');
      }
      await fetchTerms();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving term', err);
      const data = err?.data;
      const nonFieldMsg = data?.non_field_errors?.[0];
      const titleMsg = data?.title?.[0];
      const detailMsg = data?.detail || err?.message;
      let errorMsg = 'Failed to save term';

      if (nonFieldMsg && nonFieldMsg.toLowerCase().includes('unique')) {
        errorMsg = 'Participation terms already exist for this hackathon.';
      } else if (data?.hackathon) {
        errorMsg = 'Participation terms already exist for this hackathon.';
      } else if (titleMsg) {
        errorMsg = `Title: ${titleMsg}`;
      } else if (detailMsg && typeof detailMsg === 'string' && !detailMsg.includes('{')) {
        errorMsg = detailMsg;
      }
      showToast?.(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this term?')) return;
    try {
      await api.crm.deleteTerm(id);
      showToast?.('Term deleted successfully', 'success');
      await fetchTerms();
    } catch (err) {
      console.error('Error deleting term', err);
      showToast?.('Failed to delete term', 'error');
    }
  };

  const existingTerm = terms.length > 0 ? terms[0] : null;

  return (
    <div className="space-y-6">
      {/* 1. Header (Standard Unboxed Flex Header - Rule 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Terms & Conditions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Participation policy and code of conduct for this hackathon edition.
          </p>
        </div>
        {existingTerm ? (
          <button
            onClick={() => openEdit(existingTerm)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Term</span>
          </button>
        ) : (
          <button
            onClick={openCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
            style={{ backgroundColor: '#ea580c' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Term</span>
          </button>
        )}
      </div>

      {/* 2. Compact KPI Stats Cards (Mobile Responsive) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Participation Term
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c] shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-slate-900 font-mono truncate">
              {existingTerm ? '1 / 1 Configured' : '0 / 1 Pending'}
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">
              {existingTerm ? 'Single policy active for edition' : 'No term published yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Registration Agreement
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-emerald-700 font-mono truncate">
              Enforced
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">Visible on team signup</p>
          </div>
        </div>
      </div>

      {/* 3. Terms Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#ea580c]" />
        </div>
      ) : terms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No participation terms found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "Add Term" above to publish participation guidelines for this hackathon.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {terms.map((term) => (
            <div key={term.id} className="rounded-xl sm:rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800 line-clamp-1">{term.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(term)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit term"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(term.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete term"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div
                  className="text-xs text-slate-600 line-clamp-4 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: term.content }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
            <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
              <div className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
                <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingTerm ? 'Edit Term' : 'Create Participation Term'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Code of Conduct, Eligibility Rules"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Content (HTML or Text)
                      </label>
                      <textarea
                        required
                        rows={6}
                        placeholder="Enter participation terms clause content..."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]"
                      />
                    </div>
                  </div>

                  <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: '#ea580c' }}
                    >
                      {isSubmitting ? 'Saving...' : editingTerm ? 'Update Term' : 'Create Term'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default TermsManagement;
