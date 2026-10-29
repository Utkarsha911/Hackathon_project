import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalPortal from '../common/ModalPortal';
import {
  Mail,
  Search,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  CheckCheck,
  RotateCcw,
  ShieldCheck,
  User
} from 'lucide-react';

const STATUS_CONFIG = {
  new: {
    label: 'New Inquiry',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  resolved: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  closed: {
    label: 'Closed',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export default function ContactManagement() {
  const { showToast } = useHackathon();

  // Data states
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    total_contacts: 0,
    new_contacts: 0,
    in_progress_contacts: 0,
    resolved_contacts: 0,
    closed_contacts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state (Backend-driven)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const searchDebounceRef = useRef(null);

  // View Details Modal
  const [viewingContact, setViewingContact] = useState(null);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(Boolean(viewingContact) || deleteModal.isOpen);

  // Fetch contacts from backend with backend-driven search and status filtering (Rule 6)
  const fetchContacts = useCallback(
    async (searchTerm = searchQuery, currentStatus = statusFilter) => {
      setIsLoading(true);
      try {
        const params = {};
        if (searchTerm?.trim()) {
          params.search = searchTerm.trim();
        }
        if (currentStatus && currentStatus !== 'all') {
          params.status = currentStatus;
        }

        const res = await api.contacts.getAll(params, { forceRefresh: true });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
          ? res.results
          : [];
        setContacts(list);

        if (res?.stats) {
          setStats(res.stats);
        } else {
          setStats({
            total_contacts: list.length,
            new_contacts: list.filter((c) => c.status === 'new').length,
            in_progress_contacts: list.filter((c) => c.status === 'in_progress').length,
            resolved_contacts: list.filter((c) => c.status === 'resolved').length,
            closed_contacts: list.filter((c) => c.status === 'closed').length,
          });
        }
      } catch (err) {
        console.error('Failed to load contacts:', err);
        showToast(err?.message || 'Failed to load contact inquiries.', 'error');
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, statusFilter, showToast]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Debounced search handler (Rule 6)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchContacts(val, statusFilter);
    }, 350);
  };

  // Status dropdown filter handler (Rule 6)
  const handleStatusFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchContacts(searchQuery, val);
  };

  // Status changer
  const handleUpdateStatus = async (contactId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await api.contacts.patch(contactId, { status: newStatus });
      showToast(`Inquiry marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}.`, 'success');
      if (viewingContact && viewingContact.id === contactId) {
        setViewingContact((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      fetchContacts(searchQuery, statusFilter);
    } catch (err) {
      console.error('Failed to update contact status:', err);
      showToast(err?.message || 'Failed to update status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete contact
  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    setIsDeleting(true);
    try {
      await api.contacts.delete(deleteModal.item.id);
      showToast('Contact inquiry deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, item: null });
      if (viewingContact?.id === deleteModal.item.id) {
        setViewingContact(null);
      }
      fetchContacts(searchQuery, statusFilter);
    } catch (err) {
      console.error('Failed to delete contact:', err);
      showToast(err?.message || 'Failed to delete contact.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Standard Unboxed Header - Rule 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Contact Inquiries
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Incoming public inquiries submitted by participants, sponsors, and mentors
          </p>
        </div>
      </div>

      {/* 2. KPI Stat Cards (Consuming Backend Stats - Rule 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {/* Total Inquiries */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Total Inquiries
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center text-[#ea580c] shrink-0">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-slate-900 font-mono truncate">
              {stats.total_contacts ?? contacts.length}
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">Inquiries received</p>
          </div>
        </div>

        {/* New Inquiries */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              New Unresolved
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-sky-700 font-mono truncate">
              {stats.new_contacts ?? 0}
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">Awaiting response</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              In Progress
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-amber-700 font-mono truncate">
              {stats.in_progress_contacts ?? 0}
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">Under committee review</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Resolved
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-3">
            <div className="text-base sm:text-2xl font-bold text-emerald-700 font-mono truncate">
              {stats.resolved_contacts ?? 0}
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-1">Addressed inquiries</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar (Backend-Driven - Rule 6) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or message..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition"
          >
            <option value="all">All Inquiries ({stats.total_contacts ?? contacts.length})</option>
            <option value="new">New ({stats.new_contacts ?? 0})</option>
            <option value="in_progress">In Progress ({stats.in_progress_contacts ?? 0})</option>
            <option value="resolved">Resolved ({stats.resolved_contacts ?? 0})</option>
            <option value="closed">Closed ({stats.closed_contacts ?? 0})</option>
          </select>
        </div>
      </div>

      {/* 4. Contact Inquiries Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
            <p className="text-sm">Loading contact inquiries from backend...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Inquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No inquiries match your current search query or status filter.'
                : 'No contact messages have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => {
                  const statusConf = STATUS_CONFIG[contact.status] || STATUS_CONFIG.new;
                  return (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-50/60 transition group cursor-pointer"
                      onClick={() => setViewingContact(contact)}
                    >
                      {/* Sender */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#ea580c] font-bold text-xs flex items-center justify-center shrink-0">
                            {contact.name ? contact.name[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {contact.name || 'Anonymous'}
                            </p>
                            <a
                              href={`mailto:${contact.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-slate-500 hover:text-[#ea580c] font-mono truncate block"
                            >
                              {contact.email}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Message Snippet */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {contact.message || '—'}
                        </p>
                      </td>

                      {/* Status (Static solid dot - Rule 9) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusConf.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dotClass}`} />
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Received Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap font-mono">
                        {formatDate(contact.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingContact(contact)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="View Full Inquiry Details"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <a
                            href={`mailto:${contact.email}?subject=Re: BIC Hackathon Inquiry&body=Hi ${contact.name || 'there'},%0D%0A%0D%0A`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition"
                            title="Reply via Email"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, item: contact })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Inquiry"
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

      {/* 5. View Inquiry Details Modal */}
      <ModalPortal>
      {viewingContact && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Inquiry Details</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Received {formatDate(viewingContact.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingContact(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Sender Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                    Sender Information
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{viewingContact.name || 'Anonymous'}</p>
                  <a
                    href={`mailto:${viewingContact.email}`}
                    className="text-xs text-[#ea580c] font-mono hover:underline block mt-0.5"
                  >
                    {viewingContact.email}
                  </a>
                </div>
                <a
                  href={`mailto:${viewingContact.email}?subject=Re: BIC Hackathon Inquiry&body=Hi ${viewingContact.name || 'there'},%0D%0A%0D%0A`}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Reply Email</span>
                </a>
              </div>

              {/* Status Section */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Update Inquiry Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const isActive = viewingContact.status === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus(viewingContact.id, key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                          isActive
                            ? `${config.badgeClass} ring-2 ring-[#ea580c]/30 font-bold`
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                        <span>{config.label}</span>
                        {isActive && <CheckCheck className="w-3.5 h-3.5 ml-0.5 text-slate-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Full Inquiry Message
                </span>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {viewingContact.message}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: true, item: viewingContact })}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Inquiry</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingContact(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Contact Inquiry?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete the inquiry from{' '}
                <strong className="text-slate-800">{deleteModal.item?.name || 'this sender'}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 transition flex items-center justify-center gap-2"
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
        </div>
      )}
      </ModalPortal>
    </div>
  );
}
