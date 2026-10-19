import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy loaded page components
const CustomerPortal = lazy(() => import('./components/customer/CustomerPortal'));
const CustomerProfilePage = lazy(() => import('./components/customer/CustomerProfilePage'));
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

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Customer-Facing Public Website on / */}
        <Route path="/" element={<CustomerPortal />} />

        {/* Customer Profile & Teams Page */}
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/customer-profile" element={<Navigate to="/profile" replace />} />

        {/* Admin Panel on /admin-control-site and sub-routes */}
        <Route path="/admin-control-site/*" element={<AdminLayout />} />
        <Route path="/admin/*" element={<Navigate to="/admin-control-site" replace />} />
        <Route path="/admin" element={<Navigate to="/admin-control-site" replace />} />

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
