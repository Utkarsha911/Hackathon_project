import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getMediaUrl } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Building2,
  Package,
  Layers,
  PieChart,
  Plus,
  Search,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ChevronRight,
  Shield,
  Tag,
  Calendar,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

const EMPTY_SPONSOR = {
  name: '',
  description: '',
  logo: '',
  facebook_link: '',
  twitter_link: '',
  linkedin_link: '',
  website_link: '',
  instagram_link: '',
  contact_email: '',
  phone_number1: '',
  phone_number2: '',
  location: '',
  service: ''
};

const EMPTY_PACKAGE = {
  hackathon: '',
  sponsor_type: '',
  benefits: '',
  notes: ''
};

const EMPTY_PACKAGE_TYPE = {
  name: '',
  description: ''
};

export default function SponsorManagement() {
  const { showToast } = useHackathon();
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'sponsors';
  const tabFromUrl = rawTab === 'directory' ? 'sponsors' : rawTab;

  // Active Tab: 'sponsors' | 'packages' | 'types' | 'breakdown'
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'sponsors');

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Loading & Refresh State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data Collections
  const [sponsors, setSponsors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [packageTypes, setPackageTypes] = useState([]);
  const [hackathons, setHackathons] = useState([]);

  // Stats from backend API: { total_items, active_items, inactive_items }
  const [sponsorStats, setSponsorStats] = useState(null);
  const [packageStats, setPackageStats] = useState(null);
  const [typeStats, setTypeStats] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHackathonFilter, setSelectedHackathonFilter] = useState('all');

  // Modal States - Sponsors
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [sponsorForm, setSponsorForm] = useState(EMPTY_SPONSOR);
  const [editingSponsorId, setEditingSponsorId] = useState(null);
  const [viewingSponsor, setViewingSponsor] = useState(null);
  const [deletingSponsor, setDeletingSponsor] = useState(null);

  // Modal States - Packages
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState(EMPTY_PACKAGE);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [deletingPackage, setDeletingPackage] = useState(null);

  // Modal States - Package Types
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState(EMPTY_PACKAGE_TYPE);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [deletingType, setDeletingType] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when any modal is open
  const isAnyModalOpen = Boolean(
    isSponsorModalOpen ||
    viewingSponsor ||
    deletingSponsor ||
    isPackageModalOpen ||
    deletingPackage ||
    isTypeModalOpen ||
    deletingType
  );
  useBodyScrollLock(isAnyModalOpen);

  // Fetch all related entities
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [sponsorsRes, packagesRes, typesRes, hackathonsRes] = await Promise.all([
        api.sponsors.getAll().catch(() => ({ results: [] })),
        api.sponsors.getPackages().catch(() => ({ results: [] })),
        api.sponsors.getPackageTypes().catch(() => ({ results: [] })),
        api.hackathons.getAll().catch(() => ({ results: [] }))
      ]);

      const unwrap = (res) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.results)) return res.results;
        if (Array.isArray(res?.data)) return res.data;
        return [];
      };

      setSponsors(unwrap(sponsorsRes));
      setPackages(unwrap(packagesRes));
      setPackageTypes(unwrap(typesRes));
      setHackathons(unwrap(hackathonsRes));

      // Capture API stats if present
      if (sponsorsRes?.stats) setSponsorStats(sponsorsRes.stats);
      if (packagesRes?.stats) setPackageStats(packagesRes.stats);
      if (typesRes?.stats) setTypeStats(typesRes.stats);

      if (isManual) {
        showToast('Sponsor data refreshed successfully', 'success');
      }
    } catch (err) {
      console.warn('Failed to fetch sponsor data:', err);
      showToast('Could not load sponsor data. Please try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered sponsors
  const filteredSponsors = useMemo(() => {
    if (!searchQuery.trim()) return sponsors;
    const q = searchQuery.toLowerCase();
    return sponsors.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const service = (s.service || '').toLowerCase();
      const location = (s.location || '').toLowerCase();
      const email = (s.contact_email || '').toLowerCase();
      return name.includes(q) || service.includes(q) || location.includes(q) || email.includes(q);
    });
  }, [sponsors, searchQuery]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    let list = packages;
    if (selectedHackathonFilter !== 'all') {
      list = list.filter((p) => p.hackathon === selectedHackathonFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const notes = (p.notes || '').toLowerCase();
        const benefits = typeof p.benefits === 'string' ? p.benefits.toLowerCase() : JSON.stringify(p.benefits || '').toLowerCase();
        return notes.includes(q) || benefits.includes(q);
      });
    }
    return list;
  }, [packages, selectedHackathonFilter, searchQuery]);

  // Filtered package types
  const filteredPackageTypes = useMemo(() => {
    if (!searchQuery.trim()) return packageTypes;
    const q = searchQuery.toLowerCase();
    return packageTypes.filter((t) => {
      const name = (t.name || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [packageTypes, searchQuery]);

  // Helper maps for quick label lookup
  const hackathonMap = useMemo(() => {
    const map = new Map();
    hackathons.forEach((h) => map.set(h.id, h.title || h.name || 'Hackathon'));
    return map;
  }, [hackathons]);

  const packageTypeMap = useMemo(() => {
    const map = new Map();
    packageTypes.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [packageTypes]);

  // -------------------------------------------------------------
  // Sponsor Handlers
  // -------------------------------------------------------------
  const handleOpenCreateSponsor = () => {
    setEditingSponsorId(null);
    setSponsorForm(EMPTY_SPONSOR);
    setIsSponsorModalOpen(true);
  };

  const handleOpenEditSponsor = (sponsor) => {
    setEditingSponsorId(sponsor.id);
    setSponsorForm({
      name: sponsor.name || '',
      description: sponsor.description || '',
      logo: sponsor.logo || '',
      facebook_link: sponsor.facebook_link || '',
      twitter_link: sponsor.twitter_link || '',
      linkedin_link: sponsor.linkedin_link || '',
      website_link: sponsor.website_link || '',
      instagram_link: sponsor.instagram_link || '',
      contact_email: sponsor.contact_email || '',
      phone_number1: sponsor.phone_number1 || '',
      phone_number2: sponsor.phone_number2 || '',
      location: sponsor.location || '',
      service: sponsor.service || ''
    });
    setIsSponsorModalOpen(true);
  };

  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) {
      showToast('Sponsor organization name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: sponsorForm.name.trim(),
        description: sponsorForm.description.trim() || null,
        contact_email: sponsorForm.contact_email.trim() || null,
        phone_number1: sponsorForm.phone_number1.trim() || null,
        phone_number2: sponsorForm.phone_number2.trim() || null,
        location: sponsorForm.location.trim() || null,
        service: sponsorForm.service.trim() || null,
        website_link: sponsorForm.website_link.trim() || null,
        facebook_link: sponsorForm.facebook_link.trim() || null,
        twitter_link: sponsorForm.twitter_link.trim() || null,
        linkedin_link: sponsorForm.linkedin_link.trim() || null,
        instagram_link: sponsorForm.instagram_link.trim() || null
      };

      if (editingSponsorId) {
        await api.sponsors.patch(editingSponsorId, payload);
        showToast('Sponsor updated successfully', 'success');
      } else {
        await api.sponsors.create(payload);
        showToast('Sponsor registered successfully', 'success');
      }

      setIsSponsorModalOpen(false);
      setEditingSponsorId(null);
      setSponsorForm(EMPTY_SPONSOR);
      fetchData();
    } catch (err) {
      console.warn('Save sponsor error:', err);
      showToast(err?.message || 'Failed to save sponsor details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSponsor = async () => {
    if (!deletingSponsor?.id) return;
    setSubmitting(true);
    try {
      await api.sponsors.delete(deletingSponsor.id);
      showToast('Sponsor removed successfully', 'success');
      setDeletingSponsor(null);
      fetchData();
    } catch (err) {
      console.warn('Delete sponsor error:', err);
      showToast(err?.message || 'Failed to delete sponsor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Package Handlers
  // -------------------------------------------------------------
  const handleOpenCreatePackage = () => {
    setEditingPackageId(null);
    setPackageForm({
      hackathon: hackathons[0]?.id || '',
      sponsor_type: packageTypes[0]?.id || '',
      benefits: '',
      notes: ''
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackageId(pkg.id);
    setPackageForm({
      hackathon: pkg.hackathon || '',
      sponsor_type: pkg.sponsor_type || '',
      benefits: typeof pkg.benefits === 'object' ? JSON.stringify(pkg.benefits) : (pkg.benefits || ''),
      notes: pkg.notes || ''
    });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!packageForm.hackathon) {
      showToast('Please select a hackathon', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let formattedBenefits = packageForm.benefits;
      if (typeof formattedBenefits === 'string' && (formattedBenefits.startsWith('{') || formattedBenefits.startsWith('['))) {
        try {
          formattedBenefits = JSON.parse(formattedBenefits);
        } catch {
          // Keep as string if invalid JSON
        }
      }

      const payload = {
        hackathon: packageForm.hackathon,
        sponsor_type: packageForm.sponsor_type || null,
        benefits: formattedBenefits || null,
        notes: packageForm.notes.trim() || null
      };

      if (editingPackageId) {
        await api.sponsors.patchPackage(editingPackageId, payload);
        showToast('Sponsor package updated successfully', 'success');
      } else {
        await api.sponsors.createPackage(payload);
        showToast('Sponsor package created successfully', 'success');
      }

      setIsPackageModalOpen(false);
      setEditingPackageId(null);
      setPackageForm(EMPTY_PACKAGE);
      fetchData();
    } catch (err) {
      console.warn('Save package error:', err);
      showToast(err?.message || 'Failed to save sponsor package.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deletingPackage?.id) return;
    setSubmitting(true);
    try {
      await api.sponsors.deletePackage(deletingPackage.id);
      showToast('Sponsor package deleted successfully', 'success');
      setDeletingPackage(null);
      fetchData();
    } catch (err) {
      console.warn('Delete package error:', err);
      showToast(err?.message || 'Failed to delete package.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Package Type Handlers
  // -------------------------------------------------------------
  const handleOpenCreateType = () => {
    setEditingTypeId(null);
    setTypeForm(EMPTY_PACKAGE_TYPE);
    setIsTypeModalOpen(true);
  };

  const handleOpenEditType = (typeItem) => {
    setEditingTypeId(typeItem.id);
    setTypeForm({
      name: typeItem.name || '',
      description: typeItem.description || ''
    });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      showToast('Package type name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: typeForm.name.trim(),
        description: typeForm.description.trim() || null
      };

      if (editingTypeId) {
        await api.sponsors.patchPackageType(editingTypeId, payload);
        showToast('Package type updated successfully', 'success');
      } else {
        await api.sponsors.createPackageType(payload);
        showToast('Package type created successfully', 'success');
      }

      setIsTypeModalOpen(false);
      setEditingTypeId(null);
      setTypeForm(EMPTY_PACKAGE_TYPE);
      fetchData();
    } catch (err) {
      console.warn('Save package type error:', err);
      showToast(err?.message || 'Failed to save package type.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteType = async () => {
    if (!deletingType?.id) return;
    setSubmitting(true);
    try {
      await api.sponsors.deletePackageType(deletingType.id);
      showToast('Package type removed successfully', 'success');
      setDeletingType(null);
      fetchData();
    } catch (err) {
      console.warn('Delete package type error:', err);
      showToast(err?.message || 'Failed to delete package type.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {activeTab === 'sponsors' && 'Sponsors Directory'}
            {activeTab === 'packages' && 'Sponsor Packages'}
            {activeTab === 'types' && 'Package Types'}
            {activeTab === 'breakdown' && 'Sponsorship Breakdown'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeTab === 'sponsors' && 'Corporate partners, official logos, direct contact information, and partner perks'}
            {activeTab === 'packages' && 'Configured sponsorship packages, tier associations, allocated benefits, and internal notes'}
            {activeTab === 'types' && 'Define tier categories like Title Sponsor, Platinum, Gold, Food, and Community partners'}
            {activeTab === 'breakdown' && 'Executive overview of sponsorship allocation, tier metrics, and partner services across editions'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {activeTab === 'sponsors' && (
            <button
              type="button"
              onClick={handleOpenCreateSponsor}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
              style={{ backgroundColor: '#ea580c' }}
            >
              <Plus className="w-4 h-4" />
              <span>Register New Sponsor</span>
            </button>
          )}

          {activeTab === 'packages' && (
            <button
              type="button"
              onClick={handleOpenCreatePackage}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
              style={{ backgroundColor: '#ea580c' }}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Package</span>
            </button>
          )}

          {activeTab === 'types' && (
            <button
              type="button"
              onClick={handleOpenCreateType}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
              style={{ backgroundColor: '#ea580c' }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Package Type</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar - Populated directly from backend stats: { total_items, active_items, inactive_items } */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {activeTab === 'sponsors' && (
          <>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Sponsors</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {sponsorStats?.total_items ?? sponsors.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Corporate partners</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Active Sponsors</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {sponsorStats?.active_items ?? sponsors.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Currently active</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Inactive Sponsors</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {sponsorStats?.inactive_items ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Archived records</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Partner Services</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {sponsors.filter((s) => Boolean(s.service)).length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">In-kind / Tech perks</div>
            </div>
          </>
        )}

        {activeTab === 'packages' && (
          <>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Packages</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {packageStats?.total_items ?? packages.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Configured packages</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Active Packages</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {packageStats?.active_items ?? packages.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Active tiers</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Inactive Packages</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {packageStats?.inactive_items ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Archived tiers</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Hackathons Covered</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {new Set(packages.map((p) => p.hackathon).filter(Boolean)).size}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Distinct editions</div>
            </div>
          </>
        )}

        {activeTab === 'types' && (
          <>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Tier Types</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {typeStats?.total_items ?? packageTypes.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tier categories</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Active Categories</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {typeStats?.active_items ?? packageTypes.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Available for packages</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Inactive Categories</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {typeStats?.inactive_items ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Unpublished tiers</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Tiers in Use</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {new Set(packages.map((p) => p.sponsor_type).filter(Boolean)).size}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Allocated in packages</div>
            </div>
          </>
        )}

        {activeTab === 'breakdown' && (
          <>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Sponsors</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {sponsorStats?.total_items ?? sponsors.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Registered partners</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Sponsor Packages</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {packageStats?.total_items ?? packages.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tier configurations</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Active Categories</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {typeStats?.active_items ?? packageTypes.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tier types</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Inactive Records</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {(sponsorStats?.inactive_items || 0) + (packageStats?.inactive_items || 0) + (typeStats?.inactive_items || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Archived items</div>
            </div>
          </>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* TAB 1: SPONSORS DIRECTORY */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'sponsors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sponsors by name, service, location, email..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ea580c] transition"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono self-end sm:self-center">
              Showing {filteredSponsors.length} of {sponsors.length} sponsor{sponsors.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading && sponsors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-8 h-8 border-2 border-orange-200 border-t-[#ea580c] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading sponsor directory...</p>
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Sponsors Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No sponsors match your query.' : 'No sponsors have been registered yet. Add your first sponsor organization.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreateSponsor}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#d94e09] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Sponsor</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Service / Sponsorship</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Links</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSponsors.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {s.logo ? (
                              <img
                                src={getMediaUrl(s.logo)}
                                alt={s.name}
                                className="w-9 h-9 rounded-xl object-contain border border-slate-200 bg-white p-1 shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-xs shrink-0">
                                {(s.name?.[0] || 'S').toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{s.name}</span>
                              </div>
                              {s.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                                  {s.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {s.service ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50/80 text-[#ea580c] border border-orange-200/60 font-medium text-[11px]">
                              <Briefcase className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[180px]">{s.service}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            {s.contact_email && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="font-mono truncate max-w-[160px]">{s.contact_email}</span>
                              </div>
                            )}
                            {(s.phone_number1 || s.phone_number2) && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span className="font-mono">{s.phone_number1 || s.phone_number2}</span>
                              </div>
                            )}
                            {!s.contact_email && !s.phone_number1 && !s.phone_number2 && (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {s.location ? (
                            <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{s.location}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {s.website_link && (
                              <a
                                href={s.website_link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md text-slate-400 hover:text-[#ea580c] hover:bg-orange-50 transition"
                                title="Website"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {s.linkedin_link && (
                              <a
                                href={s.linkedin_link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="LinkedIn"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {s.facebook_link && (
                              <a
                                href={s.facebook_link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Facebook"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {!s.website_link && !s.linkedin_link && !s.facebook_link && (
                              <span className="text-slate-400 font-mono text-[11px]">—</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingSponsor(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSponsor(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                              title="Edit Sponsor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSponsor(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete Sponsor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 2: SPONSOR PACKAGES */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {/* Hackathon Filter & Search Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700">Filter by Hackathon:</span>
              <select
                value={selectedHackathonFilter}
                onChange={(e) => setSelectedHackathonFilter(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:border-[#ea580c]"
              >
                <option value="all">All Editions ({packages.length})</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title || h.name || 'Hackathon'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search perks, notes..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ea580c] transition"
                />
              </div>
              <span className="text-xs text-slate-500 font-mono shrink-0 hidden sm:inline">
                {filteredPackages.length} package{filteredPackages.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Packages Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No sponsorship packages created for this criteria. Define packages to outline perks and benefits for partners.
              </p>
              <button
                type="button"
                onClick={handleOpenCreatePackage}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#d94e09] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Package</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Edition / Hackathon</th>
                      <th className="py-3 px-4">Package Tier</th>
                      <th className="py-3 px-4">Allocated Benefits & Perks</th>
                      <th className="py-3 px-4">Internal Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
                            <span>{hackathonMap.get(pkg.hackathon) || 'Current Hackathon'}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{pkg.hackathon}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/70 font-semibold text-[11px]">
                            <Tag className="w-3 h-3 shrink-0" />
                            <span>{packageTypeMap.get(pkg.sponsor_type) || 'General Sponsorship'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {pkg.benefits ? (
                            <div className="max-w-md">
                              {typeof pkg.benefits === 'object' ? (
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(pkg.benefits) ? (
                                    pkg.benefits.map((b, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                        {String(b)}
                                      </span>
                                    ))
                                  ) : (
                                    Object.entries(pkg.benefits).map(([k, v], i) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                        {k}: {String(v)}
                                      </span>
                                    ))
                                  )}
                                </div>
                              ) : (
                                <p className="text-slate-600 text-[11px] line-clamp-2">
                                  {String(pkg.benefits)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">No benefits specified</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {pkg.notes ? (
                            <p className="text-slate-600 text-[11px] max-w-xs truncate">{pkg.notes}</p>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPackage(pkg)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                              title="Edit Package"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPackage(pkg)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete Package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 3: PACKAGE TYPES */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tier types by name, description..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ea580c] transition"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono self-end sm:self-center">
              Showing {filteredPackageTypes.length} of {packageTypes.length} tier{packageTypes.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredPackageTypes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Package Types Defined</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Set up sponsorship categories such as Title Partner, Platinum, Gold, Food Sponsor, etc.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateType}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#d94e09] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier Type</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPackageTypes.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-orange-200 hover:shadow-sm transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#ea580c] border border-orange-200/70 text-xs font-bold font-mono">
                        {t.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditType(t)}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#ea580c] hover:bg-orange-50 transition cursor-pointer"
                          title="Edit Type"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingType(t)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                      {t.description || 'No tier description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      Packages linked:{' '}
                      <strong className="text-slate-700">
                        {packages.filter((p) => p.sponsor_type === t.id).length}
                      </strong>
                    </span>
                    <span>UUID: {t.id?.slice?.(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 4: SPONSORSHIP BREAKDOWN PAGE */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#ea580c]" />
                <span>Tier Breakdown</span>
              </h3>
              <div className="space-y-2.5">
                {packageTypes.length === 0 ? (
                  <p className="text-xs text-slate-400">No package types defined yet.</p>
                ) : (
                  packageTypes.map((t) => {
                    const count = packages.filter((p) => p.sponsor_type === t.id).length;
                    const percent = packages.length > 0 ? Math.round((count / packages.length) * 100) : 0;
                    return (
                      <div key={t.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{t.name}</span>
                          <span className="font-mono text-slate-500">
                            {count} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#ea580c] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Service Category Highlights</span>
              </h3>
              <div className="space-y-2">
                {sponsors.filter((s) => Boolean(s.service)).length === 0 ? (
                  <p className="text-xs text-slate-400">No partner services logged.</p>
                ) : (
                  sponsors
                    .filter((s) => Boolean(s.service))
                    .slice(0, 5)
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <span className="font-semibold text-slate-800 truncate max-w-[120px]">{s.name}</span>
                        <span className="text-slate-500 truncate max-w-[160px] text-[11px] font-mono">
                          {s.service}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Edition Distribution</span>
              </h3>
              <div className="space-y-2">
                {hackathons.length === 0 ? (
                  <p className="text-xs text-slate-400">No hackathon editions recorded.</p>
                ) : (
                  hackathons.map((h) => {
                    const pkgsCount = packages.filter((p) => p.hackathon === h.id).length;
                    return (
                      <div key={h.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                        <span className="font-medium text-slate-700 truncate max-w-[170px]">
                          {h.title || h.name || 'Hackathon Edition'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-bold">
                          {pkgsCount} package{pkgsCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Comprehensive Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Full Sponsorship Allocation Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed cross-reference of registered organizations and their sponsorship commitments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchData(true)}
                className="text-xs font-semibold text-[#ea580c] hover:underline"
              >
                Sync Updates
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Sponsor Partner</th>
                    <th className="py-3 px-4">Contact Person / Rep</th>
                    <th className="py-3 px-4">Provisioned Service</th>
                    <th className="py-3 px-4">Location & Territory</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sponsors.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        {s.website_link && (
                          <a
                            href={s.website_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#ea580c] hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-800">
                          {s.contact_email || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {s.phone_number1 || s.phone_number2 || ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {s.service ? (
                          <span className="font-medium text-slate-800">{s.service}</span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Direct Support</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-600">{s.location || 'Kathmandu, Nepal'}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT SPONSOR */}
      {/* ----------------------------------------------------------- */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingSponsorId ? 'Edit Sponsor Organization' : 'Register New Sponsor'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Corporate details and partnership profile for BIC Hackathon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSponsorModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sponsorForm.name}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                    placeholder="e.g. Apex Neural Labs / Global IME Bank"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={sponsorForm.contact_email}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, contact_email: e.target.value })}
                    placeholder="sponsor@example.com"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Office Address
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.location}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, location: e.target.value })}
                    placeholder="e.g. New Baneshwor, Kathmandu"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Phone Number
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.phone_number1}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, phone_number1: e.target.value })}
                    placeholder="+977-9800000000"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Secondary Phone Number
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.phone_number2}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, phone_number2: e.target.value })}
                    placeholder="Optional backup phone"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service / Contribution Description
                  </label>
                  <input
                    type="text"
                    value={sponsorForm.service}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, service: e.target.value })}
                    placeholder="e.g. $15,000 Cloud credits + networking dinner sponsorship"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Description & Background
                  </label>
                  <textarea
                    rows={2}
                    value={sponsorForm.description}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, description: e.target.value })}
                    placeholder="Brief overview of the partner organization and its mission"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={sponsorForm.website_link}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, website_link: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={sponsorForm.linkedin_link}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, linkedin_link: e.target.value })}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Twitter / X Profile URL
                  </label>
                  <input
                    type="url"
                    value={sponsorForm.twitter_link}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, twitter_link: e.target.value })}
                    placeholder="https://x.com/..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={sponsorForm.facebook_link}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, facebook_link: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSponsorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#d94e09] transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSponsorId ? 'Save Changes' : 'Register Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: VIEW SPONSOR DETAILS */}
      {/* ----------------------------------------------------------- */}
      {viewingSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {viewingSponsor.logo ? (
                  <img
                    src={getMediaUrl(viewingSponsor.logo)}
                    alt={viewingSponsor.name}
                    className="w-10 h-10 rounded-xl object-contain border border-slate-200 p-1 bg-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center font-bold text-base">
                    {(viewingSponsor.name?.[0] || 'S').toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{viewingSponsor.name}</h3>
                  <p className="text-xs text-slate-400">ID: {viewingSponsor.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingSponsor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              {viewingSponsor.description && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">About</span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {viewingSponsor.description}
                  </p>
                </div>
              )}

              {viewingSponsor.service && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Provided Service</span>
                  <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/50 text-[#ea580c] font-medium">
                    {viewingSponsor.service}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Contact Email</span>
                  <span className="font-mono text-slate-800">{viewingSponsor.contact_email || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Location</span>
                  <span className="text-slate-800">{viewingSponsor.location || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Phone 1</span>
                  <span className="font-mono text-slate-800">{viewingSponsor.phone_number1 || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Phone 2</span>
                  <span className="font-mono text-slate-800">{viewingSponsor.phone_number2 || '—'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingSponsor(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: DELETE SPONSOR CONFIRMATION */}
      {/* ----------------------------------------------------------- */}
      {deletingSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Sponsor?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800">{deletingSponsor.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingSponsor(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSponsor}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT PACKAGE */}
      {/* ----------------------------------------------------------- */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingPackageId ? 'Edit Sponsor Package' : 'Create Sponsor Package'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign sponsorship tier and benefits to a specific hackathon edition
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Hackathon Edition <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={packageForm.hackathon}
                  onChange={(e) => setPackageForm({ ...packageForm, hackathon: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                >
                  <option value="">Select Hackathon...</option>
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title || h.name || 'Hackathon Edition'} ({h.version || 'Active'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Package Tier Type
                </label>
                <select
                  value={packageForm.sponsor_type}
                  onChange={(e) => setPackageForm({ ...packageForm, sponsor_type: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                >
                  <option value="">No Tier / Custom</option>
                  {packageTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Benefits & Perks
                </label>
                <textarea
                  rows={3}
                  value={packageForm.benefits}
                  onChange={(e) => setPackageForm({ ...packageForm, benefits: e.target.value })}
                  placeholder="Keynote Speech, Logo on Website & T-Shirts, 2x Judge Panel Seats, Resume Access"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Notes & Terms
                </label>
                <input
                  type="text"
                  value={packageForm.notes}
                  onChange={(e) => setPackageForm({ ...packageForm, notes: e.target.value })}
                  placeholder="Minimum pledge amount, special booth requirements, MOU status"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#d94e09] transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingPackageId ? 'Save Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: DELETE PACKAGE CONFIRMATION */}
      {/* ----------------------------------------------------------- */}
      {deletingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Sponsor Package?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to delete this sponsorship package? This will unlink perks for this hackathon.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePackage}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT PACKAGE TYPE */}
      {/* ----------------------------------------------------------- */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingTypeId ? 'Edit Package Tier' : 'Add Package Tier Type'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define categories like Title Partner, Platinum, Gold, etc.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTypeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  placeholder="e.g. Title Partner / Platinum Tier"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tier Description
                </label>
                <textarea
                  rows={3}
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  placeholder="Overview of this tier category, eligibility, or target support range"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#d94e09] transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTypeId ? 'Save Tier' : 'Add Tier Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL: DELETE PACKAGE TYPE CONFIRMATION */}
      {/* ----------------------------------------------------------- */}
      {deletingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Package Tier?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to delete tier <strong className="text-slate-800">{deletingType.name}</strong>?
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingType(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteType}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
