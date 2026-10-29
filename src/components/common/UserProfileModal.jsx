import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import { api, getMediaUrl, getUserAvatarUrl, DEFAULT_USER_AVATAR, getAdminUser, setAdminUser } from '../../services/api';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalPortal from './ModalPortal';

export default function UserProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial user record from cache or GET /api/v1/users/profile/
  const [profileData, setProfileData] = useState(null);

  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isRemoved, setIsRemoved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Editable fields strictly restricted to personal profile:
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    bio: ''
  });

  // Fetch profile if not already cached
  const fetchProfile = async () => {
    setImageFile(null);
    setIsRemoved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const cached = getAdminUser();
    if (cached) {
      setProfileData(cached);
      setFormData({
        first_name: cached.first_name || '',
        last_name: cached.last_name || '',
        phone_number: cached.phone_number || '',
        date_of_birth: cached.date_of_birth || '',
        bio: cached.bio || ''
      });
      setImagePreview(cached.profile_picture ? getMediaUrl(cached.profile_picture) : '');
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
          bio: data.bio || ''
        });
        setImagePreview(data.profile_picture ? getMediaUrl(data.profile_picture) : '');
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

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds the 5MB size limit.');
      return;
    }

    setError('');
    setImageFile(file);
    setIsRemoved(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setIsRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    if (formData.bio.trim() !== (profileData?.bio || '')) {
      patchPayload.bio = formData.bio.trim();
    }

    const hasImageChange = imageFile !== null || (isRemoved && Boolean(profileData?.profile_picture));

    // If nothing changed, inform gently and close
    if (Object.keys(patchPayload).length === 0 && !hasImageChange) {
      setSuccess('No changes to update.');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 700);
      setSaving(false);
      return;
    }

    // Build payload: FormData if a file is attached, or json diff
    let requestBody;
    if (imageFile) {
      const fd = new FormData();
      Object.entries(patchPayload).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          fd.append(key, val);
        }
      });
      fd.append('profile_picture', imageFile);
      requestBody = fd;
    } else if (isRemoved) {
      requestBody = { ...patchPayload, profile_picture: null };
    } else {
      requestBody = patchPayload;
    }

    try {
      const updated = await api.users.updateProfile(requestBody, { method: 'PATCH' });
      const merged = updated && typeof updated === 'object' && updated.id
        ? updated
        : {
            ...(profileData || {}),
            ...patchPayload,
            profile_picture: imagePreview || (isRemoved ? null : profileData?.profile_picture)
          };

      // Preserve local preview if server returns null
      if (!merged.profile_picture && imagePreview) {
        merged.profile_picture = imagePreview;
      }

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

  const initials = `${formData.first_name?.[0] || 'U'}${formData.last_name?.[0] || ''}`.toUpperCase();

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: '#e8622a' }}
            >
              <User className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Personal Profile Settings</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                View your account details and update your personal profile information.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
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
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative shrink-0 cursor-pointer group"
              title="Click to change photo"
            >
              <img
                src={imagePreview || DEFAULT_USER_AVATAR}
                alt={formData.first_name || 'Profile'}
                className="w-14 h-14 rounded-full object-cover border-2 border-orange-300 shadow-md group-hover:brightness-95 transition bg-white"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_USER_AVATAR;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 group-hover:text-[#e8622a] transition">
                <Camera className="w-3 h-3" />
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
              <User className="w-3.5 h-3.5 text-[#e8622a]" />
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

            {/* Profile Picture Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile Picture</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">PNG, JPG, WEBP (Max 5MB)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className={`p-3.5 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center gap-3.5 ${
                  isDragging
                    ? 'border-[#e8622a] bg-orange-50/70'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                }`}
              >
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Avatar preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-orange-400 shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base text-white shadow-sm"
                      style={{ backgroundColor: '#e8622a' }}
                    >
                      {initials || 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change image"
                    className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-4 h-4 drop-shadow" />
                  </button>
                </div>

                {/* Upload Buttons & Info */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#e8622a]" />
                      <span>{imagePreview ? 'Change Image' : 'Upload Image'}</span>
                    </button>

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 truncate">
                    {imageFile ? (
                      <span className="font-medium text-emerald-600">
                        Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                      </span>
                    ) : (
                      'Drag and drop an image file here, or click to browse.'
                    )}
                  </p>
                </div>
              </div>
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
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] sm:text-xs text-slate-400 text-center sm:text-left">
            Only modified details will be updated.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
      </div>
    </ModalPortal>
  );
}
