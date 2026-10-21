import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  Shirt,
  Utensils,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import api from '../../services/api';

const FOOD_PREFERENCES = [
  { value: 'non_vegetarian', label: 'Non-Vegetarian' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'other', label: 'Other' }
];

const SHIRT_SIZES = [
  { value: 'S', label: 'Small (S)' },
  { value: 'M', label: 'Medium (M)' },
  { value: 'L', label: 'Large (L)' },
  { value: 'XL', label: 'Extra Large (XL)' }
];

export default function TeamParticipantsModal({ isOpen, onClose, team, currentUser, onSuccess }) {
  useBodyScrollLock(isOpen);

  const isLocked = team?.status === 'participation_confirmed';
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const maxMembers = team?.no_of_members || 4;

  // Initialize participants data whenever modal opens
  useEffect(() => {
    if (!isOpen || !team) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(false);

    const leaderName =
      `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() ||
      currentUser?.username ||
      '';
    const leaderEmail = currentUser?.email || team?.coordinator_email || '';
    const leaderPhone = currentUser?.phone_number || team?.coordinator_phone || '';

    if (Array.isArray(team.participants) && team.participants.length > 0) {
      // Map existing participants, ensuring the first participant has fallback to leader info if empty
      const existing = team.participants.map((p, idx) => {
        if (idx === 0) {
          return {
            id: p.id,
            name: p.name || leaderName,
            email: p.email || leaderEmail,
            phone_number: p.phone_number || leaderPhone,
            current_grade: p.current_grade || '',
            food_preference: p.food_preference || 'non_vegetarian',
            shirt_size: p.shirt_size || 'M',
            medical_conditions: p.medical_conditions || '',
            emergency_contact: p.emergency_contact || '',
            github_profile: p.github_profile || '',
            linkedin_profile: p.linkedin_profile || '',
            portfolio_website: p.portfolio_website || ''
          };
        }
        return {
          id: p.id,
          name: p.name || '',
          email: p.email || '',
          phone_number: p.phone_number || '',
          current_grade: p.current_grade || '',
          food_preference: p.food_preference || 'non_vegetarian',
          shirt_size: p.shirt_size || 'M',
          medical_conditions: p.medical_conditions || '',
          emergency_contact: p.emergency_contact || '',
          github_profile: p.github_profile || '',
          linkedin_profile: p.linkedin_profile || '',
          portfolio_website: p.portfolio_website || ''
        };
      });
      setParticipants(existing);
    } else {
      // Initial empty list: Automatically add first participant as Team Leader data
      setParticipants([
        {
          name: leaderName,
          email: leaderEmail,
          phone_number: leaderPhone,
          current_grade: '',
          food_preference: 'non_vegetarian',
          shirt_size: 'M',
          medical_conditions: '',
          emergency_contact: '',
          github_profile: '',
          linkedin_profile: '',
          portfolio_website: ''
        }
      ]);
    }
    setActiveTab(0);
  }, [isOpen, team, currentUser]);

  if (!isOpen || !team) return null;

  const handleAddParticipant = () => {
    if (participants.length >= maxMembers) return;
    const newMember = {
      name: '',
      email: '',
      phone_number: '',
      current_grade: '',
      food_preference: 'non_vegetarian',
      shirt_size: 'M',
      medical_conditions: '',
      emergency_contact: '',
      github_profile: '',
      linkedin_profile: '',
      portfolio_website: ''
    };
    setParticipants([...participants, newMember]);
    setActiveTab(participants.length);
  };

  const handleRemoveParticipant = (indexToRemove) => {
    if (indexToRemove === 0) return; // Prevent removing leader
    const updated = participants.filter((_, idx) => idx !== indexToRemove);
    setParticipants(updated);
    if (activeTab >= updated.length) {
      setActiveTab(Math.max(0, updated.length - 1));
    }
  };

  const handleFieldChange = (index, field, value) => {
    setParticipants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMessage('Participation has been confirmed for this squad. Roster is locked and cannot be updated.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');

    if (participants.length === 0) {
      setErrorMessage('At least one participant (Team Leader) must be configured.');
      return;
    }

    // Validate fields
    const emailsSeen = new Set();
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const memberRole = i === 0 ? 'Team Leader' : `Member ${i + 1}`;

      if (!p.name?.trim()) {
        setErrorMessage(`Please provide the full name for ${memberRole}.`);
        setActiveTab(i);
        return;
      }

      if (!p.email?.trim()) {
        setErrorMessage(`Please provide a valid email address for ${memberRole}.`);
        setActiveTab(i);
        return;
      }

      const emailLower = p.email.trim().toLowerCase();
      if (emailsSeen.has(emailLower)) {
        setErrorMessage(`Duplicate email address "${emailLower}" detected. Each participant must have a unique email.`);
        setActiveTab(i);
        return;
      }
      emailsSeen.add(emailLower);
    }

    const cleanedParticipants = participants.map((p) => {
      const item = {
        name: p.name.trim(),
        email: p.email.trim(),
        phone_number: p.phone_number?.trim() || null,
        current_grade: p.current_grade?.trim() || null,
        food_preference: p.food_preference || 'non_vegetarian',
        shirt_size: p.shirt_size || 'M',
        medical_conditions: p.medical_conditions?.trim() || null,
        emergency_contact: p.emergency_contact?.trim() || null,
        github_profile: p.github_profile?.trim() || null,
        linkedin_profile: p.linkedin_profile?.trim() || null,
        portfolio_website: p.portfolio_website?.trim() || null
      };
      if (p.id) {
        item.id = p.id;
      }
      return item;
    });

    setIsSubmitting(true);
    try {
      const updated = await api.hackathons.teams.patch(team.id, {
        participants: cleanedParticipants
      });

      setSuccessMessage('Squad participants data updated successfully!');
      if (onSuccess) {
        onSuccess(updated);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update team participants:', err);
      const detail = err?.data?.detail || err?.data?.message || err?.message || 'Failed to update participants.';
      setErrorMessage(typeof detail === 'object' ? JSON.stringify(detail) : String(detail));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentParticipant = participants[activeTab] || participants[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl relative max-h-[92vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl p-5 sm:p-8 flex flex-col justify-between">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] font-bold border border-orange-200/80">
              Team Roster
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Squad: <strong className="text-slate-700">{team.name}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {isLocked ? 'Squad Participants Roster' : 'Manage Squad Participants'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isLocked
              ? 'View participant details, merchandise sizes, and contact profiles for your confirmed squad.'
              : 'Update personal information, t-shirt sizes, dietary preferences, and portfolios for your squad members.'}
          </p>

          {/* Locked Notice when participation_confirmed */}
          {isLocked && (
            <div className="mt-4 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold block">Participation Confirmed (Locked)</span>
                <span className="text-[11px] text-blue-700 block mt-0.5">
                  This squad's participation has been officially confirmed. The roster and participant profiles are now finalized and cannot be modified.
                </span>
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Member Tabs / Selector */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
            {participants.map((p, idx) => {
              const isLeader = idx === 0;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-[#ea580c] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>
                    {isLeader ? 'Leader (You)' : `Member ${idx + 1}`}
                    {p.name ? `: ${p.name.split(' ')[0]}` : ''}
                  </span>
                </button>
              );
            })}

            {!isLocked && participants.length < maxMembers && (
              <button
                type="button"
                onClick={handleAddParticipant}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ea580c] bg-orange-50 hover:bg-orange-100 border border-dashed border-orange-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member ({participants.length}/{maxMembers})</span>
              </button>
            )}
          </div>

          {/* Form for current active participant */}
          {currentParticipant && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-xs">
                    {activeTab + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {activeTab === 0 ? 'Team Leader / Primary Contact' : `Squad Member ${activeTab + 1}`}
                      </span>
                      {activeTab === 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          First Participant
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {activeTab === 0
                        ? 'Automatically populated with your lead coordinator profile'
                        : 'Provide teammate credentials and preferences'}
                    </span>
                  </div>
                </div>

                {!isLocked && activeTab > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(activeTab)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer"
                    title="Remove this member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. Alex Morgan"
                    value={currentParticipant.name}
                    onChange={(e) => handleFieldChange(activeTab, 'name', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20 ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isLocked}
                    placeholder="alex@example.com"
                    value={currentParticipant.email}
                    onChange={(e) => handleFieldChange(activeTab, 'email', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20 ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    disabled={isLocked}
                    placeholder="+977 9800000000"
                    value={currentParticipant.phone_number || ''}
                    onChange={(e) => handleFieldChange(activeTab, 'phone_number', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20 ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* Current Grade / Academic Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Grade / Semester
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="e.g. 6th Semester / Bachelor Year 3"
                    value={currentParticipant.current_grade || ''}
                    onChange={(e) => handleFieldChange(activeTab, 'current_grade', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]/20 ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* T-Shirt Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    T-Shirt Size
                  </label>
                  <select
                    disabled={isLocked}
                    value={currentParticipant.shirt_size || 'M'}
                    onChange={(e) => handleFieldChange(activeTab, 'shirt_size', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c] ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-800'
                    }`}
                  >
                    {SHIRT_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Food Preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Food Preference
                  </label>
                  <select
                    disabled={isLocked}
                    value={currentParticipant.food_preference || 'non_vegetarian'}
                    onChange={(e) => handleFieldChange(activeTab, 'food_preference', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#ea580c] ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-800'
                    }`}
                  >
                    {FOOD_PREFERENCES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact Name & Phone
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="Parent / Guardian (+977...)"
                    value={currentParticipant.emergency_contact || ''}
                    onChange={(e) => handleFieldChange(activeTab, 'emergency_contact', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medical Needs or Allergies
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="e.g. Peanut allergy, Asthma (None if N/A)"
                    value={currentParticipant.medical_conditions || ''}
                    onChange={(e) => handleFieldChange(activeTab, 'medical_conditions', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* GitHub Profile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    placeholder="https://github.com/username"
                    value={currentParticipant.github_profile || ''}
                    onChange={(e) => handleFieldChange(activeTab, 'github_profile', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* LinkedIn Profile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    placeholder="https://linkedin.com/in/username"
                    value={currentParticipant.linkedin_profile || ''}
                    onChange={(e) => handleFieldChange(activeTab, 'linkedin_profile', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>

                {/* Portfolio / Website */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Portfolio or Personal Website URL
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    placeholder="https://myportfolio.dev"
                    value={currentParticipant.portfolio_website || ''}
                    onChange={(e) => handleFieldChange(activeTab, 'portfolio_website', e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400 focus:outline-none focus:border-[#ea580c] ${
                      isLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-mono">
            {participants.length} of {maxMembers} participants configured
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isLocked ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
              >
                Close Roster
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-orange-600 shadow-md shadow-orange-500/20 active:scale-[0.99] transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Participants...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Participants Roster</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
