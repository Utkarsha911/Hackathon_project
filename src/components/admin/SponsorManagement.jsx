import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getMediaUrl, getSelectedAdminHackathon, getAdminUser } from '../../services/api';
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
  Image as ImageIcon,
  Upload,
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
  organization: '',
  sponsor_type: '',
  price_paid: '',
  price_pledged: '',
  benefits: '',
  notes: ''
};

const EMPTY_PACKAGE_TYPE = {
  name: '',
  description: '',
  order: 0
};

export default function SponsorManagement() {
  const { showToast } = useHackathon();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'sponsors';
  const tabFromUrl = rawTab === 'directory' || rawTab === 'organizations' ? 'sponsors' : rawTab;

  // Active Tab: 'sponsors' | 'packages' | 'types' | 'breakdown'
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'sponsors');

  // Permission resolution
  const currentUser = getAdminUser();
  const isSuperOrStaff = Boolean(
    currentUser?.is_superuser === true ||
    currentUser?.is_staff === true ||
    ['admin', 'administrator', 'super admin'].includes((currentUser?.role || '').toLowerCase())
  );

  const checkHasPermission = (scopes) => {
    if (isSuperOrStaff) return true;
    const userGroupsList = Array.isArray(currentUser?.groups) ? currentUser.groups : [];
    if (!userGroupsList || userGroupsList.length === 0) return false;
    const scopeList = (Array.isArray(scopes) ? scopes : [scopes]).map((s) => s.toLowerCase());

    for (const group of userGroupsList) {
      if (!group || typeof group !== 'object') continue;
      if (group.permissions_name && typeof group.permissions_name === 'object') {
        for (const [category, perms] of Object.entries(group.permissions_name)) {
          const catLower = category.toLowerCase();
          if (scopeList.includes(catLower)) return true;
          if (Array.isArray(perms)) {
            for (const perm of perms) {
              const pStr = (perm?.codename || perm?.name || '').toLowerCase();
              if (scopeList.some((s) => pStr === s || pStr.endsWith(`_${s}`))) return true;
            }
          }
        }
      }
    }
    return false;
  };

  const canAccessOrganizations = checkHasPermission(['organization']);
  const canAccessSponsorPackages = checkHasPermission(['sponsorpackage']);
  const canAccessSponsorPackageTypes = checkHasPermission(['sponsorpackagetype']);
  const canAccessSponsorshipBreakdown = canAccessSponsorPackages;

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Tab permission guard: prevent unauthorized tabs from being shown
  useEffect(() => {
    if ((activeTab === 'packages' || activeTab === 'breakdown') && !canAccessSponsorPackages) {
      if (canAccessOrganizations) {
        setSearchParams({ tab: 'sponsors' }, { replace: true });
        setActiveTab('sponsors');
      }
    } else if (activeTab === 'types' && !canAccessSponsorPackageTypes) {
      if (canAccessOrganizations) {
        setSearchParams({ tab: 'sponsors' }, { replace: true });
        setActiveTab('sponsors');
      }
    } else if (activeTab === 'sponsors' && !canAccessOrganizations && canAccessSponsorPackages) {
      setSearchParams({ tab: 'packages' }, { replace: true });
      setActiveTab('packages');
    }
  }, [activeTab, canAccessOrganizations, canAccessSponsorPackages, canAccessSponsorPackageTypes, setSearchParams]);

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
  const [selectedHackathonFilter, setSelectedHackathonFilter] = useState(() => getSelectedAdminHackathon() || 'all');

  // Modal States - Sponsors
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [sponsorForm, setSponsorForm] = useState(EMPTY_SPONSOR);
  const [editingSponsorId, setEditingSponsorId] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [viewingSponsor, setViewingSponsor] = useState(null);
  const [deletingSponsor, setDeletingSponsor] = useState(null);

  // Modal States - Packages
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState(EMPTY_PACKAGE);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [deletingPackage, setDeletingPackage] = useState(null);
  const [viewingPackage, setViewingPackage] = useState(null);

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
    viewingPackage ||
    deletingPackage ||
    isTypeModalOpen ||
    deletingType
  );
  useBodyScrollLock(isAnyModalOpen);

  // Debounce search query to prevent excessive backend API calls
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const unwrap = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  // Dedicated backend query fetchers (Backend-driven filtering)
  const fetchSponsors = async (query = '') => {
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      const res = await api.sponsors.getAll(params);
      setSponsors(unwrap(res));
      if (res?.stats) setSponsorStats(res.stats);
    } catch (err) {
      console.warn('Failed to fetch sponsors:', err);
    }
  };

  const fetchPackages = async (query = '', hackathonFilter = 'all') => {
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      if (hackathonFilter !== 'all') params.hackathon = hackathonFilter;
      const res = await api.sponsors.getPackages(params);
      setPackages(unwrap(res));
      if (res?.stats) setPackageStats(res.stats);
    } catch (err) {
      console.warn('Failed to fetch packages:', err);
    }
  };

  const fetchTypes = async (query = '') => {
    try {
      const params = { ordering: 'order' };
      if (query.trim()) params.search = query.trim();
      const res = await api.sponsors.getPackageTypes(params);
      const items = unwrap(res);
      items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      setPackageTypes(items);
      if (res?.stats) setTypeStats(res.stats);
    } catch (err) {
      console.warn('Failed to fetch package types:', err);
    }
  };

  // Fetch all related entities on mount or after mutations
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const sponsorParams = {};
      if (debouncedSearch.trim() && (activeTab === 'sponsors')) sponsorParams.search = debouncedSearch.trim();

      const packageParams = {};
      if (debouncedSearch.trim() && activeTab === 'packages') packageParams.search = debouncedSearch.trim();
      if (selectedHackathonFilter !== 'all' && activeTab === 'packages') packageParams.hackathon = selectedHackathonFilter;

      const typeParams = { ordering: 'order' };
      if (debouncedSearch.trim() && (activeTab === 'types')) typeParams.search = debouncedSearch.trim();

      const [sponsorsRes, packagesRes, typesRes, hackathonsRes] = await Promise.all([
        api.sponsors.getAll(sponsorParams).catch(() => ({ results: [] })),
        api.sponsors.getPackages(packageParams).catch(() => ({ results: [] })),
        api.sponsors.getPackageTypes(typeParams).catch(() => ({ results: [] })),
        api.hackathons.getAll().catch(() => ({ results: [] }))
      ]);

      const unwrappedTypes = unwrap(typesRes);
      unwrappedTypes.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

      setSponsors(unwrap(sponsorsRes));
      setPackages(unwrap(packagesRes));
      setPackageTypes(unwrappedTypes);
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

  // When debounced search or filters change, trigger backend query for active view
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (activeTab === 'sponsors') {
      fetchSponsors(debouncedSearch);
    } else if (activeTab === 'packages') {
      fetchPackages(debouncedSearch, selectedHackathonFilter);
    } else if (activeTab === 'types') {
      fetchTypes(debouncedSearch);
    }
  }, [debouncedSearch, selectedHackathonFilter, activeTab]);

  // Re-fetch whenever global hackathon edition changes in AdminLayout top bar
  useEffect(() => {
    const handleGlobalHackathonChange = (e) => {
      const newHackathon = e?.detail || getSelectedAdminHackathon() || 'all';
      setSelectedHackathonFilter(newHackathon);
      fetchData();
    };
    window.addEventListener('bic_admin_hackathon_changed', handleGlobalHackathonChange);
    return () => window.removeEventListener('bic_admin_hackathon_changed', handleGlobalHackathonChange);
  }, []);

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

  const organizationMap = useMemo(() => {
    const map = new Map();
    sponsors.forEach((s) => map.set(s.id, s));
    return map;
  }, [sponsors]);

  const getPackageOrganization = (pkg) => {
    if (!pkg) return null;
    if (typeof pkg.organization === 'object' && pkg.organization !== null) {
      return pkg.organization;
    }
    if (pkg.organization && organizationMap.has(pkg.organization)) {
      return organizationMap.get(pkg.organization);
    }
    return null;
  };

  // -------------------------------------------------------------
  // Sponsor Handlers
  // -------------------------------------------------------------
  const handleOpenCreateSponsor = () => {
    setEditingSponsorId(null);
    setSponsorForm(EMPTY_SPONSOR);
    setLogoFile(null);
    setLogoPreview('');
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
    setLogoFile(null);
    setLogoPreview(sponsor.logo ? getMediaUrl(sponsor.logo) : '');
    setIsSponsorModalOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setSponsorForm((prev) => ({ ...prev, logo: file }));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setSponsorForm((prev) => ({ ...prev, logo: '' }));
  };

  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) {
      showToast('Sponsor organization name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (logoFile instanceof File) {
        const formData = new FormData();
        formData.append('name', sponsorForm.name.trim());
        if (sponsorForm.description?.trim()) formData.append('description', sponsorForm.description.trim());
        if (sponsorForm.contact_email?.trim()) formData.append('contact_email', sponsorForm.contact_email.trim());
        if (sponsorForm.phone_number1?.trim()) formData.append('phone_number1', sponsorForm.phone_number1.trim());
        if (sponsorForm.phone_number2?.trim()) formData.append('phone_number2', sponsorForm.phone_number2.trim());
        if (sponsorForm.location?.trim()) formData.append('location', sponsorForm.location.trim());
        if (sponsorForm.service?.trim()) formData.append('service', sponsorForm.service.trim());
        if (sponsorForm.website_link?.trim()) formData.append('website_link', sponsorForm.website_link.trim());
        if (sponsorForm.facebook_link?.trim()) formData.append('facebook_link', sponsorForm.facebook_link.trim());
        if (sponsorForm.twitter_link?.trim()) formData.append('twitter_link', sponsorForm.twitter_link.trim());
        if (sponsorForm.linkedin_link?.trim()) formData.append('linkedin_link', sponsorForm.linkedin_link.trim());
        if (sponsorForm.instagram_link?.trim()) formData.append('instagram_link', sponsorForm.instagram_link.trim());
        formData.append('logo', logoFile);

        if (editingSponsorId) {
          await api.sponsors.patch(editingSponsorId, formData);
          showToast('Sponsor organization updated successfully', 'success');
        } else {
          await api.sponsors.create(formData);
          showToast('Sponsor organization registered successfully', 'success');
        }
      } else {
        const payload = {
          name: sponsorForm.name.trim(),
          description: sponsorForm.description?.trim() || null,
          contact_email: sponsorForm.contact_email?.trim() || null,
          phone_number1: sponsorForm.phone_number1?.trim() || null,
          phone_number2: sponsorForm.phone_number2?.trim() || null,
          location: sponsorForm.location?.trim() || null,
          service: sponsorForm.service?.trim() || null,
          website_link: sponsorForm.website_link?.trim() || null,
          facebook_link: sponsorForm.facebook_link?.trim() || null,
          twitter_link: sponsorForm.twitter_link?.trim() || null,
          linkedin_link: sponsorForm.linkedin_link?.trim() || null,
          instagram_link: sponsorForm.instagram_link?.trim() || null
        };

        if (!logoPreview && editingSponsorId) {
          payload.logo = null;
        }

        if (editingSponsorId) {
          await api.sponsors.patch(editingSponsorId, payload);
          showToast('Sponsor organization updated successfully', 'success');
        } else {
          await api.sponsors.create(payload);
          showToast('Sponsor organization registered successfully', 'success');
        }
      }

      setIsSponsorModalOpen(false);
      setEditingSponsorId(null);
      setSponsorForm(EMPTY_SPONSOR);
      setLogoFile(null);
      setLogoPreview('');
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
      hackathon: (getSelectedAdminHackathon() && getSelectedAdminHackathon() !== 'all')
        ? getSelectedAdminHackathon()
        : (hackathons[0]?.id || ''),
      organization: sponsors[0]?.id || '',
      sponsor_type: packageTypes[0]?.id || '',
      price_paid: '',
      price_pledged: '',
      benefits: '',
      notes: ''
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackageId(pkg.id);
    const orgId = typeof pkg.organization === 'object' && pkg.organization !== null
      ? pkg.organization.id
      : (pkg.organization || '');

    const typeId = typeof pkg.sponsor_type === 'object' && pkg.sponsor_type !== null
      ? pkg.sponsor_type.id
      : (pkg.sponsor_type || '');

    setPackageForm({
      hackathon: pkg.hackathon || '',
      organization: orgId,
      sponsor_type: typeId,
      price_paid: pkg.price_paid || '',
      price_pledged: pkg.price_pledged || '',
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
        organization: packageForm.organization || null,
        sponsor_type: packageForm.sponsor_type || null,
        price_paid: packageForm.price_paid || '0.00',
        price_pledged: packageForm.price_pledged || '0.00',
        benefits: formattedBenefits || null,
        notes: packageForm.notes?.trim() || null
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
    const maxOrder = packageTypes.reduce((max, t) => {
      const ord = Number(t.order);
      return !isNaN(ord) && ord > max ? ord : max;
    }, -1);
    setTypeForm({
      ...EMPTY_PACKAGE_TYPE,
      order: maxOrder + 1
    });
    setIsTypeModalOpen(true);
  };

  const handleOpenEditType = (typeItem) => {
    setEditingTypeId(typeItem.id);
    setTypeForm({
      name: typeItem.name || '',
      description: typeItem.description || '',
      order: typeItem.order !== undefined && typeItem.order !== null ? typeItem.order : 0
    });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      showToast('Package type name is required', 'error');
      return;
    }

    const orderNum = parseInt(typeForm.order, 10);

    setSubmitting(true);
    try {
      const payload = {
        name: typeForm.name.trim(),
        description: typeForm.description.trim() || null,
        order: isNaN(orderNum) ? 0 : orderNum
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
            {activeTab === 'sponsors' && 'Organizations'}
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
      {/* TAB 1: ORGANIZATIONS */}
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
              Showing {sponsors.length} sponsor{sponsors.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading && sponsors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-8 h-8 border-2 border-orange-200 border-t-[#ea580c] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading organizations...</p>
            </div>
          ) : sponsors.length === 0 ? (
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
                    {sponsors.map((s) => (
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
                {packages.length} package{packages.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {packages.length === 0 ? (
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
                      <th className="py-3 px-4">Organization (Partner)</th>
                      <th className="py-3 px-4">Tier & Edition</th>
                      <th className="py-3 px-4">Financials (Paid / Pledged)</th>
                      <th className="py-3 px-4">Allocated Benefits & Perks</th>
                      <th className="py-3 px-4">Internal Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {packages.map((pkg) => {
                      const org = getPackageOrganization(pkg);
                      const tierName = pkg.sponsor_type?.name || packageTypeMap.get(pkg.sponsor_type) || 'General Sponsorship';
                      const paidNum = Number(pkg.price_paid || 0);
                      const pledgedNum = Number(pkg.price_pledged || 0);

                      return (
                        <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Organization */}
                          <td className="py-3 px-4">
                            {org ? (
                              <div className="flex items-center gap-2.5">
                                {org.logo ? (
                                  <img
                                    src={getMediaUrl(org.logo)}
                                    alt={org.name}
                                    className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#ea580c] border border-orange-200/80 flex items-center justify-center font-bold text-xs shrink-0">
                                    {(org.name?.[0] || 'O').toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => setViewingPackage(pkg)}
                                    className="font-bold text-slate-900 text-xs hover:text-[#ea580c] transition-colors truncate max-w-[200px] block text-left cursor-pointer"
                                    title="Click to view organization details"
                                  >
                                    {org.name}
                                  </button>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                    {org.service && (
                                      <span className="truncate max-w-[120px] font-medium text-slate-600">{org.service}</span>
                                    )}
                                    {org.location && (
                                      <span className="truncate max-w-[120px] text-slate-400">· {org.location}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                                <Building2 className="w-3.5 h-3.5 text-slate-300" />
                                <span>Unassigned Partner</span>
                              </div>
                            )}
                          </td>

                          {/* Tier & Edition */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/70 font-semibold text-[11px]">
                              <Tag className="w-3 h-3 shrink-0" />
                              <span>{tierName}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">
                                {hackathonMap.get(pkg.hackathon) || 'Current Hackathon'}
                              </span>
                            </div>
                          </td>

                          {/* Financials */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Rs. {paidNum.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-semibold">Paid</span>
                            </div>
                            {pledgedNum > 0 && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Pledged: Rs. {pledgedNum.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Benefits */}
                          <td className="py-3 px-4">
                            {pkg.benefits ? (
                              <div className="max-w-xs">
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
                              <span className="text-slate-400 font-mono text-[11px]">No perks specified</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="py-3 px-4">
                            {pkg.notes ? (
                              <p className="text-slate-600 text-[11px] max-w-xs truncate">{pkg.notes}</p>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingPackage(pkg)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                title="View Organization & Package Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
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
                      );
                    })}
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
              Showing {packageTypes.length} tier{packageTypes.length === 1 ? '' : 's'}
            </span>
          </div>

          {packageTypes.length === 0 ? (
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
              {packageTypes.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-orange-200 hover:shadow-sm transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#ea580c] border border-orange-200/70 text-xs font-bold font-mono">
                          {t.name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold font-mono"
                          title="Display Sequence Order"
                        >
                          Order: {t.order ?? 0}
                        </span>
                      </div>
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

                {/* Organization Logo Upload & Preview */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization Logo
                  </label>
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    {logoPreview ? (
                      <div className="relative group shrink-0">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="w-16 h-16 rounded-xl object-contain border border-slate-200 bg-white p-1 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xs transition cursor-pointer"
                          title="Remove Logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 text-slate-300 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#ea580c] hover:file:bg-orange-100 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Upload official organization logo (PNG, JPG, SVG, WEBP - square or transparent recommended)
                      </p>
                    </div>
                  </div>
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
                  Partner Organization
                </label>
                <select
                  value={packageForm.organization}
                  onChange={(e) => setPackageForm({ ...packageForm, organization: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                >
                  <option value="">Select Partner Organization...</option>
                  {sponsors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.service ? `(${s.service})` : ''}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price Paid (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={packageForm.price_paid}
                    onChange={(e) => setPackageForm({ ...packageForm, price_paid: e.target.value })}
                    placeholder="e.g. 5000.00"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price Pledged (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={packageForm.price_pledged}
                    onChange={(e) => setPackageForm({ ...packageForm, price_pledged: e.target.value })}
                    placeholder="e.g. 15000.00"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
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
      {/* MODAL: VIEW ORGANIZATION & SPONSOR PACKAGE DETAILS */}
      {/* ----------------------------------------------------------- */}
      {viewingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {(() => {
              const org = getPackageOrganization(viewingPackage);
              const tierName = viewingPackage.sponsor_type?.name || packageTypeMap.get(viewingPackage.sponsor_type) || 'General Sponsorship';
              const paidNum = Number(viewingPackage.price_paid || 0);
              const pledgedNum = Number(viewingPackage.price_pledged || 0);

              return (
                <>
                  <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-orange-50/50 via-white to-slate-50">
                    <div className="flex items-center gap-3.5">
                      {org?.logo ? (
                        <img
                          src={getMediaUrl(org.logo)}
                          alt={org.name}
                          className="w-14 h-14 rounded-2xl object-contain border border-slate-200 p-1 bg-white shadow-xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#ea580c] flex items-center justify-center font-extrabold text-xl shadow-xs border border-orange-200">
                          {(org?.name?.[0] || 'O').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                          {org?.name || 'Sponsor Organization'}
                        </h3>
                        {org?.service && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-[#c2410c] mt-1">
                            <Briefcase className="w-3 h-3 text-[#ea580c]" />
                            <span>{org.service}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingPackage(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
                    {/* Organization About */}
                    {org?.description && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          About Organization
                        </span>
                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          {org.description}
                        </p>
                      </div>
                    )}

                    {/* Contact & Location Details */}
                    {org && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                          Organization Contact & Location
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {org.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-[#ea580c] shrink-0" />
                              <a
                                href={`mailto:${org.contact_email}`}
                                className="text-slate-800 hover:text-[#ea580c] font-mono truncate transition"
                              >
                                {org.contact_email}
                              </a>
                            </div>
                          )}

                          {(org.phone_number1 || org.phone_number2) && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-slate-800 font-mono">
                                {[org.phone_number1, org.phone_number2].filter(Boolean).join(' / ')}
                              </span>
                            </div>
                          )}

                          {org.location && (
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-slate-700 leading-tight">
                                {org.location}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Social & Web Links */}
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                          {org.website_link && (
                            <a
                              href={org.website_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-[#ea580c] hover:text-[#ea580c] transition shadow-2xs"
                            >
                              <Globe className="w-3.5 h-3.5 text-[#ea580c]" />
                              <span>Website</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                          {org.facebook_link && (
                            <a
                              href={org.facebook_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-blue-700 hover:border-blue-300 transition shadow-2xs"
                            >
                              <span>Facebook</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                          {org.linkedin_link && (
                            <a
                              href={org.linkedin_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-sky-700 hover:border-sky-300 transition shadow-2xs"
                            >
                              <span>LinkedIn</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                          {org.twitter_link && (
                            <a
                              href={org.twitter_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-800 hover:border-slate-400 transition shadow-2xs"
                            >
                              <span>Twitter</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                          {org.instagram_link && (
                            <a
                              href={org.instagram_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-pink-700 hover:border-pink-300 transition shadow-2xs"
                            >
                              <span>Instagram</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sponsorship Package Financials & Tier */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                        Package Financials & Tier
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80">
                          <span className="text-[10px] uppercase font-bold text-purple-600 block">Sponsorship Tier</span>
                          <span className="text-sm font-bold text-purple-900 mt-0.5 block">{tierName}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Hackathon Edition</span>
                          <span className="text-sm font-bold text-slate-800 mt-0.5 block truncate">
                            {hackathonMap.get(viewingPackage.hackathon) || 'Current Edition'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Amount Paid</span>
                          <span className="text-base font-extrabold text-emerald-700 mt-0.5 block font-mono">
                            Rs. {paidNum.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                          <span className="text-[10px] uppercase font-bold text-amber-700 block">Pledged Amount</span>
                          <span className="text-base font-extrabold text-amber-800 mt-0.5 block font-mono">
                            Rs. {pledgedNum.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Benefits & Perks */}
                    {viewingPackage.benefits && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Allocated Perks & Benefits
                        </span>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                          {typeof viewingPackage.benefits === 'object' ? (
                            <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(viewingPackage.benefits) ? (
                                viewingPackage.benefits.map((b, i) => (
                                  <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold text-[11px] shadow-2xs">
                                    {String(b)}
                                  </span>
                                ))
                              ) : (
                                Object.entries(viewingPackage.benefits).map(([k, v], i) => (
                                  <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold text-[11px] shadow-2xs">
                                    <span className="text-slate-500 font-medium">{k}:</span> {String(v)}
                                  </span>
                                ))
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-700 text-xs leading-relaxed">
                              {String(viewingPackage.benefits)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Internal Notes */}
                    {viewingPackage.notes && (
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                          Internal Notes
                        </span>
                        <p className="text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 italic">
                          {viewingPackage.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const pkgToEdit = viewingPackage;
                        setViewingPackage(null);
                        handleOpenEditPackage(pkgToEdit);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ea580c] bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Package</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewingPackage(null)}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
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
                    Display Order <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={typeForm.order ?? 0}
                    onChange={(e) => setTypeForm({ ...typeForm, order: e.target.value })}
                    placeholder="0"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 -mt-2">
                Order controls tier hierarchy and positioning (e.g. 0 displays before 1, 2, etc.).
              </p>

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
