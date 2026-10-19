import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setAuthToken, setRefreshToken, setAdminUser } from '../../services/api';
import { useHackathon } from '../../context/HackathonContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
  Shield
} from 'lucide-react';
import GoogleAuthButton from '../common/GoogleAuthButton';
import hackathonLogo from '../../assets/HACKATHON-LOGO.png';

export default function AdminLogin({ onLoginSuccess }) {
  const { showToast } = useHackathon();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOfflineOption, setShowOfflineOption] = useState(false);

  const extractErrorMessage = (err) => {
    // 1. Check err.data?.non_field_errors (standard Django REST Framework format: {"non_field_errors":["Invalid email or password."]})
    const nonField = err?.data?.non_field_errors;
    if (nonField) {
      if (Array.isArray(nonField)) {
        return nonField.join(' ');
      }
      return String(nonField);
    }

    // 2. Check err.data?.detail
    if (err?.data?.detail) {
      return typeof err.data.detail === 'string' ? err.data.detail : JSON.stringify(err.data.detail);
    }

    // 3. Check err.data?.message or err.data?.error
    if (err?.data?.message) {
      return String(err.data.message);
    }
    if (err?.data?.error) {
      return typeof err.data.error === 'string' ? err.data.error : JSON.stringify(err.data.error);
    }

    // 4. Check other field errors in err.data (e.g. { email: ["Enter a valid email address."] })
    if (err?.data && typeof err.data === 'object') {
      const entries = Object.entries(err.data);
      if (entries.length > 0) {
        const firstEntry = entries[0][1];
        if (Array.isArray(firstEntry) && firstEntry.length > 0) {
          return firstEntry.join(' ');
        }
        if (typeof firstEntry === 'string') {
          return firstEntry;
        }
      }
    }

    // 5. If err.message contains JSON with non_field_errors or other keys
    if (typeof err?.message === 'string') {
      if (err.message.includes('non_field_errors')) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed?.non_field_errors) {
            return Array.isArray(parsed.non_field_errors)
              ? parsed.non_field_errors.join(' ')
              : String(parsed.non_field_errors);
          }
        } catch {
          const match = err.message.match(/"non_field_errors":\s*\[?"([^"\]]+)"/);
          if (match && match[1]) return match[1];
        }
      }

      const isNetworkError =
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.status === 0;

      if (isNetworkError) {
        return 'Could not connect to backend server. Ensure backend is running.';
      }

      if (
        err.message !== 'Bad Request' &&
        err.message !== 'Unauthorized' &&
        err.message !== '[object Object]' &&
        !err.message.startsWith('{')
      ) {
        return err.message;
      }
    }

    return 'Invalid email or password.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowOfflineOption(false);

    if (!email.trim() || !password) {
      showToast('Please enter both email and password.', 'error');
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
      showToast('Authentication successful! Loading Admin Panel...', 'success');

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
        setShowOfflineOption(true);
      }

      const errorText = extractErrorMessage(err);
      showToast(errorText, 'error');
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
    showToast('Logged in with Demo Session Mode', 'info');
    if (onLoginSuccess) {
      onLoginSuccess(demoUser);
    }
  };

  const handleGoogleSuccess = (userData) => {
    showToast(`Google Authentication successful! Welcome, ${userData?.first_name || userData?.email || 'Admin'}.`, 'success');
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    }, 600);
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

      {/* Return to Public Site Button */}
      <div className="w-full max-w-md flex justify-start mb-4 sm:absolute sm:top-6 sm:left-6 sm:mb-0 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 hover:bg-white transition-all shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Site</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-10 relative z-10">
        {/* Heading */}
        <div className="text-center mb-8">
          <img
            src={hackathonLogo}
            alt="BIC Hackathon"
            className="h-10 w-auto mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign in to Hackathon Admin
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
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
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Optional demo link when backend is offline */}
        {showOfflineOption && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-center animate-fade-in">
            <button
              type="button"
              onClick={handleOfflineDemoLogin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#e8622a] transition"
            >
              <Shield className="w-3.5 h-3.5 text-[#e8622a]" />
              <span>Backend server offline? Enter via Demo Mode</span>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-mono text-slate-600 uppercase tracking-wider font-semibold">
            Or Continue With Google
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google Authentication for Admin */}
        <div>
          <GoogleAuthButton
            mode="admin"
            text="Sign in with Google Admin"
            showDirectTokenInput={false}
            onSuccess={handleGoogleSuccess}
            onError={(err, msg) => showToast(msg || extractErrorMessage(err), 'error')}
          />
        </div>
      </div>
    </div>
  );
}
