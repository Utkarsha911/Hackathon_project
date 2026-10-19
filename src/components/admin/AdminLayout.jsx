import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Toast from '../common/Toast';
import ErrorBoundary from '../common/ErrorBoundary';
import UserProfileModal from '../common/UserProfileModal';
import {
  api,
  getAdminUser,
  setAdminUser,
  getAuthToken,
  clearAdminUser,
  clearAuthToken,
  clearRefreshToken,
  logout,
  getMediaUrl,
  getSelectedAdminHackathon,
  setSelectedAdminHackathon
} from '../../services/api';
import {
  UserCog,
  ChevronUp,
  ChevronDown,
  Users,
  UserCheck,
  User,
  Settings,
  ClipboardList,
  FolderTree,
  Shield,
  LayoutDashboard,
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
  PieChart,
  CalendarClock,
  Calendar,
  Award,
  HelpCircle,
  Mail,
  Clock,
  CheckCircle2
} from 'lucide-react';
import hackathonLogo from '../../assets/HACKATHON-LOGO.png';

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
const SystemConfig = lazy(() => import('./SystemConfig'));
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
      (getAuthToken()
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
    if (getAuthToken()) {
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
    if (getAuthToken() && !getAdminUser()?.id) {
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

    const handleAuthLogout = () => {
      setCurrentUser(null);
      navigate('/admin-control-site');
    };

    window.addEventListener('bic_auth_logout', handleAuthLogout);
    window.addEventListener('bic_user_updated', handleUserUpdated);
    return () => {
      window.removeEventListener('bic_auth_logout', handleAuthLogout);
      window.removeEventListener('bic_user_updated', handleUserUpdated);
    };
  }, [navigate]);

  // Dropdown accordion states
  const [hackathonMgmtOpen, setHackathonMgmtOpen] = useState(true);
  const [sponsorMgmtOpen, setSponsorMgmtOpen] = useState(true);
  const [scheduleMgmtOpen, setScheduleMgmtOpen] = useState(true);
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);
  const [organizerTasksOpen, setOrganizerTasksOpen] = useState(true);

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
    logout();
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
  const isDashboardActive = pathname === '/admin-control-site' || pathname === '/admin-control-site/';
  const isHackathonsActive = pathname.startsWith('/admin-control-site/hackathons');
  const isHackathonOrganizersActive = isHackathonsActive && hackathonTab === 'organizers';
  const isHackathonTeamsActive = (isHackathonsActive && hackathonTab === 'teams') || pathname === '/admin-control-site/teams';
  const isHackathonPrizesActive = isHackathonsActive && (hackathonTab === 'prizes' || hackathonTab === 'prizes-faqs');
  const isHackathonFaqsActive = isHackathonsActive && hackathonTab === 'faqs';
  const isHackathonContactsActive = isHackathonsActive && hackathonTab === 'contacts';
  const isHackathonsListActive =
    isHackathonsActive &&
    hackathonTab !== 'organizers' &&
    hackathonTab !== 'teams' &&
    !isHackathonPrizesActive &&
    !isHackathonFaqsActive &&
    !isHackathonContactsActive;
  const isSponsorsActive = pathname.startsWith('/admin-control-site/sponsors');
  const isSchedulesActive = pathname.startsWith('/admin-control-site/schedules');
  const isCustomersActive = pathname.startsWith('/admin-control-site/participants') || pathname.startsWith('/admin-control-site/customers');
  const isUsersActive = pathname.startsWith('/admin-control-site/users');
  const isDepartmentsActive = isUsersActive && userTab === 'departments';
  const isOrganizersActive = isUsersActive && userTab === 'organizers';
  const isUsersListActive = isUsersActive && userTab !== 'organizers' && userTab !== 'departments';
  const isOrganizerTasksActive = pathname.startsWith('/admin-control-site/organizer-tasks') || pathname.startsWith('/admin-control-site/tasks');
  const isGroupsActive = pathname.startsWith('/admin-control-site/groups');
  const isTeamsActive = isHackathonTeamsActive;
  const isSystemConfigActive = pathname.startsWith('/admin-control-site/system-config');
  const isLogsActive = pathname.startsWith('/admin-control-site/logs');

  const initials = `${currentUser?.first_name?.[0] || 'A'}${currentUser?.last_name?.[0] || 'D'}`.toUpperCase();
  const displayName = `${currentUser?.first_name || 'Admin'} ${currentUser?.last_name || 'User'}`;
  const profilePicUrl = currentUser?.profile_picture ? getMediaUrl(currentUser.profile_picture) : null;

  const userRole = (currentUser?.role || '').toLowerCase();
  const isSuperOrStaff =
    userRole === 'admin' ||
    userRole === 'administrator' ||
    userRole === 'super admin' ||
    Boolean(currentUser?.is_superuser) ||
    Boolean(currentUser?.is_staff);

  // Group permission evaluation:
  // "show everything to 'is_staff': true, 'is_superuser': true, but only show the items which permission inside group is given inside groups permission"
  const hasPermission = (scopes) => {
    if (isSuperOrStaff) return true;

    const scopeList = (Array.isArray(scopes) ? scopes : [scopes]).map((s) => s.toLowerCase());

    // 1. Direct user permissions
    const userPerms = currentUser?.permissions || currentUser?.user_permissions || [];
    if (Array.isArray(userPerms)) {
      for (const p of userPerms) {
        const pStr = (typeof p === 'string' ? p : p?.codename || p?.name || '').toLowerCase();
        if (scopeList.some((s) => pStr.includes(s))) return true;
      }
    }

    // 2. Group permissions from user's groups
    const groupsToCheck = [
      ...(Array.isArray(userGroupObjects) ? userGroupObjects : []),
      ...(Array.isArray(currentUser?.groups) ? currentUser.groups : [])
    ];

    for (const group of groupsToCheck) {
      if (!group || typeof group !== 'object') continue;

      if (group.permissions_name && typeof group.permissions_name === 'object') {
        for (const [category, perms] of Object.entries(group.permissions_name)) {
          const catLower = category.toLowerCase();
          if (scopeList.some((s) => catLower.includes(s))) return true;
          if (Array.isArray(perms)) {
            for (const perm of perms) {
              const pStr = (perm?.codename || perm?.name || '').toLowerCase();
              if (scopeList.some((s) => pStr.includes(s))) return true;
            }
          }
        }
      }

      if (Array.isArray(group.permissions)) {
        for (const perm of group.permissions) {
          if (typeof perm === 'string') {
            const pStr = perm.toLowerCase();
            if (scopeList.some((s) => pStr.includes(s))) return true;
          } else if (typeof perm === 'object' && perm !== null) {
            const pStr = (perm.codename || perm.name || '').toLowerCase();
            if (scopeList.some((s) => pStr.includes(s))) return true;
          }
        }
      }
    }

    return false;
  };

  const canAccessHackathons = hasPermission(['hackathon', 'event']);
  const canAccessSponsors = hasPermission(['sponsor', 'sponsorship', 'package']);
  const canAccessParticipants = hasPermission(['participant', 'customer', 'user', 'registration']);
  const canAccessUsers = hasPermission(['user', 'customuser']);
  const canAccessOrganizers = hasPermission(['organizer', 'user', 'customuser']);
  const canAccessGroups = hasPermission(['group', 'permission']);
  const canAccessTeams = hasPermission(['team', 'hackathon']);
  const canAccessOrganizerTasks = hasPermission(['task', 'organizer', 'hackathon']);
  const canAccessUserMgmt = canAccessParticipants || canAccessUsers || canAccessOrganizers || canAccessGroups;
  const canAccessSystemConfig = hasPermission(['config', 'setting', 'system']);
  const canAccessLogs = hasPermission(['activity', 'log', 'audit', 'comment']);

  // Schedule Access Rule:
  // Show only to users who have group "admin schedules" (or "admin schedule"), and show everything to is_superuser: true
  const isSuperuser = Boolean(currentUser?.is_superuser === true);
  const userGroupsList = [
    ...(Array.isArray(currentUser?.groups) ? currentUser.groups : []),
    ...(Array.isArray(userGroupObjects) ? userGroupObjects : [])
  ];
  const hasAdminSchedulesGroup = userGroupsList.some((g) => {
    const name = typeof g === 'string' ? g : (g?.name || '');
    const clean = name.toLowerCase().replace(/[-_]/g, ' ').trim();
    return clean === 'admin schedules' || clean === 'admin schedule' || clean.includes('admin schedule');
  });
  const canAccessSchedules = isSuperuser || hasAdminSchedulesGroup;

  // Header Title mapping
  let pageTitle = 'Admin Workspace';
  if (isHackathonOrganizersActive) pageTitle = 'Hackathon Organizers';
  else if (isHackathonPrizesActive) pageTitle = 'Prize Management';
  else if (isHackathonFaqsActive) pageTitle = 'FAQ Management';
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
  else if (isSystemConfigActive) pageTitle = 'System Configuration';
  else if (isLogsActive) pageTitle = 'Activity & Logs';

  return (
    <ErrorBoundary>
      <div
        className="min-h-screen flex"
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
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e8e9ef', minHeight: '100vh' }}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6" style={{ borderBottom: '1px solid #e8e9ef' }}>
            <Link to="/admin-control-site" className="flex items-center gap-3 group">
              <img
                src={hackathonLogo}
                alt="BIC Hackathon Admin"
                className="h-8 w-auto object-contain transition-opacity group-hover:opacity-90"
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
            {/* Admin Workspace / Dashboard */}
            <Link
              to="/admin-control-site"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal transition-all mb-1.5 ${
                isDashboardActive
                  ? 'shadow-xs text-white'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
              style={
                isDashboardActive
                  ? { backgroundColor: '#ea580c', color: '#ffffff' }
                  : {}
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Admin Workspace</span>
            </Link>

            {/* Hackathon Management Dropdown Accordion */}
            {canAccessHackathons && (
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

                    {/* Hackathon Organizers */}
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

                    {/* Hackathon Teams */}
                    <Link
                      to="/admin-control-site/hackathons?tab=teams"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isHackathonTeamsActive
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isHackathonTeamsActive
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Teams</span>
                    </Link>

                    {/* Hackathon Prizes */}
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

                    {/* Hackathon FAQs */}
                    <Link
                      to="/admin-control-site/hackathons?tab=faqs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isHackathonFaqsActive
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isHackathonFaqsActive
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>FAQs</span>
                    </Link>

                    {/* Hackathon Contacts */}
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
                  </div>
                )}
              </div>
            )}

            {/* Dedicated Sponsor Management Dropdown Accordion */}
            {canAccessSponsors && (
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
                    {/* Organizations (formerly Sponsors Directory) */}
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

                    {/* Sponsor Packages */}
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

                    {/* Package Types */}
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

                    {/* Sponsorship Breakdown */}
                    <Link
                      to="/admin-control-site/sponsors?tab=breakdown"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isSponsorsActive && currentTab === 'breakdown'
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isSponsorsActive && currentTab === 'breakdown'
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <PieChart className="w-3.5 h-3.5 shrink-0" />
                      <span>Sponsorship Breakdown</span>
                    </Link>
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
                        isSchedulesActive
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isSchedulesActive
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>Schedules</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User Management Dropdown Accordion */}
            {canAccessUserMgmt && (
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
                    {/* Participants */}
                    {canAccessParticipants && (
                      <Link
                        to="/admin-control-site/participants"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                          isCustomersActive
                            ? 'shadow-xs text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        style={
                          isCustomersActive
                            ? { backgroundColor: '#ea580c', color: '#ffffff' }
                            : {}
                        }
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>Participants</span>
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
                    {canAccessUserMgmt && (
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

            {/* Dedicated Organizer Tasks Dropdown Accordion */}
            {canAccessOrganizerTasks && (
              <div className="space-y-0.5 mb-1">
                <button
                  type="button"
                  onClick={() => setOrganizerTasksOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs font-normal text-slate-700">
                      Organizer Tasks
                    </span>
                  </div>
                  {organizerTasksOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Collapsible Sub-Items for Organizer Tasks */}
                {organizerTasksOpen && (
                  <div className="space-y-0.5 pl-3 ml-2.5 border-l border-slate-100 py-0.5">
                    <Link
                      to="/admin-control-site/organizer-tasks"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isOrganizerTasksActive && (!location.search || !location.search.includes('status='))
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isOrganizerTasksActive && (!location.search || !location.search.includes('status='))
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                      <span>All Tasks</span>
                    </Link>

                    <Link
                      to="/admin-control-site/organizer-tasks?status=pending"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isOrganizerTasksActive && location.search.includes('status=pending')
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isOrganizerTasksActive && location.search.includes('status=pending')
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Pending Tasks</span>
                    </Link>

                    <Link
                      to="/admin-control-site/organizer-tasks?status=completed"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isOrganizerTasksActive && location.search.includes('status=completed')
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isOrganizerTasksActive && location.search.includes('status=completed')
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Completed Tasks</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Menu Items: System Config & Log */}
            {(canAccessSystemConfig || canAccessLogs) && (
              <div className="pt-2 space-y-0.5 border-t border-slate-100 mt-2">
                {/* System Config */}
                {canAccessSystemConfig && (
                  <Link
                    to="/admin-control-site/system-config"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal transition-all ${
                      isSystemConfigActive
                        ? 'shadow-xs text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    style={
                      isSystemConfigActive
                        ? { backgroundColor: '#ea580c', color: '#ffffff' }
                        : {}
                    }
                  >
                    <Settings className="w-4 h-4 shrink-0 text-slate-500" style={isSystemConfigActive ? { color: '#ffffff' } : {}} />
                    <span>System Config</span>
                  </Link>
                )}

                {/* Log */}
                {canAccessLogs && (
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
                )}
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
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs border border-slate-200 group-hover:border-[#e8622a]"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                  style={{
                    backgroundColor: '#e8622a',
                    display: profilePicUrl ? 'none' : 'flex'
                  }}
                >
                  {initials}
                </div>
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
            className="h-16 px-3 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30"
            style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e8e9ef' }}
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c2410c] hidden md:inline">
                  Edition:
                </span>
                <select
                  value={selectedHackathonId || 'all'}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedHackathonId(newId);
                    setSelectedAdminHackathon(newId);
                  }}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
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

              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-orange-200 bg-orange-50 text-[#c2410c] hover:bg-orange-100 shadow-xs"
                title="Edit Personal Profile (/api/v1/users/profile/)"
              >
                <User className="w-3.5 h-3.5 text-[#e8622a]" />
                <span className="hidden sm:inline">My Profile</span>
              </button>

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
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto" style={{ backgroundColor: '#f5f6fa' }}>
            <ErrorBoundary>
              <Suspense fallback={<AdminViewLoader />}>
                <Routes>
                  {/* Hackathon Management */}
                  <Route
                    path="hackathons"
                    element={canAccessHackathons ? <HackathonManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="hackathons/*"
                    element={canAccessHackathons ? <HackathonManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Sponsors & Packages Management */}
                  <Route
                    path="sponsors"
                    element={canAccessSponsors ? <SponsorManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="sponsors/*"
                    element={canAccessSponsors ? <SponsorManagement /> : <Navigate to="/admin-control-site" replace />}
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
                    element={canAccessUsers ? <UserManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="users/*"
                    element={canAccessUsers ? <UserManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Participant Directory */}
                  <Route
                    path="participants"
                    element={canAccessParticipants ? <CustomerManagement /> : <Navigate to="/admin-control-site" replace />}
                  />
                  <Route
                    path="customers"
                    element={canAccessParticipants ? <CustomerManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Group Management */}
                  <Route
                    path="groups"
                    element={canAccessGroups ? <GroupManagement /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Team Management */}
                  <Route
                    path="teams"
                    element={<Navigate to="/admin-control-site/hackathons?tab=teams" replace />}
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

                  {/* System Config */}
                  <Route
                    path="system-config"
                    element={canAccessSystemConfig ? <SystemConfig /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Log Viewer */}
                  <Route
                    path="logs"
                    element={canAccessLogs ? <LogViewer /> : <Navigate to="/admin-control-site" replace />}
                  />

                  {/* Default Admin Workspace Overview */}
                  <Route
                    path="*"
                    element={
                      <div className="max-w-4xl mx-auto py-6 space-y-6">
                        {/* Hero Welcome Card */}
                        <div
                          className="rounded-2xl p-8 sm:p-10 border shadow-sm relative overflow-hidden"
                          style={{ backgroundColor: '#ffffff', borderColor: '#e8e9ef' }}
                        >
                          <div
                            className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center shadow-inner"
                            style={{ backgroundColor: '#fff3ef' }}
                          >
                            <Trophy className="w-7 h-7" style={{ color: '#e8622a' }} />
                          </div>

                          <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: '#1a1a2e' }}>
                            Welcome, {displayName}!
                          </h2>

                          <p className="text-sm max-w-xl text-slate-600 mb-6 leading-relaxed">
                            You are authenticated via{' '}
                            <code className="text-[#e8622a] font-mono text-xs bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                              /api/v1/users/login/
                            </code>
                            . Access administration tools using the navigation menu on the left.
                          </p>

                          <div className="flex flex-wrap items-center gap-3">
                            {canAccessHackathons && (
                              <Link
                                to="/admin-control-site/hackathons"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                                style={{ backgroundColor: '#ea580c' }}
                              >
                                <Trophy className="w-4 h-4" />
                                <span>Hackathons</span>
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            )}

                            {canAccessUsers && (
                              <Link
                                to="/admin-control-site/users"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                              >
                                <UserCheck className="w-4 h-4 text-[#e8622a]" />
                                <span>User Management</span>
                              </Link>
                            )}

                            {canAccessGroups && (
                              <Link
                                to="/admin-control-site/groups"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                              >
                                <Users className="w-4 h-4 text-[#e8622a]" />
                                <span>View Groups</span>
                              </Link>
                            )}

                            {canAccessTeams && (
                              <Link
                                to="/admin-control-site/hackathons?tab=teams"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                              >
                                <Users className="w-4 h-4 text-[#e8622a]" />
                                <span>View Teams</span>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Feature Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {canAccessHackathons && (
                            <Link
                              to="/admin-control-site/hackathons"
                              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <Trophy className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#e8622a] transition-colors">
                                Hackathon Management
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Inspect editions, registration timelines, team sizes, and banner images via <code className="text-[11px] font-mono text-slate-700">/api/v1/hackathons/</code>.
                              </p>
                            </Link>
                          )}

                          {canAccessSponsors && (
                            <Link
                              to="/admin-control-site/sponsors"
                              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#ea580c] transition-colors">
                                Sponsors & Package Tiers
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Manage corporate sponsors, packages, perks, and tier allocation breakdown.
                              </p>
                            </Link>
                          )}

                          {canAccessUsers && (
                            <Link
                              to="/admin-control-site/users"
                              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e8622a] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <UserCheck className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#e8622a] transition-colors">
                                User Management & Registration
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Manage user accounts, role allocations, and security credentials.
                              </p>
                            </Link>
                          )}

                          {canAccessGroups && (
                            <Link
                              to="/admin-control-site/groups"
                              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <FolderTree className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#e8622a] transition-colors">
                                Group Permissions Catalog
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Live groups and categories directly from <code className="text-[11px] font-mono text-slate-700">/api/v1/users/groups/list_groups/</code>.
                              </p>
                            </Link>
                          )}

                          {canAccessTeams && (
                            <Link
                              to="/admin-control-site/hackathons?tab=teams"
                              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <Users className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#e8622a] transition-colors">
                                Team Submissions & Tracks
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Review participating teams, assigned projects, and GitHub repository links.
                              </p>
                            </Link>
                          )}

                          {canAccessSystemConfig && (
                            <Link
                              to="/admin-control-site/system-config"
                              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <Settings className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#e8622a] transition-colors">
                                System Configuration & Auth
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Inspect active Bearer token and gateway API endpoints.
                              </p>
                            </Link>
                          )}
                        </div>
                      </div>
                    }
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
