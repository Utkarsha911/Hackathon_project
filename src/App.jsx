import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerPortal from './components/customer/CustomerPortal';
import AdminLayout from './components/admin/AdminLayout';

export default function App() {
  return (
    <Routes>
      {/* Customer-Facing Public Website on / */}
      <Route path="/" element={<CustomerPortal />} />

      {/* Admin Panel on /admin and sub-routes */}
      <Route path="/admin/*" element={<AdminLayout />} />

      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
