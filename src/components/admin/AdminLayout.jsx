import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Toast from '../common/Toast';
import ErrorBoundary from '../common/ErrorBoundary';
import UserProfileModal from '../common/UserProfileModal';
import {
  api,
  getAdminUser,
  setAdminUser,
  getAdminAuthToken,
  adminLogout,
  getMediaUrl,
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR,
  getSelectedAdminHackathon,
  setSelectedAdminHackathon
} from '../../services/api';
import {
  UserCog,
  ChevronUp,
  ChevronDown,
  Users,
  UserCheck,
  ClipboardList,
  FolderTree,
  Shield,
  LogOut,
  Layers,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Edit3,
  Trophy,
  Building2,
  Package,
  CalendarClock,
  Calendar,
  Award,
  HelpCircle,
  Mail,
  Clock,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import HackathonBrand from '../common/HackathonBrand';
import permissionsData from '../../data/json/permissions.json';

// Build fast ID lookup for numeric Django permissions
const PERMISSIONS_ID_MAP = {};
if (permissionsData && typeof permissionsData === 'object') {
  Object.entries(permissionsData).forEach(([category, list]) => {
    if (Array.isArray(list)) {
      list.forEach((p) => {
        if (p?.id) {
          PERMISSIONS_ID_MAP[Number(p.id)] = {
            category: category.toLowerCase(),
            codename: (p.codename || '').toLowerCase(),
            name: (p.name || '').toLowerCase()
          };
        }
      });
    }
  });
}

// Lazy loaded admin views
const AdminLogin = lazy(() => import('./AdminLogin'));
const HackathonManagement = lazy(() => import('./HackathonManagement'));
const SponsorManagement = lazy(() => import('./SponsorManagement'));
const ScheduleManagement = lazy(() => import('./ScheduleManagement'));
const UserManagement = lazy(() => import('./UserManagement'));
const GroupManagement = lazy(() => import('./GroupManagement'));
const TeamManagement = lazy(() => import('./TeamManagement'));
const CustomerManagement = lazy(() => import('./CustomerManagement'));
const OrganizerTaskManagement = lazy(() => import('./OrganizerTaskManagement'));
const LogViewer = lazy(() => import('./LogViewer'));

function AdminViewLoader() {
  return (
    <div className="p-16 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-[#e8622a] rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 tracking-wide">
          Loading component...
        </span>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    return (
      getAdminUser() ||
      (getAdminAuthToken()
        ? { email: 'admin@bichackathon.org', first_name: 'Admin', last_name: 'User' }
        : null)
    );
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Available Hackathons for Global Admin Filter
  const [adminHackathons, setAdminHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(() => getSelectedAdminHackathon() || '');

  // Fetch hackathons on mount to populate the top-right filter dropdown
  useEffect(() => {
    if (getAdminAuthToken()) {
      api.hackathons
        .getAll({ skipHackathonFilter: true })
        .then((res) => {
          const list = Array.isArray(res)
            ? res
            : Array.isArray(res?.results)
            ? res.results
            : res?.data || [];
          setAdminHackathons(list);

          const stored = getSelectedAdminHackathon();
          const found = list.find((h) => h.id === stored);
          const currentH = list.find((h) => h.is_current === true);

          if (stored && stored !== 'all' && found) {
            setSelectedHackathonId(found.id);
          } else if (currentH?.id) {
            setSelectedHackathonId(currentH.id);
            setSelectedAdminHackathon(currentH.id);
          } else if (list.length > 0) {
            setSelectedHackathonId(list[0].id);
            setSelectedAdminHackathon(list[0].id);
          } else {
            setSelectedHackathonId('');
            setSelectedAdminHackathon('');
          }
        })
        .catch((err) => {
          console.warn('Failed to load hackathons in AdminLayout:', err);
        });
    }

    const handleExternalChange = (e) => {
      if (e?.detail !== undefined) {
        setSelectedHackathonId(e.detail);
      }
    };
    window.addEventListener('bic_admin_hackathon_changed', handleExternalChange);
    return () => window.removeEventListener('bic_admin_hackathon_changed', handleExternalChange);
  }, []);

  // Listen for profile updates and only fetch on mount if not already cached
  useEffect(() => {
    if (getAdminAuthToken() && !getAdminUser()?.id) {
      api.users
        .getProfile()
        .then((profile) => {
          if (profile && typeof profile === 'object' && profile.id) {
            setCurrentUser((prev) => ({ ...prev, ...profile }));
            setAdminUser(profile);
          }
        })
        .catch((err) => {
          console.warn('Profile sync:', err);
        });
    }

    const handleUserUpdated = (e) => {
      if (e?.detail) {
        setCurrentUser((prev) => ({ ...prev, ...e.detail }));
      }
    };

    const handleAdminLogout = () => {
      setCurrentUser(null);
      navigate('/admin-control-site');
    };

    window.addEventListener('bic_admin_logout', handleAdminLogout);
    window.addEventListener('bic_admin_user_updated', handleUserUpdated);
    window.addEventListener('bic_user_updated', handleUserUpdated);
    return () => {
      window.removeEventListener('bic_admin_logout', handleAdminLogout);
      window.removeEventListener('bic_admin_user_updated', handleUserUpdated);
      window.removeEventListener('bic_user_updated', handleUserUpdated);
    };
  }, [navigate]);

  // Dropdown accordion states
  const [hackathonMgmtOpen, setHackathonMgmtOpen] = useState(true);
  const [sponsorMgmtOpen, setSponsorMgmtOpen] = useState(true);
  const [scheduleMgmtOpen, setScheduleMgmtOpen] = useState(true);
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);

  // Group permission objects for non-staff / non-superuser users
  const [userGroupObjects, setUserGroupObjects] = useState([]);

  useEffect(() => {
    const isStaffOrSuper = Boolean(
      currentUser?.is_superuser === true ||
      currentUser?.is_staff === true ||
      (typeof currentUser?.role === 'string' &&
        (currentUser.role.toLowerCase() === 'super admin' ||
         currentUser.role.toLowerCase() === 'administrator' ||
         currentUser.role.toLowerCase() === 'admin'))
    );

    // If not super/staff, resolve group permissions from list_groups API if needed
    if (!isStaffOrSuper && currentUser?.groups && currentUser.groups.length > 0) {
      const alreadyHasObjects = currentUser.groups.some(
        (g) => typeof g === 'object' && (g.permissions_name || g.permissions)
      );
      if (alreadyHasObjects) {
        setUserGroupObjects(currentUser.groups);
      } else {
        api.users
          .listGroups()
          .then((resp) => {
            const allGroups = Array.isArray(resp)
              ? resp
              : resp?.results || resp?.data || [];
            const userGids = new Set(
              currentUser.groups.map((g) => (typeof g === 'object' ? g.id : g))
            );
            const matched = allGroups.filter((g) => userGids.has(g.id));
            setUserGroupObjects(matched);
          })
          .catch((err) => {
            console.warn('Could not fetch user group permissions:', err);
          });
      }
    }
  }, [currentUser]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleLogout = () => {
    adminLogout();
    setCurrentUser(null);
    navigate('/admin-control-site');
  };

  // If not authenticated, require Admin Login via /api/v1/users/login/
  if (!currentUser) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', color: '#1a1a2e' }}>
        <ErrorBoundary>
          <Suspense fallback={<AdminViewLoader />}>
            <AdminLogin onLoginSuccess={(user) => setCurrentUser(user)} />
          </Suspense>
          <Toast />
        </ErrorBoundary>
      </div>
    );
  }

  const pathname = location.pathname;
  const currentTab = new URLSearchParams(location.search).get('tab') || 'sponsors';
  const userTab = new URLSearchParams(location.search).get('tab') || 'users';
  const hackathonTab = new URLSearchParams(location.search).get('tab') || 'hackathons';
  const participantTab = new URLSearchParams(location.search).get('tab') || 'participants';
  const scheduleTab = new URLSearchParams(location.search).get('tab') || 'schedules';
  const isDashboardActive = pathname === '/admin-control-site' || pathname === '/admin-control-site/';
  const isHackathonsActive = pathname.startsWith('/admin-control-site/hackathons');
  const isHackathonOrganizersActive = isHackathonsActive && hackathonTab === 'organizers';
  const isHackathonPrizesActive = isHackathonsActive && (hackathonTab === 'prizes' || hackathonTab === 'prizes-faqs');
  const isHackathonTermsActive = isHackathonsActive && hackathonTab === 'terms';
  const isHackathonFaqsActive = isHackathonsActive && hackathonTab === 'faqs';
  const isHackathonContactsActive = isHackathonsActive && hackathonTab === 'contacts';
  const isHackathonsListActive =
    isHackathonsActive &&
    hackathonTab !== 'organizers' &&
    !isHackathonPrizesActive &&
    !isHackathonTermsActive &&
    !isHackathonFaqsActive &&
    !isHackathonContactsActive;
  const isSponsorsActive = pathname.startsWith('/admin-control-site/sponsors');
  const isSchedulesActive = pathname.startsWith('/admin-control-site/schedules');
  const isScheduleEventsActive = isSchedulesActive && scheduleTab === 'events';
  const isScheduleMilestonesActive = isSchedulesActive && scheduleTab !== 'events';
  const isCustomersActive = pathname.startsWith('/admin-control-site/participants') || pathname.startsWith('/admin-control-site/customers');
  const isParticipantGuestsActive = (isCustomersActive && participantTab === 'guests') || pathname === '/admin-control-site/guests' || (isHackathonsActive && hackathonTab === 'guests');
  const isParticipantsListActive = isCustomersActive && participantTab !== 'guests' && participantTab !== 'organizers';
  const isUsersActive = pathname.startsWith('/admin-control-site/users');
  const isDepartmentsActive = isUsersActive && userTab === 'departments';
  const isOrganizersActive = isUsersActive && userTab === 'organizers';
  const isUsersListActive = isUsersActive && userTab !== 'organizers' && userTab !== 'departments';
  const isOrganizerTasksActive = pathname.startsWith('/admin-control-site/organizer-tasks') || pathname.startsWith('/admin-control-site/tasks');
  const isGroupsActive = pathname.startsWith('/admin-control-site/groups');
  const isTeamsActive = pathname.startsWith('/admin-control-site/teams') || (isHackathonsActive && hackathonTab === 'teams') || (isUsersActive && userTab === 'teams');
  const isLogsActive = pathname.startsWith('/admin-control-site/logs');

  const initials = `${currentUser?.first_name?.[0] || 'A'}${currentUser?.last_name?.[0] || 'D'}`.toUpperCase();
  const displayName = `${currentUser?.first_name || 'Admin'} ${currentUser?.last_name || 'User'}`;
  const profilePicUrl = getUserAvatarUrl(currentUser);

  const userRole = (currentUser?.role || '').toLowerCase();
  const isSuperOrStaff =
    userRole === 'admin' ||
    userRole === 'administrator' ||
    userRole === 'super admin' ||
    Boolean(currentUser?.is_superuser) ||
    Boolean(currentUser?.is_staff);

  // Group permission evaluation:
  // Rule: "Hide entire menu if a user has no group in admin site, show only with those grouped permission"
  const userGroupsList = [
    ...(Array.isArray(currentUser?.groups) ? currentUser.groups : []),
    ...(Array.isArray(userGroupObjects) ? userGroupObjects : [])
  ].filter(Boolean);

  const hasPermission = (scopes) => {
    if (isSuperOrStaff) return true;

    // Hide entire menu if non-staff / non-superuser has no groups
    if (!userGroupsList || userGroupsList.length === 0) {
      return false;
    }

    const scopeList = (Array.isArray(scopes) ? scopes : [scopes]).map((s) => s.toLowerCase());

    // Strict scope check helper
    const checkScopeMatch = (itemCategory, itemCodename) => {
      const cat = (itemCategory || '').toLowerCase();
      const code = (itemCodename || '').toLowerCase();

      return scopeList.some((s) => {
        // 1. Exact category match
        if (cat === s) return true;
        // 2. Exact or standard Django codename match (e.g. view_hackathon, add_organization)
        if (code === s) return true;
        if (code === `view_${s}` || code === `add_${s}` || code === `change_${s}` || code === `delete_${s}`) return true;
        if (code.endsWith(`_${s}`)) return true;
        return false;
      });
    };

    // 1. Direct user permissions
    const userPerms = currentUser?.permissions || currentUser?.user_permissions || [];
    if (Array.isArray(userPerms)) {
      for (const p of userPerms) {
        const pStr = (typeof p === 'string' ? p : p?.codename || p?.name || '').toLowerCase();
        if (checkScopeMatch('', pStr)) return true;
        if (typeof p === 'number' || !isNaN(Number(p))) {
          const meta = PERMISSIONS_ID_MAP[Number(p)];
          if (meta && checkScopeMatch(meta.category, meta.codename)) {
            return true;
          }
        }
      }
    }

    // 2. Group permissions from user's groups
    for (const group of userGroupsList) {
      if (!group || typeof group !== 'object') continue;

      if (group.permissions_name && typeof group.permissions_name === 'object') {
        for (const [category, perms] of Object.entries(group.permissions_name)) {
          const catLower = category.toLowerCase();
          if (scopeList.includes(catLower)) {
            return true;
          }
          if (Array.isArray(perms)) {
            for (const perm of perms) {
              const pStr = (perm?.codename || perm?.name || '').toLowerCase();
              if (checkScopeMatch(catLower, pStr)) return true;
              if (perm?.id && PERMISSIONS_ID_MAP[Number(perm.id)]) {
                const meta = PERMISSIONS_ID_MAP[Number(perm.id)];
                if (checkScopeMatch(meta.category, meta.codename)) {
                  return true;
                }
              }
            }
          }
        }
      }

      if (Array.isArray(group.permissions)) {
        for (const perm of group.permissions) {
          if (typeof perm === 'string') {
            const pStr = perm.toLowerCase();
            if (checkScopeMatch('', pStr)) return true;
          } else if (typeof perm === 'object' && perm !== null) {
            const pStr = (perm.codename || perm.name || '').toLowerCase();
            if (checkScopeMatch('', pStr)) return true;
            if (perm.id && PERMISSIONS_ID_MAP[Number(perm.id)]) {
              const meta = PERMISSIONS_ID_MAP[Number(perm.id)];
              if (checkScopeMatch(meta.category, meta.codename)) {
                return true;
              }
            }
          } else if (typeof perm === 'number' || !isNaN(Number(perm))) {
            const meta = PERMISSIONS_ID_MAP[Number(perm)];
            if (meta && checkScopeMatch(meta.category, meta.codename)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  };

  // Specific granular permissions matching backend catalog strictly
  // 1. Hackathons & Committee
  const canAccessHackathons = hasPermission(['hackathon']);
  const canAccessOrganizers = hasPermission(['organizer']);
  const canAccessTeams = hasPermission(['team']);
  const canAccessHackathonCrm = isSuperOrStaff; // CRM submodules (prizes, faqs, contacts) reserved for super/staff
  const canAccessHackathonsDropdown = canAccessHackathons || canAccessOrganizers || canAccessHackathonCrm;

  // 2. Organizations & Sponsors (Clean separation: Organization vs Sponsor Packages)
  const canAccessOrganizations = hasPermission(['organization']);
  const canAccessSponsorPackages = hasPermission(['sponsorpackage']);
  const canAccessSponsorPackageTypes = hasPermission(['sponsorpackagetype']);
  const canAccessSponsorPackagesSection = canAccessSponsorPackages || canAccessSponsorPackageTypes;
  const canAccessSponsorsDropdown = canAccessOrganizations || canAccessSponsorPackagesSection;
  const canAccessSponsors = canAccessSponsorsDropdown;

  // 3. Schedules
  const hasAdminSchedulesGroup = userGroupsList.some((g) => {
    const name = typeof g === 'string' ? g : (g?.name || '');
    const clean = name.toLowerCase().replace(/[-_]/g, ' ').trim();
    return clean === 'admin schedules' || clean === 'admin schedule' || clean.includes('admin schedule');
  });
  const canAccessSchedules = isSuperOrStaff || hasAdminSchedulesGroup || hasPermission(['schedule']);

  // 4. Users, Departments & Groups
  const canAccessParticipants = isSuperOrStaff;
  const canAccessUsers = hasPermission(['user']);
  const canAccessDepartments = hasPermission(['department']);
  const canAccessGroups = isSuperOrStaff || hasPermission(['group']);
  const canAccessUserMgmtDropdown = canAccessParticipants || canAccessUsers || canAccessOrganizers || canAccessDepartments || canAccessGroups || canAccessTeams;
  const canAccessUserMgmt = canAccessUserMgmtDropdown;

  // 5. Organizer Tasks & Activity Logs
  const canAccessOrganizerTasks = hasPermission(['organizertasks']);
  const canAccessLogs = isSuperOrStaff || hasPermission(['activity']);

  // Header Title mapping
  let pageTitle = 'Hackathon Management';
  if (isParticipantGuestsActive) pageTitle = 'Guest Credential Directory';
  else if (isTeamsActive) pageTitle = 'Team Management';
  else if (isHackathonOrganizersActive) pageTitle = 'Hackathon Organizers';
  else if (isHackathonPrizesActive) pageTitle = 'Prize Management';
  else if (isHackathonFaqsActive) pageTitle = 'FAQ Management';
  else if (isHackathonTermsActive) pageTitle = 'Terms & Conditions';
  else if (isHackathonContactsActive) pageTitle = 'Contact Inquiries';
  else if (isHackathonsActive) pageTitle = 'Hackathon Management';
  else if (isSponsorsActive) pageTitle = 'Sponsors & Packages';
  else if (isSchedulesActive) pageTitle = 'Schedule Management';
  else if (isDepartmentsActive) pageTitle = 'Department Management';
  else if (isOrganizersActive) pageTitle = 'Organizers Management';
  else if (isOrganizerTasksActive) pageTitle = 'Organizer Tasks';
  else if (isUsersActive) pageTitle = 'User Management';
  else if (isCustomersActive) pageTitle = 'Participant Directory';
  else if (isGroupsActive) pageTitle = 'Group Management';
  else if (isTeamsActive) pageTitle = 'Team Management';
  else if (isLogsActive) pageTitle = 'Activity & Logs';

  return (
    <ErrorBoundary>
      <div
        className="admin-shell min-h-screen flex"
        style={{ backgroundColor: '#f5f6fa', color: '#1a1a2e', minHeight: '100vh', width: '100%' }}
      >
        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 md:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 md:z-10 w-64 shrink-0 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e8e9ef', minHeight: '100vh' }}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6" style={{ borderBottom: '1px solid #e8e9ef' }}>
            <Link to="/admin-control-site/hackathons" className="flex items-center gap-2.5 group min-w-0">
              <HackathonBrand
                hackathon={
                  adminHackathons.find((h) => h.id === selectedHackathonId) ||
                  adminHackathons.find((h) => h.is_current === true) ||
                  adminHackathons[0] ||
                  null
                }
                imageClassName="h-8 w-auto max-w-[140px] object-contain transition-opacity group-hover:opacity-90"
                textClassName="text-xs font-bold text-slate-900 group-hover:text-[#ea580c] transition-colors"
                subTextClassName="text-[9px] font-mono font-bold text-[#ea580c]"
                iconSizeClass="w-7 h-7 text-[10px]"
                showSubText={true}
                fallbackTitle="BIC HACKATHON"
              />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {/* Hackathon Management Dropdown Accordion */}
            {canAccessHackathonsDropdown && (
              <div className="space-y-0.5 mb-1">
                <button
                  type="button"
                  onClick={() => setHackathonMgmtOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs font-normal text-slate-700">
                      Hackathon Management
                    </span>
                  </div>
                  {hackathonMgmtOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Collapsible Sub-Items */}
                {hackathonMgmtOpen && (
                  <div className="space-y-0.5 pl-3 ml-2.5 border-l border-slate-100 py-0.5">
                    {/* Hackathons */}
                    {canAccessHackathons && (
                      <Link
                        to="/admin-control-site/hackathons?tab=hackathons"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isHackathonsListActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isHackathonsListActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Trophy className="w-3.5 h-3.5 shrink-0" />
                        <span>Hackathons</span>
                      </Link>
                    )}

                    {/* Hackathon Organizers */}
                    {canAccessOrganizers && (
                      <Link
                        to="/admin-control-site/hackathons?tab=organizers"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isHackathonOrganizersActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isHackathonOrganizersActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Organizers</span>
                      </Link>
                    )}

                    {/* Hackathon Prizes */}
                    {canAccessHackathonCrm && (
                      <Link
                        to="/admin-control-site/hackathons?tab=prizes"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isHackathonPrizesActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isHackathonPrizesActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Trophy className="w-3.5 h-3.5 shrink-0" />
                        <span>Prizes</span>
                      </Link>
                    )}

                    {/* Hackathon Terms */}
                    {canAccessHackathonCrm && (
                      <Link
                        to="/admin-control-site/hackathons?tab=terms"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isHackathonTermsActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isHackathonTermsActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Terms</span>
                      </Link>
                    )}

                    {/* Hackathon Contacts */}
                    {canAccessHackathonCrm && (
                      <Link
                        to="/admin-control-site/hackathons?tab=contacts"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isHackathonContactsActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isHackathonContactsActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>Contacts</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Direct Organizations Link (when user has Organization permissions but no Sponsor Packages) */}
            {!canAccessSponsorPackagesSection && canAccessOrganizations && (
              <div className="mb-1">
                <Link
                  to="/admin-control-site/sponsors?tab=sponsors"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal transition-colors ${
                    isSponsorsActive && (currentTab === 'sponsors' || currentTab === 'organizations' || !currentTab)
                      ? 'shadow-xs text-white'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                  style={
                    isSponsorsActive && (currentTab === 'sponsors' || currentTab === 'organizations' || !currentTab)
                      ? { backgroundColor: '#ea580c', color: '#ffffff' }
                      : {}
                  }
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Organizations</span>
                </Link>
              </div>
            )}

            {/* Dedicated Sponsor Management Dropdown Accordion (when user has Sponsor Packages / Types access) */}
            {canAccessSponsorPackagesSection && (
              <div className="space-y-0.5 mb-1">
                <button
                  type="button"
                  onClick={() => setSponsorMgmtOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs font-normal text-slate-700">
                      Sponsor Management
                    </span>
                  </div>
                  {sponsorMgmtOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Collapsible Sub-Items for Sponsors */}
                {sponsorMgmtOpen && (
                  <div className="space-y-0.5 pl-3 ml-2.5 border-l border-slate-100 py-0.5">
                    {/* Organizations */}
                    {canAccessOrganizations && (
                      <Link
                        to="/admin-control-site/sponsors?tab=sponsors"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isSponsorsActive && (currentTab === 'sponsors' || currentTab === 'organizations')
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isSponsorsActive && (currentTab === 'sponsors' || currentTab === 'organizations')
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Organizations</span>
                      </Link>
                    )}

                    {/* Sponsor Packages */}
                    {canAccessSponsorPackages && (
                      <Link
                        to="/admin-control-site/sponsors?tab=packages"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isSponsorsActive && currentTab === 'packages'
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isSponsorsActive && currentTab === 'packages'
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        <span>Sponsor Packages</span>
                      </Link>
                    )}

                    {/* Package Types */}
                    {canAccessSponsorPackageTypes && (
                      <Link
                        to="/admin-control-site/sponsors?tab=types"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isSponsorsActive && currentTab === 'types'
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isSponsorsActive && currentTab === 'types'
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span>Package Types</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Schedule Management Dropdown Accordion */}
            {canAccessSchedules && (
              <div className="space-y-0.5 mb-1">
                <button
                  type="button"
                  onClick={() => setScheduleMgmtOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarClock className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs font-normal text-slate-700">
                      Schedule Management
                    </span>
                  </div>
                  {scheduleMgmtOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Collapsible Sub-Items for Schedule */}
                {scheduleMgmtOpen && (
                  <div className="space-y-0.5 pl-3 ml-2.5 border-l border-slate-100 py-0.5">
                    <Link
                      to="/admin-control-site/schedules"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isScheduleMilestonesActive
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isScheduleMilestonesActive
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>Schedules</span>
                    </Link>

                    <Link
                      to="/admin-control-site/schedules?tab=events"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isScheduleEventsActive
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isScheduleEventsActive
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Schedule Events</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User Management Dropdown Accordion */}
            {canAccessUserMgmtDropdown && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setUserMgmtOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCog className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs font-normal text-slate-700">
                      User Management
                    </span>
                  </div>
                  {userMgmtOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Collapsible Sub-Items */}
                {userMgmtOpen && (
                  <div className="space-y-0.5 pl-3 ml-2.5 border-l border-slate-100 py-0.5">
                    {/* Participants navigation removed - participants are now shown inline in the team view */}

                    {/* Teams */}
                    {canAccessTeams && (
                      <Link
                        to="/admin-control-site/teams"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isTeamsActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isTeamsActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>Teams</span>
                      </Link>
                    )}

                    {/* Guests */}
                    {canAccessParticipants && (
                      <Link
                        to="/admin-control-site/participants?tab=guests"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isParticipantGuestsActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isParticipantGuestsActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Guests</span>
                      </Link>
                    )}

                    {/* User Management */}
                    {canAccessUsers && (
                      <Link
                        to="/admin-control-site/users?tab=users"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isUsersListActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isUsersListActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>User Management</span>
                      </Link>
                    )}

                    {/* Organizers */}
                    {canAccessOrganizers && (
                      <Link
                        to="/admin-control-site/users?tab=organizers"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isOrganizersActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isOrganizersActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Organizers</span>
                      </Link>
                    )}

                    {/* Departments */}
                    {canAccessDepartments && (
                      <Link
                        to="/admin-control-site/users?tab=departments"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isDepartmentsActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isDepartmentsActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Departments</span>
                      </Link>
                    )}

                    {/* Group */}
                    {canAccessGroups && (
                      <Link
                        to="/admin-control-site/groups"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isGroupsActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isGroupsActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>Group</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Organizer Tasks - Single Direct Link */}
            {canAccessOrganizerTasks && (
              <div className="mb-1">
                <Link
                  to="/admin-control-site/organizer-tasks"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                    isOrganizerTasksActive
                      ? 'shadow-xs text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={isOrganizerTasksActive ? { backgroundColor: '#ea580c', color: '#ffffff' } : {}}
                >
                  <ClipboardList
                    className="w-4 h-4 shrink-0"
                    style={isOrganizerTasksActive ? { color: '#ffffff' } : { color: '#64748b' }}
                  />
                  <span>Organizer Tasks</span>
                </Link>
              </div>
            )}

            {/* Bottom Menu Items: Log */}
            {canAccessLogs && (
              <div className="pt-2 space-y-0.5 border-t border-slate-100 mt-2">
                {/* Log */}
                <Link
                  to="/admin-control-site/logs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                    isLogsActive
                      ? 'shadow-xs text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={
                    isLogsActive
                      ? { backgroundColor: '#ea580c', color: '#ffffff' }
                      : {}
                  }
                >
                  <ClipboardList className="w-4 h-4 shrink-0 text-slate-500" style={isLogsActive ? { color: '#ffffff' } : {}} />
                  <span>Log</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Footer with Profile Picture & Edit Profile & Logout */}
          <div className="p-4" style={{ borderTop: '1px solid #e8e9ef' }}>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left group hover:opacity-85 transition"
                title="Click to view & edit your personal profile (/api/v1/users/profile/)"
              >
                <img
                  src={profilePicUrl}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs border border-slate-200 group-hover:border-[#e8622a] bg-slate-100"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_USER_AVATAR;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate text-slate-900 flex items-center gap-1">
                    <span>{displayName}</span>
                    <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-[#e8622a] shrink-0" />
                  </div>
                  <div className="text-[11px] truncate text-slate-400 font-mono" title={currentUser?.email}>
                    {currentUser?.email || 'admin@bic.org'}
                  </div>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                title="Sign Out of Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: '#f5f6fa' }}>
          {/* Top Bar */}
          <header
            className="h-16 px-3 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-[#e8e9ef] transition-all duration-300"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0"
                aria-label="Open sidebar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold truncate" style={{ color: '#1a1a2e' }}>
                  {pageTitle}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                  {today}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Global Hackathon Edition Filter */}
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-orange-200/90 bg-orange-50/80 text-slate-800 shadow-2xs hover:border-orange-300 transition">
                <Trophy className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
                <select
                  value={selectedHackathonId || 'all'}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedHackathonId(newId);
                    setSelectedAdminHackathon(newId);
                  }}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[240px] truncate"
                  title="Filter all admin APIs by Hackathon Edition"
                >
                  <option value="all">All Hackathons</option>
                  {adminHackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title || h.name || 'Hackathon'}{h.version ? ` (${h.version})` : ''}{h.is_current ? ' ★ Active' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Link
                to="/"
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
                title="Return to Public Hackathon Website"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Public Site</span>
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="admin-main flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto" style={{ backgroundColor: '#f5f6fa' }}>
            <ErrorBoundary>
              <Suspense fallback={<AdminViewLoader />}>
                <Routes>
                  {/* Hackathon Management */}
                  <Route
                    path="hackathons"
                    element={canAccessHackathonsDropdown ? <HackathonManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="hackathons/*"
                    element={canAccessHackathonsDropdown ? <HackathonManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Sponsors & Packages Management */}
                  <Route
                    path="sponsors"
                    element={canAccessSponsorsDropdown ? <SponsorManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="sponsors/*"
                    element={canAccessSponsorsDropdown ? <SponsorManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Schedule Management */}
                  <Route
                    path="schedules"
                    element={canAccessSchedules ? <ScheduleManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="schedules/*"
                    element={canAccessSchedules ? <ScheduleManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* User Management */}
                  <Route
                    path="users"
                    element={canAccessUserMgmtDropdown ? <UserManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="users/*"
                    element={canAccessUserMgmtDropdown ? <UserManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Participant Directory & Guests */}
                  <Route
                    path="participants"
                    element={canAccessParticipants ? <CustomerManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="customers"
                    element={canAccessParticipants ? <CustomerManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="guests"
                    element={<Navigate to="/admin-control-site/participants?tab=guests" replace />}
                  />

                  {/* Group Management */}
                  <Route
                    path="groups"
                    element={canAccessGroups ? <GroupManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Team Management */}
                  <Route
                    path="teams"
                    element={canAccessTeams ? <TeamManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="teams/*"
                    element={canAccessTeams ? <TeamManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Organizer Tasks */}
                  <Route
                    path="organizer-tasks"
                    element={canAccessOrganizerTasks ? <OrganizerTaskManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="organizer-tasks/*"
                    element={canAccessOrganizerTasks ? <OrganizerTaskManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="tasks"
                    element={<Navigate to="/admin-control-site/organizer-tasks" replace />}
                  />

                  {/* System Config - Removed */}
                  <Route
                    path="system-config"
                    element={<Navigate to="/admin-control-site" replace />}
                  />

                  {/* Log Viewer */}
                  <Route
                    path="logs"
                    element={canAccessLogs ? <LogViewer /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Default redirect to Hackathon Management */}
                  <Route
                    path=""
                    element={<Navigate to="/admin-control-site/hackathons" replace />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/admin-control-site/hackathons" replace />}
                  />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>

        {/* Personal Profile Modal for Current User (PATCH /api/v1/users/profile/) */}
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onProfileUpdated={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
        />

        <Toast />
      </div>
    </ErrorBoundary>
  );
}
