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
  getMediaUrl
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
  Flame,
  LogOut,
  Sparkles,
  Layers,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Edit3
} from 'lucide-react';

// Lazy loaded admin views
const AdminLogin = lazy(() => import('./AdminLogin'));
const UserManagement = lazy(() => import('./UserManagement'));
const GroupManagement = lazy(() => import('./GroupManagement'));
const TeamManagement = lazy(() => import('./TeamManagement'));
const CustomerManagement = lazy(() => import('./CustomerManagement'));
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
      navigate('/admin');
    };

    window.addEventListener('bic_auth_logout', handleAuthLogout);
    window.addEventListener('bic_user_updated', handleUserUpdated);
    return () => {
      window.removeEventListener('bic_auth_logout', handleAuthLogout);
      window.removeEventListener('bic_user_updated', handleUserUpdated);
    };
  }, [navigate]);

  // User Management Dropdown accordion state (default open as shown in user screenshot)
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    navigate('/admin');
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
  const isDashboardActive = pathname === '/admin' || pathname === '/admin/';
  const isCustomersActive = pathname.startsWith('/admin/customers');
  const isUsersActive = pathname.startsWith('/admin/users');
  const isGroupsActive = pathname.startsWith('/admin/groups');
  const isTeamsActive = pathname.startsWith('/admin/teams');
  const isSystemConfigActive = pathname.startsWith('/admin/system-config');
  const isLogsActive = pathname.startsWith('/admin/logs');

  const initials = `${currentUser?.first_name?.[0] || 'A'}${currentUser?.last_name?.[0] || 'D'}`.toUpperCase();
  const displayName = `${currentUser?.first_name || 'Admin'} ${currentUser?.last_name || 'User'}`;
  const profilePicUrl = currentUser?.profile_picture ? getMediaUrl(currentUser.profile_picture) : null;

  const userRole = (currentUser?.role || '').toLowerCase();
  const isAdmin =
    userRole === 'admin' ||
    userRole === 'administrator' ||
    userRole === 'super admin' ||
    Boolean(currentUser?.is_superuser) ||
    Boolean(currentUser?.is_staff);

  // Header Title mapping
  let pageTitle = 'Admin Workspace';
  if (isUsersActive) pageTitle = 'User Management';
  else if (isCustomersActive) pageTitle = 'Customer Directory';
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
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: '#e8622a' }}
              >
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight tracking-tight" style={{ color: '#1a1a2e' }}>
                  BIC Admin
                </div>
                <div className="text-[11px] font-medium" style={{ color: '#9a9ab0' }}>
                  Control Center
                </div>
              </div>
            </div>

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
              to="/admin"
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

            {/* User Management Dropdown Accordion (Admin Only) */}
            {isAdmin && (
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
                    {/* Customer */}
                    <Link
                      to="/admin/customers"
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
                      <span>Customer</span>
                    </Link>

                    {/* User Management */}
                    <Link
                      to="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-normal transition-all ${
                        isUsersActive
                          ? 'shadow-xs text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={
                        isUsersActive
                          ? { backgroundColor: '#ea580c', color: '#ffffff' }
                          : {}
                      }
                    >
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>User Management</span>
                    </Link>

                    {/* Group */}
                    <Link
                      to="/admin/groups"
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

                    {/* Team */}
                    <Link
                      to="/admin/teams"
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
                      <span>Team</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Menu Items: System Config & Log */}
            <div className="pt-2 space-y-0.5 border-t border-slate-100 mt-2">
              {/* System Config */}
              <Link
                to="/admin/system-config"
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

              {/* Log */}
              <Link
                to="/admin/logs"
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
            className="h-16 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30"
            style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e8e9ef' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold" style={{ color: '#1a1a2e' }}>
                  {pageTitle}
                </h1>
                <p className="text-xs text-slate-400">
                  {today}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-orange-200 bg-orange-50 text-[#c2410c] hover:bg-orange-100 shadow-xs"
                title="Edit Personal Profile (/api/v1/users/profile/)"
              >
                <User className="w-3.5 h-3.5 text-[#e8622a]" />
                <span>My Profile</span>
              </button>

              <Link
                to="/"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Public Site</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 sm:p-8 overflow-y-auto" style={{ backgroundColor: '#f5f6fa' }}>
            <ErrorBoundary>
              <Suspense fallback={<AdminViewLoader />}>
                <Routes>
                  {/* User Management (Admin Only) */}
                  <Route
                    path="users"
                    element={isAdmin ? <UserManagement /> : <Navigate to="/admin" replace />}
                  />
                  <Route
                    path="users/*"
                    element={isAdmin ? <UserManagement /> : <Navigate to="/admin" replace />}
                  />

                  {/* Customer Directory */}
                  <Route path="customers" element={<CustomerManagement />} />

                  {/* Group Management */}
                  <Route path="groups" element={<GroupManagement />} />

                  {/* Team Management */}
                  <Route path="teams" element={<TeamManagement />} />

                  {/* System Config */}
                  <Route path="system-config" element={<SystemConfig />} />

                  {/* Log Viewer */}
                  <Route path="logs" element={<LogViewer />} />

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
                            <Sparkles className="w-7 h-7" style={{ color: '#e8622a' }} />
                          </div>

                          <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: '#1a1a2e' }}>
                            Welcome, {displayName}!
                          </h2>

                          <p className="text-sm max-w-xl text-slate-600 mb-6 leading-relaxed">
                            You are authenticated via{' '}
                            <code className="text-[#e8622a] font-mono text-xs bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                              /api/v1/users/login/
                            </code>
                            . Access the full administration hierarchy using the navigation dropdown on the left.
                          </p>

                          <div className="flex flex-wrap items-center gap-3">
                            {isAdmin && (
                              <>
                                <Link
                                  to="/admin/users"
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                                  style={{ backgroundColor: '#ea580c' }}
                                >
                                  <Users className="w-4 h-4" />
                                  <span>Go to User Management</span>
                                  <ChevronRight className="w-4 h-4" />
                                </Link>

                                <Link
                                  to="/admin/groups"
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                                >
                                  <Users className="w-4 h-4 text-[#e8622a]" />
                                  <span>View Groups</span>
                                </Link>

                                <Link
                                  to="/admin/teams"
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                                >
                                  <Users className="w-4 h-4 text-[#e8622a]" />
                                  <span>View Teams</span>
                                </Link>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Feature Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {isAdmin && (
                            <>
                              <Link
                                to="/admin/users"
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

                              <Link
                                to="/admin/groups"
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

                              <Link
                                to="/admin/teams"
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
                            </>
                          )}

                          <Link
                            to="/admin/system-config"
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
