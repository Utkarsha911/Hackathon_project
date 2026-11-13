import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

const CustomerPortal = lazy(() => import('./components/customer/CustomerPortal'));
const CustomerProfilePage = lazy(() => import('./components/customer/CustomerProfilePage'));
const RegisterTeamPage = lazy(() => import('./components/customer/RegisterTeamPage'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-orange-200 border-t-[#e8622a] rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 tracking-wide">
          Loading platform...
        </span>
      </div>
    </div>
  );
}

function RouteLoadingBoundary() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RouteLoadingBoundary />,
    children: [
      {
        index: true,
        element: <CustomerPortal />,
      },
      {
        path: 'register',
        element: <RegisterTeamPage />,
      },
      {
        path: 'profile',
        element: <CustomerProfilePage />,
      },
      {
        path: 'customer-profile',
        element: <Navigate to="/profile" replace />,
      },
      {
        path: 'admin-control-site/*',
        element: <AdminLayout />,
      },
      {
        path: 'admin/*',
        element: <Navigate to="/admin-control-site" replace />,
      },
      {
        path: 'admin',
        element: <Navigate to="/admin-control-site" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
