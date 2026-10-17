import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setAuthToken, setRefreshToken, setAdminUser } from '../../services/api';
import {
  Flame,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Server
} from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showOfflineOption, setShowOfflineOption] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setShowOfflineOption(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // Calls POST /api/v1/users/login/
      const response = await api.users.login({
        email: email.trim(),
        password: password
      });

      // Extract token if present
      const token =
        response?.access ||
        response?.token ||
        response?.access_token ||
        response?.key ||
        response?.auth_token ||
        response?.data?.token ||
        response?.data?.access ||
        response?.tokens?.access ||
        (typeof response === 'string' ? response : null);

      const refreshToken =
        response?.refresh ||
        response?.refresh_token ||
        response?.data?.refresh ||
        response?.tokens?.refresh;

      if (token) {
        setAuthToken(token);
      }

      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      // Extract user info
      const userData = response?.user || {
        email: response?.email || email.trim(),
        first_name: response?.first_name || email.trim().split('@')[0],
        last_name: response?.last_name || 'Admin',
        role: response?.role || 'Administrator',
        groups: response?.groups || [0],
        ...response
      };

      setAdminUser(userData);
      setSuccessMessage('Authentication successful! Loading Admin Panel...');

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      }, 500);
    } catch (err) {
      console.error('Admin Login failed:', err);
      const isNetworkError =
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.status === 0;

      if (isNetworkError) {
        setErrorMessage(
          'Could not connect to backend at http://127.0.0.1:8000/api/v1/users/login/. Ensure the backend server is running.'
        );
        setShowOfflineOption(true);
      } else {
        setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineDemoLogin = () => {
    const demoUser = {
      email: email.trim() || 'admin@bichackathon.org',
      first_name: 'Admin',
      last_name: 'User',
      role: 'Super Admin',
      groups: [0],
      is_demo: true
    };
    setAuthToken('demo_admin_jwt_session_token_xyz');
    setAdminUser(demoUser);
    if (onLoginSuccess) {
      onLoginSuccess(demoUser);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: '#f8fafc' }}
    >
      {/* Background Decorative Gradient Blobs */}
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #e8622a 0%, #ff8c42 100%)' }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, #93c5fd 100%)' }}
      />

      {/* Top Bar Back Link */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Site</span>
        </Link>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 font-medium">
          <Server className="w-3 h-3 text-[#e8622a]" />
          <span>/api/v1/users/login/</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 sm:p-10 relative z-10">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4 transition-transform hover:scale-105"
            style={{ backgroundColor: '#e8622a' }}
          >
            <Flame className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase mb-2 bg-orange-50 text-[#e8622a] border border-orange-200/60">
            <ShieldCheck className="w-3 h-3" />
            <span>Admin Authentication</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign in to BIC Admin
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your admin email and password to access the control panel
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5 text-red-600 leading-relaxed">{errorMessage}</p>
              {showOfflineOption && (
                <div className="mt-3 pt-2 border-t border-red-200/70">
                  <p className="text-[11px] text-red-600 mb-2">
                    Testing offline or before backend is launched?
                  </p>
                  <button
                    type="button"
                    onClick={handleOfflineDemoLogin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Proceed in Demo Session Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#e8622a] focus:ring-2 focus:ring-[#e8622a]/20 transition bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#e8622a] focus:ring-2 focus:ring-[#e8622a]/20 transition bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#e8622a' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating via API...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Admin Panel</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* API Endpoint Note */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            POST payload connects to{' '}
            <code className="text-[#e8622a] font-mono bg-orange-50 px-1 py-0.5 rounded text-[10px]">
              /api/v1/users/login/
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
