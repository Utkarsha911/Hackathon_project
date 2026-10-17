import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Image as ImageIcon,
  FileText,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api, getMediaUrl, getAdminUser, setAdminUser } from '../../services/api';

export default function UserProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial user record from cache or GET /api/v1/users/profile/
  const [profileData, setProfileData] = useState(null);

  // Editable fields strictly restricted to personal profile:
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    profile_picture: '',
    bio: ''
  });

  // Fetch profile if not already cached
  const fetchProfile = async () => {
    const cached = getAdminUser();
    if (cached) {
      setProfileData(cached);
      setFormData({
        first_name: cached.first_name || '',
        last_name: cached.last_name || '',
        phone_number: cached.phone_number || '',
        date_of_birth: cached.date_of_birth || '',
        profile_picture: cached.profile_picture || '',
        bio: cached.bio || ''
      });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.users.getProfile();
      if (data) {
        setProfileData(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          date_of_birth: data.date_of_birth || '',
          profile_picture: data.profile_picture || '',
          bio: data.bio || ''
        });
        setAdminUser(data);
      }
    } catch (err) {
      console.warn('api.users.getProfile fetch error:', err);
      setError(err?.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Compute diff: ONLY patch the fields that were updated
    const patchPayload = {};
    if (formData.first_name.trim() !== (profileData?.first_name || '')) {
      patchPayload.first_name = formData.first_name.trim();
    }
    if (formData.last_name.trim() !== (profileData?.last_name || '')) {
      patchPayload.last_name = formData.last_name.trim();
    }
    if (formData.phone_number.trim() !== (profileData?.phone_number || '')) {
      patchPayload.phone_number = formData.phone_number.trim();
    }
    if ((formData.date_of_birth || '') !== (profileData?.date_of_birth || '')) {
      patchPayload.date_of_birth = formData.date_of_birth || null;
    }
    if (formData.profile_picture.trim() !== (profileData?.profile_picture || '')) {
      patchPayload.profile_picture = formData.profile_picture.trim() || null;
    }
    if (formData.bio.trim() !== (profileData?.bio || '')) {
      patchPayload.bio = formData.bio.trim();
    }

    // If nothing changed, inform gently and close
    if (Object.keys(patchPayload).length === 0) {
      setSuccess('No changes to update.');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 700);
      setSaving(false);
      return;
    }

    try {
      const updated = await api.users.updateProfile(patchPayload, { method: 'PATCH' });
      const merged = updated && typeof updated === 'object' && updated.id
        ? updated
        : { ...(profileData || {}), ...patchPayload };

      setProfileData(merged);
      setAdminUser(merged);

      window.dispatchEvent(new CustomEvent('bic_user_updated', { detail: merged }));

      if (onProfileUpdated) {
        onProfileUpdated(merged);
      }

      setSuccess('Profile updated successfully.');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update user profile:', err);
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const previewPicUrl = formData.profile_picture ? getMediaUrl(formData.profile_picture) : null;
  const initials = `${formData.first_name?.[0] || 'U'}${formData.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: '#e8622a' }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Profile Settings</h3>
              <p className="text-xs text-slate-500">
                View your account details and update your personal profile information.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Error: </span>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Profile Overview Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-orange-50/40 border border-slate-200 flex items-center gap-4">
            <div className="relative shrink-0">
              {previewPicUrl ? (
                <img
                  src={previewPicUrl}
                  alt={formData.first_name || 'Profile'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-orange-300 shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base text-white shadow-md"
                style={{
                  backgroundColor: '#e8622a',
                  display: previewPicUrl ? 'none' : 'flex'
                }}
              >
                {initials || 'U'}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">
                {formData.first_name || formData.last_name
                  ? `${formData.first_name} ${formData.last_name}`.trim()
                  : profileData?.email || 'User'}
              </div>
              <div className="text-xs text-slate-500 font-mono truncate" title={profileData?.email}>
                {profileData?.email || ''}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase">
                  Role: {profileData?.role || 'user'}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    profileData?.is_verified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {profileData?.is_verified ? '✓ Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* Read-Only Account Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>System Managed Account Info</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Account Email</span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {profileData?.email || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Groups</span>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(profileData?.groups) && profileData.groups.length > 0 ? (
                    profileData.groups.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700"
                      >
                        {typeof g === 'object' ? g.name || `Group ${g.id}` : `Group ${g}`}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No groups</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* EDITABLE FIELDS FORM */}
          <form id="user-profile-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="pb-1 border-b border-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-[#e8622a]" />
              <span>Personal Information</span>
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. Alish"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. Kandel"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                />
              </div>
            </div>

            {/* Phone Number & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g. +977-9800000000"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
                />
              </div>
            </div>

            {/* Profile Picture URL / Path */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Profile Picture URL / Path</span>
              </label>
              <input
                type="text"
                value={formData.profile_picture}
                onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Biography</span>
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Bio or introduction..."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e8622a] focus:border-transparent outline-hidden transition resize-y"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Only modified details will be updated.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-profile-form"
              disabled={saving || loading}
              className="px-5 py-2 text-white text-xs font-semibold rounded-xl shadow-xs hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: '#e8622a' }}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
