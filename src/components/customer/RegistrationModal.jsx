import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  UserPlus,
  Building2,
  GraduationCap,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import hackathonLogo from '../../assets/HACKATHON-LOGO.png';

function formatTeamRegistrationError(err) {
  if (!err) return 'Failed to register team. Please try again.';

  const rawMessage = typeof err === 'string' ? err : (err.message || '');
  const detail = typeof err.data?.detail === 'string'
    ? err.data.detail
    : (typeof err.detail === 'string' ? err.detail : '');
  const dataString = typeof err.data === 'object' ? JSON.stringify(err.data) : '';
  const combined = `${rawMessage} ${detail} ${dataString}`.toLowerCase();

  // 1. Team lead already registered for this hackathon
  if (
    combined.includes('teams_team_lead_id_hackathon_id') ||
    combined.includes('team_lead_id, hackathon_id') ||
    (combined.includes('team_lead') && combined.includes('already exists'))
  ) {
    return 'You have already registered a team for this hackathon edition. Each participant can only lead one squad.';
  }

  // 2. Team name duplicate for this hackathon
  if (
    combined.includes('teams_name_hackathon_id') ||
    (combined.includes('name') && combined.includes('already exists'))
  ) {
    return 'A squad with this name already exists for this hackathon. Please choose a different team name.';
  }

  // 3. Coordinator phone / email uniqueness
  if (combined.includes('coordinator_email') && combined.includes('already exists')) {
    return 'A team coordinator with this email is already registered for this hackathon.';
  }

  // 4. Any other unique constraint
  if (combined.includes('unique constraint') && combined.includes('already exists')) {
    return 'A team registration with these unique details already exists for this hackathon.';
  }

  // 5. Clean user-friendly message fallback (avoiding "Internal Server Error" or raw SQL)
  if (err.data?.message && typeof err.data.message === 'string' && !err.data.message.toLowerCase().includes('unexpected error') && !err.data.message.toLowerCase().includes('internal server error')) {
    return err.data.message;
  }
  if (rawMessage && !rawMessage.toLowerCase().includes('unexpected error') && !rawMessage.toLowerCase().includes('internal server error') && !rawMessage.toLowerCase().includes('duplicate key')) {
    return rawMessage;
  }

  return 'Unable to register team. You may already have a squad registered for this edition or the squad name is taken.';
}

export default function RegistrationModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { registerTeam, hackathon, currentUser } = useHackathon();

  const minTeamSize = hackathon?.minimum_team_size || 1;
  const maxTeamSize = hackathon?.maximum_team_size || 4;

  const [formData, setFormData] = useState({
    name: '',
    college_name: '',
    affilated_university: '',
    college_address: '',
    college_website: '',
    coordinator_phone: '',
    coordinator_email: '',
    no_of_members: maxTeamSize
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Prefill coordinator information if user is logged in
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setIsSubmitting(false);

      setFormData((prev) => ({
        ...prev,
        coordinator_email: currentUser?.email || prev.coordinator_email || '',
        coordinator_phone: currentUser?.phone_number || prev.coordinator_phone || '',
        no_of_members: prev.no_of_members || maxTeamSize
      }));
    }
  }, [currentUser, isOpen, maxTeamSize]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !formData.name.trim() ||
      !formData.college_name.trim() ||
      !formData.affilated_university.trim() ||
      !formData.college_address.trim() ||
      !formData.coordinator_phone.trim() ||
      !formData.coordinator_email.trim()
    ) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    let collegeWebsite = formData.college_website?.trim() || '';
    if (collegeWebsite && !/^https?:\/\//i.test(collegeWebsite)) {
      collegeWebsite = `https://${collegeWebsite}`;
    }

    const payload = {
      name: formData.name.trim(),
      college_name: formData.college_name.trim(),
      affilated_university: formData.affilated_university.trim(),
      college_address: formData.college_address.trim(),
      college_website: collegeWebsite,
      coordinator_phone: formData.coordinator_phone.trim(),
      coordinator_email: formData.coordinator_email.trim(),
      no_of_members: Number(formData.no_of_members) || minTeamSize
    };

    setIsSubmitting(true);
    try {
      await registerTeam(payload);
      setSuccessMessage(`Team "${payload.name}" has been registered successfully!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Team registration error:', err);
      const friendlyMessage = formatTeamRegistrationError(err);
      setErrorMessage(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
        <div className="p-6 sm:p-8">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2.5">
              <img
                src={hackathonLogo}
                alt="BIC Hackathon"
                className="h-7 w-auto object-contain"
              />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ea580c]">
                Team Enrollment
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Register Team for {hackathon?.title || 'BIC Hackathon'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Team size: {minTeamSize} to {maxTeamSize} members. Submit your team and college details to secure your spot.
            </p>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/90 flex items-start gap-3 text-xs text-red-800 shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-red-900 text-xs mb-0.5">Registration Notice</div>
                <div className="text-red-700 leading-relaxed">{errorMessage}</div>
                {errorMessage.includes('already registered') && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/profile');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 font-bold text-[#ea580c] hover:text-[#c2410c] hover:underline cursor-pointer transition-colors"
                  >
                    <span>View your registered squad in your Profile</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: TEAM & ACADEMIC INSTITUTION */}
            <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ea580c] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Team & Academic Institution
                </span>
                <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded border border-slate-200 bg-white">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. CyberVanguard"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                </div>

                {/* College Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    College / Institution Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Boston International College"
                      value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                </div>

                {/* Affiliated University */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Affiliated University <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pokhara University"
                      value={formData.affilated_university}
                      onChange={(e) => setFormData({ ...formData, affilated_university: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                </div>

                {/* College Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    College Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bharatpur-10, Chitwan, Nepal"
                      value={formData.college_address}
                      onChange={(e) => setFormData({ ...formData, college_address: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                </div>

                {/* College Website */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    College Website <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      placeholder="https://bostoncollege.edu.np"
                      value={formData.college_website}
                      onChange={(e) => setFormData({ ...formData, college_website: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                </div>

                {/* Number of Members */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Number of Members <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      required
                      min={minTeamSize}
                      max={maxTeamSize}
                      value={formData.no_of_members}
                      onChange={(e) => setFormData({ ...formData, no_of_members: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Allowed team size: {minTeamSize} to {maxTeamSize} members
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: COORDINATOR CONTACT DETAILS */}
            <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  2. Team Coordinator & Contact
                </span>
                <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded border border-slate-200 bg-white">
                  Lead Contact
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coordinator Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Coordinator Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="coordinator@college.edu.np"
                      value={formData.coordinator_email}
                      onChange={(e) => setFormData({ ...formData, coordinator_email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                </div>

                {/* Coordinator Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Coordinator Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      placeholder="+977-9800000000"
                      value={formData.coordinator_phone}
                      onChange={(e) => setFormData({ ...formData, coordinator_phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Team...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Team Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
