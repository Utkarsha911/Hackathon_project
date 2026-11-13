import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  User,
  UserPlus,
  Plus,
  Trash2,
  Utensils,
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Clock,
  Shirt,
  Ban,
  XCircle,
  ExternalLink,
  QrCode,
  Eye,
  Edit3
} from 'lucide-react';
import HackathonBrand from '../common/HackathonBrand';
import Footer from '../common/Footer';
import Toast from '../common/Toast';
import ModalPortal from '../common/ModalPortal';
import CustomerNavbar from './CustomerNavbar';
import UserAuthModal from './UserAuthModal';
import RegistrationCountdownPage from './RegistrationCountdownPage';
import TeamParticipantsModal from './TeamParticipantsModal';
import { generateQrDataUrl } from '../../utils/qrUtils';
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

// Scannable QR & Payment Link Card for Team Leader
function TeamPaymentCard({ team, isApproved, isParticipationConfirmed }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (team?.payment_link) {
      generateQrDataUrl(team.payment_link, { width: 240, margin: 2 }).then((url) => {
        if (active) setQrCodeUrl(url);
      });
    } else {
      setQrCodeUrl('');
    }
    return () => {
      active = false;
    };
  }, [team?.payment_link]);

  if (isParticipationConfirmed) {
    return null;
  }

  if (isApproved) {
    if (team?.payment_link) {
      return (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white border border-orange-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {qrCodeUrl ? (
              <div className="p-2.5 rounded-2xl bg-white border border-orange-200 shadow-sm shrink-0 text-center">
                <img
                  src={qrCodeUrl}
                  alt="Participation Fee Payment QR"
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-contain mx-auto"
                />
                <span className="text-[10px] font-mono font-bold text-slate-500 mt-1 block">
                  Scan to Pay
                </span>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                <QrCode className="w-8 h-8 text-[#ea580c]" />
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-[#ea580c] border border-orange-200 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Squad Approved — Fee Payment Required</span>
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                Pay Participation Fee
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Your squad is approved! Scan this QR code with eSewa, Khalti, or mobile banking, or click below to proceed to the payment link to confirm participation.
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <a
                  href={team.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-orange hover:bg-orange-600 shadow-xs transition cursor-pointer"
                >
                  <span>Proceed to Payment Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h5 className="font-bold text-amber-900 text-xs">Squad Approved — Payment Link Pending</h5>
          <p className="text-[11px] text-amber-700 mt-0.5">
            The organizing committee will publish your participation payment link and QR code here shortly.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

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

export default function RegisterTeamPage() {
  const navigate = useNavigate();
  const { registerTeam, hackathon, currentUser, terms, isRegistrationOpen, registrationStatus } = useHackathon();

  const minTeamSize = hackathon?.minimum_team_size || 1;
  const maxTeamSize = hackathon?.maximum_team_size || 4;
  const isTshirtIncluded = Boolean(
    hackathon?.is_tshirt_included ??
    hackathon?.is_t_shirt_included ??
    hackathon?.tshirt_included ??
    false
  );

  const [showTermsModal, setShowTermsModal] = useState(false);
  // Logged-in users come from their profile, so "back" goes there; visitors go home
  const backTo = currentUser ? '/profile' : '/';
  const backLabel = currentUser ? 'Back to profile' : 'Back to home';
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('register');

  const [formData, setFormData] = useState({
    name: '',
    college_name: '',
    affilated_university: '',
    college_address: '',
    college_website: '',
    coordinator_phone: '',
    coordinator_email: '',
    tshirt_size: 'M',
    no_of_members: maxTeamSize
  });

  // Squad participants configured directly in the registration form
  const [participants, setParticipants] = useState([
    {
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
    }
  ]);
  const [activeParticipantIndex, setActiveParticipantIndex] = useState(0);

  const maxAllowedParticipants = Math.max(1, Number(formData.no_of_members) || maxTeamSize);
  const currentParticipant = participants[activeParticipantIndex] || participants[0];

  const [currentStep, setCurrentStep] = useState(1);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Existing squad state for the logged-in user
  const [existingTeam, setExistingTeam] = useState(null);
  const [isLoadingExistingTeam, setIsLoadingExistingTeam] = useState(Boolean(currentUser));
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const fetchExistingTeam = async () => {
    if (!currentUser) {
      setExistingTeam(null);
      setIsLoadingExistingTeam(false);
      return;
    }
    setIsLoadingExistingTeam(true);
    try {
      const res = await api.hackathons.teams.getAll({}, { forceRefresh: true });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res?.data)
            ? res.data
            : [];
      const currentHackathonId = hackathon?.id;
      const found = list.find((t) => (t.hackathon === currentHackathonId || t.hackathon_id === currentHackathonId)) || list[0] || null;
      setExistingTeam(found);
    } catch (err) {
      console.warn('Failed to load existing team on register page:', err);
      setExistingTeam(null);
    } finally {
      setIsLoadingExistingTeam(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchExistingTeam();
    } else {
      setExistingTeam(null);
      setIsLoadingExistingTeam(false);
    }
  }, [currentUser, hackathon?.id]);

  // Prefill coordinator information & Participant 1 (Team Leader) if user is logged in
  useEffect(() => {
    const leaderName =
      `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() ||
      currentUser?.username ||
      '';
    const leaderEmail = currentUser?.email || '';
    const leaderPhone = currentUser?.phone_number || '';

    setFormData((prev) => ({
      ...prev,
      coordinator_email: currentUser?.email || prev.coordinator_email || '',
      coordinator_phone: currentUser?.phone_number || prev.coordinator_phone || '',
      no_of_members: prev.no_of_members || maxTeamSize
    }));

    if (currentUser) {
      setParticipants((prev) => {
        if (!prev || prev.length === 0) {
          return [
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
          ];
        }
        const first = prev[0];
        const updatedFirst = {
          ...first,
          name: first.name || leaderName,
          email: first.email || leaderEmail,
          phone_number: first.phone_number || leaderPhone
        };
        return [updatedFirst, ...prev.slice(1)];
      });
    }
  }, [currentUser, maxTeamSize]);

  // Handlers for participant enrollment in this form
  const handleAddParticipant = () => {
    if (participants.length >= maxAllowedParticipants) {
      setErrorMessage(`Maximum squad size for this registration is ${maxAllowedParticipants}. Increase the "Number of Members" field in Section 1 to add more teammates.`);
      return;
    }
    setErrorMessage('');
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
    const nextList = [...participants, newMember];
    setParticipants(nextList);
    setActiveParticipantIndex(nextList.length - 1);
  };

  const handleRemoveParticipant = (indexToRemove) => {
    if (indexToRemove === 0) return; // Cannot remove Team Leader
    const nextList = participants.filter((_, idx) => idx !== indexToRemove);
    setParticipants(nextList);
    setActiveParticipantIndex((prev) => {
      if (prev >= nextList.length) return nextList.length - 1;
      if (prev === indexToRemove) return Math.max(0, indexToRemove - 1);
      return prev;
    });
  };

  const handleParticipantChange = (index, field, value) => {
    setParticipants((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  // Step 1 -> Step 2 validation & transition
  const handleNextFromStep1 = () => {
    setErrorMessage('');
    if (!formData.name.trim()) {
      setErrorMessage('Please enter your Team Name.');
      return;
    }
    if (!formData.college_name.trim()) {
      setErrorMessage('Please enter your College or Institution Name.');
      return;
    }
    if (!formData.affilated_university.trim()) {
      setErrorMessage('Please enter your Affiliated University.');
      return;
    }
    if (!formData.college_address.trim()) {
      setErrorMessage('Please enter your College Address.');
      return;
    }
    const membersNum = Number(formData.no_of_members);
    if (!membersNum || membersNum < minTeamSize || membersNum > maxTeamSize) {
      setErrorMessage(`Number of members must be between ${minTeamSize} and ${maxTeamSize}.`);
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 160, behavior: 'smooth' });
  };

  // Step 2 -> Step 3 validation & transition
  const handleNextFromStep2 = () => {
    setErrorMessage('');
    if (!formData.coordinator_email.trim()) {
      setErrorMessage('Please provide a valid Coordinator Email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.coordinator_email.trim())) {
      setErrorMessage('Please enter a valid email format for the team coordinator.');
      return;
    }
    if (!formData.coordinator_phone.trim()) {
      setErrorMessage('Please provide the Coordinator Phone number.');
      return;
    }

    // Synchronize Coordinator info to Participant 1 (Team Leader)
    setParticipants((prev) => {
      if (!prev || prev.length === 0) return prev;
      const first = prev[0];
      const updatedFirst = {
        ...first,
        name: first.name || `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username || 'Team Leader',
        email: first.email || formData.coordinator_email.trim(),
        phone_number: first.phone_number || formData.coordinator_phone.trim(),
        shirt_size: first.shirt_size || formData.tshirt_size || 'M'
      };
      return [updatedFirst, ...prev.slice(1)];
    });

    setCurrentStep(3);
    window.scrollTo({ top: 160, behavior: 'smooth' });
  };

  // Registering needs a Google login: ask for it as soon as the page opens (only if registration is active)
  useEffect(() => {
    if (!currentUser && isRegistrationOpen) {
      setAuthReason('register');
      setIsAuthOpen(true);
    }
  }, [currentUser, isRegistrationOpen]);

  // Only the terms viewer is still a modal
  useBodyScrollLock(showTermsModal);

  // If registration dates are not currently active, display the countdown / days left page
  if (!isRegistrationOpen) {
    return <RegistrationCountdownPage />;
  }

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
      setErrorMessage('Please fill in all required fields in the team and coordinator sections.');
      return;
    }

    if (!hasAgreedToTerms) {
      setErrorMessage('You must read and agree to the Participation Terms & Code of Conduct before submitting your registration.');
      return;
    }

    if (participants.length === 0) {
      setErrorMessage('At least one squad participant (Team Leader) must be configured in Section 3.');
      return;
    }

    // Validate participants roster
    const emailsSeen = new Set();
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const memberRole = i === 0 ? 'Team Leader (Participant 1)' : `Squad Member ${i + 1}`;

      const pName = p.name?.trim() || (i === 0 ? (`${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username) : '');
      if (!pName) {
        setErrorMessage(`Please provide the full name for ${memberRole} in the participants roster.`);
        setActiveParticipantIndex(i);
        return;
      }

      const pEmail = p.email?.trim() || (i === 0 ? formData.coordinator_email.trim() : '');
      if (!pEmail) {
        setErrorMessage(`Please provide a valid email address for ${memberRole} in the participants roster.`);
        setActiveParticipantIndex(i);
        return;
      }

      const emailLower = pEmail.toLowerCase();
      if (emailsSeen.has(emailLower)) {
        setErrorMessage(`Duplicate email "${emailLower}" detected. Each squad participant must have a unique email address.`);
        setActiveParticipantIndex(i);
        return;
      }
      emailsSeen.add(emailLower);
    }

    let collegeWebsite = formData.college_website?.trim() || '';
    if (collegeWebsite && !/^https?:\/\//i.test(collegeWebsite)) {
      collegeWebsite = `https://${collegeWebsite}`;
    }

    const cleanedParticipants = participants.map((p, idx) => {
      const pName = p.name?.trim() || (idx === 0 ? (`${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username || 'Team Leader') : '');
      const pEmail = p.email?.trim() || (idx === 0 ? formData.coordinator_email.trim() : '');
      const pPhone = p.phone_number?.trim() || (idx === 0 ? formData.coordinator_phone.trim() : null);

      return {
        name: pName,
        email: pEmail,
        phone_number: pPhone || null,
        current_grade: p.current_grade?.trim() || null,
        food_preference: p.food_preference || 'non_vegetarian',
        shirt_size: isTshirtIncluded ? (p.shirt_size || formData.tshirt_size || 'M') : null,
        tshirt_size: isTshirtIncluded ? (p.shirt_size || formData.tshirt_size || 'M') : null,
        medical_conditions: p.medical_conditions?.trim() || null,
        emergency_contact: p.emergency_contact?.trim() || null,
        github_profile: p.github_profile?.trim() || null,
        linkedin_profile: p.linkedin_profile?.trim() || null,
        portfolio_website: p.portfolio_website?.trim() || null
      };
    });

    const payload = {
      name: formData.name.trim(),
      college_name: formData.college_name.trim(),
      affilated_university: formData.affilated_university.trim(),
      college_address: formData.college_address.trim(),
      college_website: collegeWebsite,
      coordinator_phone: formData.coordinator_phone.trim(),
      coordinator_email: formData.coordinator_email.trim(),
      no_of_members: Number(formData.no_of_members) || minTeamSize,
      has_agreed_to_terms: Boolean(hasAgreedToTerms),
      participants: cleanedParticipants
    };

    if (isTshirtIncluded && formData.tshirt_size) {
      payload.tshirt_size = formData.tshirt_size;
    }

    setIsSubmitting(true);
    try {
      const createdTeam = await registerTeam(payload);
      setSuccessMessage(`Team "${payload.name}" and participant roster registered successfully!`);
      // Update state to render the squad overview directly with the enrolled roster
      setExistingTeam(createdTeam || { ...payload, id: `team-${Date.now()}`, status: 'submitted' });
      fetchExistingTeam();
    } catch (err) {
      console.error('Team registration error:', err);
      const friendlyMessage = formatTeamRegistrationError(err);
      setErrorMessage(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="theme-brand min-h-screen flex flex-col bg-brand-tint text-ink">
      <CustomerNavbar
        onOpenRegister={() => navigate('/register')}
        onOpenLogin={() => { setAuthReason('login'); setIsAuthOpen(true); }}
        onOpenProfile={() => navigate('/profile')}
      />

      <main className="flex-grow py-8 sm:py-12 px-4">
        <div className="w-full max-w-3xl mx-auto">
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-navy mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,31,92,0.12)]">
            <div className="p-6 sm:p-10">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2.5">
                  <HackathonBrand
                    imageClassName="h-7 w-auto max-w-[140px] object-contain"
                    textClassName="text-xs font-bold text-slate-800"
                    showSubText={false}
                    iconSizeClass="w-6 h-6 text-[10px]"
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-blue">
                    Team Enrollment
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-ink">
                  {existingTeam ? existingTeam.name : `Register Team for ${hackathon?.title || 'BIC Hackathon'}`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                  {existingTeam
                    ? `Squad enrolled for ${hackathon?.title || 'BIC Hackathon'}. You can add and manage participants directly below.`
                    : currentStep === 1
                      ? `Step 1 of 3: Enter your team name and college institution details.`
                      : currentStep === 2
                        ? `Step 2 of 3: Provide coordinator contact information.`
                        : `Step 3 of 3: Add participants and agree to hackathon terms.`}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-brand-orange">
                  <span>Registration fee:</span>
                  <span>
                    {Number(hackathon?.registration_fee) > 0
                      ? `NPR ${Number(hackathon.registration_fee).toLocaleString()} per team`
                      : 'Free'}
                  </span>
                </div>
              </div>

              {!currentUser ? (
                <div className="text-center py-10">
                  <p className="text-slate-600">Sign in with Google to register your team and manage participants.</p>
                  <button
                    type="button"
                    onClick={() => { setAuthReason('register'); setIsAuthOpen(true); }}
                    className="btn-primary mt-4 justify-center"
                  >
                    Sign in
                  </button>
                </div>
              ) : isLoadingExistingTeam ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ea580c] mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-500">Checking your squad registration...</p>
                </div>
              ) : existingTeam ? (
                <div className="space-y-6">
                  {/* Alert Messages */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200/90 flex items-start gap-3 text-xs text-red-800 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-red-900 text-xs mb-0.5">Notice</div>
                        <div className="text-red-700 leading-relaxed">{errorMessage}</div>
                      </div>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-semibold">{successMessage}</div>
                    </div>
                  )}

                  {/* Registered Squad Overview Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-tint text-brand-blue font-bold border border-brand-blue/30">
                            {hackathon?.title || 'BIC Hackathon'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {String(existingTeam.id).slice(0, 8)}...
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-ink">{existingTeam.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {existingTeam.college_name} &bull; {existingTeam.affilated_university}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {existingTeam.status === 'participation_confirmed' ? null : existingTeam.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        ) : existingTeam.status === 'disqualified' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            <span>Disqualified</span>
                          </span>
                        ) : existingTeam.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Submitted &mdash; In Review</span>
                          </span>
                        )}
                      </div>
                    </div>



                    {/* Payment Link Card if approved */}
                    <TeamPaymentCard
                      team={existingTeam}
                      isApproved={existingTeam.status === 'approved'}
                      isParticipationConfirmed={existingTeam.status === 'participation_confirmed'}
                    />

                    {/* Participants Roster Section */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-600" />
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            Participants Roster
                          </h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {existingTeam.participants?.length || 0} / {existingTeam.no_of_members || maxTeamSize} Enrolled
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsParticipantsOpen(true)}
                          className="text-xs font-semibold text-brand-blue hover:text-brand-navy hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{existingTeam.participants?.length > 0 ? 'Edit Roster' : 'Enroll Teammates'}</span>
                        </button>
                      </div>

                      {existingTeam.participants && existingTeam.participants.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {existingTeam.participants.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2 text-xs"
                            >
                              <div className="flex items-start gap-2.5 truncate">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                    idx === 0 ? 'bg-brand-orange text-white' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {idx + 1}
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 truncate">{p.name}</span>
                                    {idx === 0 && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-tint text-brand-blue font-bold">
                                        Leader
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-mono truncate block">{p.email}</span>
                                  {p.phone_number && (
                                    <span className="text-[11px] text-slate-400 font-mono block">{p.phone_number}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] font-medium text-slate-500">
                                {isTshirtIncluded && p.shirt_size && (
                                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">
                                    Size: {p.shirt_size}
                                  </span>
                                )}
                                {p.food_preference && (
                                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 capitalize">
                                    {p.food_preference.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <h5 className="text-xs font-bold text-slate-700">No Participants Registered Yet</h5>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                            Direct enrollment is enabled! You can add yourself and your squad teammates right now without waiting for any admin approval.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsParticipantsOpen(true)}
                            className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-orange hover:bg-orange-600 shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Participants Now</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Squad Details Summary */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Coordinator Phone</span>
                        <span className="font-semibold text-slate-800">{existingTeam.coordinator_phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Coordinator Email</span>
                        <span className="font-semibold text-slate-800 truncate block">{existingTeam.coordinator_email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Campus Address</span>
                        <span className="font-semibold text-slate-800 truncate block">{existingTeam.college_address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Alert Messages */}
                  {errorMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/90 flex items-start gap-3 text-xs text-red-800 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-red-900 text-xs mb-0.5">Registration Notice</div>
                        <div className="text-red-700 leading-relaxed">{errorMessage}</div>
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
                    {/* Stepper Navigation Tracker */}
                    <div className="mb-6 pb-4 border-b border-slate-100">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {/* Step 1 Pill */}
                        <button
                          type="button"
                          onClick={() => {
                            if (currentStep > 1) {
                              setErrorMessage('');
                              setCurrentStep(1);
                            }
                          }}
                          className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-left transition ${
                            currentStep === 1
                              ? 'bg-orange-50/80 border-[#ea580c] shadow-xs'
                              : currentStep > 1
                                ? 'bg-emerald-50/60 border-emerald-200 cursor-pointer hover:bg-emerald-100/50'
                                : 'bg-slate-50/50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              currentStep === 1
                                ? 'bg-[#ea580c] text-white shadow-xs'
                                : currentStep > 1
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {currentStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] font-mono text-slate-400 block uppercase leading-none">Step 1</span>
                            <span className={`text-xs font-bold truncate block mt-0.5 ${currentStep === 1 ? 'text-[#ea580c]' : currentStep > 1 ? 'text-emerald-900' : 'text-slate-600'}`}>
                              Team & College
                            </span>
                          </div>
                        </button>

                        {/* Step 2 Pill */}
                        <button
                          type="button"
                          onClick={() => {
                            if (currentStep > 2) {
                              setErrorMessage('');
                              setCurrentStep(2);
                            } else if (currentStep === 1) {
                              handleNextFromStep1();
                            }
                          }}
                          className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-left transition ${
                            currentStep === 2
                              ? 'bg-orange-50/80 border-[#ea580c] shadow-xs'
                              : currentStep > 2
                                ? 'bg-emerald-50/60 border-emerald-200 cursor-pointer hover:bg-emerald-100/50'
                                : 'bg-slate-50/50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              currentStep === 2
                                ? 'bg-[#ea580c] text-white shadow-xs'
                                : currentStep > 2
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {currentStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] font-mono text-slate-400 block uppercase leading-none">Step 2</span>
                            <span className={`text-xs font-bold truncate block mt-0.5 ${currentStep === 2 ? 'text-[#ea580c]' : currentStep > 2 ? 'text-emerald-900' : 'text-slate-600'}`}>
                              Coordinator
                            </span>
                          </div>
                        </button>

                        {/* Step 3 Pill */}
                        <button
                          type="button"
                          onClick={() => {
                            if (currentStep === 2) {
                              handleNextFromStep2();
                            }
                          }}
                          className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-left transition ${
                            currentStep === 3
                              ? 'bg-orange-50/80 border-[#ea580c] shadow-xs'
                              : 'bg-slate-50/50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              currentStep === 3
                                ? 'bg-[#ea580c] text-white shadow-xs'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            3
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] font-mono text-slate-400 block uppercase leading-none">Step 3</span>
                            <span className={`text-xs font-bold truncate block mt-0.5 ${currentStep === 3 ? 'text-[#ea580c]' : 'text-slate-600'}`}>
                              Participants
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* STEP 1: TEAM & ACADEMIC INSTITUTION */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                Allowed team size: {minTeamSize} to {maxTeamSize} members
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Step 1 Actions */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => navigate(backTo)}
                            className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleNextFromStep1}
                            className="py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-brand-orange hover:brightness-110 shadow-md shadow-brand-orange/20 transition-all flex items-center gap-2 cursor-pointer ml-auto"
                          >
                            <span>Next: Team Coordinator</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: COORDINATOR CONTACT DETAILS */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
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
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                />
                              </div>
                            </div>

                            {/* Coordinator T-Shirt Size */}
                            {isTshirtIncluded && (
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                  Coordinator T-Shirt Size <span className="text-red-500">*</span>
                                  <span className="text-slate-400 text-[11px] font-normal ml-1.5">(Complimentary official hackathon swag included)</span>
                                </label>
                                <div className="relative">
                                  <Shirt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  <select
                                    value={formData.tshirt_size || 'M'}
                                    onChange={(e) => setFormData({ ...formData, tshirt_size: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                  >
                                    <option value="S">Small (S)</option>
                                    <option value="M">Medium (M)</option>
                                    <option value="L">Large (L)</option>
                                    <option value="XL">Extra Large (XL)</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Step 2 Actions */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              setCurrentStep(1);
                              window.scrollTo({ top: 160, behavior: 'smooth' });
                            }}
                            className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Team Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleNextFromStep2}
                            className="py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-brand-orange hover:brightness-110 shadow-md shadow-brand-orange/20 transition-all flex items-center gap-2 cursor-pointer ml-auto"
                          >
                            <span>Next: Squad Participants</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: SQUAD PARTICIPANTS & ROSTER */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-3 gap-2">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                3. Squad Participants & Roster
                              </span>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Configure squad members and individual preferences for this hackathon.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                                {participants.length} / {maxAllowedParticipants} Members
                              </span>
                            </div>
                          </div>

                          {/* Participant Selector Tabs */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
                            {participants.map((p, idx) => {
                              const isLeader = idx === 0;
                              const isActive = activeParticipantIndex === idx;
                              const isComplete = Boolean(p.name?.trim() && p.email?.trim());
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setActiveParticipantIndex(idx)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                                    isActive
                                      ? 'bg-[#ea580c] text-white shadow-xs'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {isComplete ? (
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                                  ) : (
                                    <User className="w-3.5 h-3.5" />
                                  )}
                                  <span>
                                    {isLeader ? 'Leader (You)' : `Member ${idx + 1}`}
                                    {p.name ? `: ${p.name.split(' ')[0]}` : ''}
                                  </span>
                                </button>
                              );
                            })}

                            {participants.length < maxAllowedParticipants && (
                              <button
                                type="button"
                                onClick={handleAddParticipant}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ea580c] bg-orange-50 hover:bg-orange-100 border border-dashed border-orange-300 transition cursor-pointer shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Member ({participants.length}/{maxAllowedParticipants})</span>
                              </button>
                            )}
                          </div>

                          {/* Active Participant Form Card */}
                          {currentParticipant && (
                            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                              {/* Participant Sub-Header */}
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] font-bold text-xs flex items-center justify-center border border-orange-100">
                                    {activeParticipantIndex + 1}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-xs font-bold text-slate-900">
                                        {activeParticipantIndex === 0 ? 'Team Leader / Primary Contact' : `Squad Member ${activeParticipantIndex + 1}`}
                                      </h5>
                                      {activeParticipantIndex === 0 && (
                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-brand-tint text-brand-blue border border-brand-blue/30">
                                          Lead Coordinator
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {activeParticipantIndex === 0
                                        ? 'Primary squad contact, pre-filled with your profile'
                                        : 'Enter teammate profile details and swag sizes'}
                                    </p>
                                  </div>
                                </div>

                                {activeParticipantIndex > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParticipant(activeParticipantIndex)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                                    title="Remove member"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Full Name */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Alex Morgan"
                                      value={currentParticipant.name}
                                      onChange={(e) => handleParticipantChange(activeParticipantIndex, 'name', e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                    />
                                  </div>
                                </div>

                                {/* Email Address */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                      type="email"
                                      required
                                      placeholder="alex@example.com"
                                      value={currentParticipant.email}
                                      onChange={(e) => handleParticipantChange(activeParticipantIndex, 'email', e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                    />
                                  </div>
                                </div>

                                {/* Phone Number */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Phone Number <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                                  </label>
                                  <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                      type="tel"
                                      placeholder="+977-9800000000"
                                      value={currentParticipant.phone_number || ''}
                                      onChange={(e) => handleParticipantChange(activeParticipantIndex, 'phone_number', e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                    />
                                  </div>
                                </div>

                                {/* Current Grade / Semester */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Current Grade / Semester <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                                  </label>
                                  <div className="relative">
                                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                      type="text"
                                      placeholder="e.g. 6th Semester / Year 3"
                                      value={currentParticipant.current_grade || ''}
                                      onChange={(e) => handleParticipantChange(activeParticipantIndex, 'current_grade', e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                    />
                                  </div>
                                </div>

                                {/* Food Preference */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Food Preference
                                  </label>
                                  <div className="relative">
                                    <Utensils className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <select
                                      value={currentParticipant.food_preference || 'non_vegetarian'}
                                      onChange={(e) => handleParticipantChange(activeParticipantIndex, 'food_preference', e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                    >
                                      {FOOD_PREFERENCES.map((f) => (
                                        <option key={f.value} value={f.value}>
                                          {f.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* T-Shirt Size */}
                                {isTshirtIncluded && (
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                      T-Shirt Size
                                    </label>
                                    <div className="relative">
                                      <Shirt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                      <select
                                        value={currentParticipant.shirt_size || 'M'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          handleParticipantChange(activeParticipantIndex, 'shirt_size', val);
                                          if (activeParticipantIndex === 0) {
                                            setFormData((prev) => ({ ...prev, tshirt_size: val }));
                                          }
                                        }}
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                      >
                                        {SHIRT_SIZES.map((s) => (
                                          <option key={s.value} value={s.value}>
                                            {s.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {/* Emergency Contact */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Emergency Contact <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Guardian Name & Phone"
                                    value={currentParticipant.emergency_contact || ''}
                                    onChange={(e) => handleParticipantChange(activeParticipantIndex, 'emergency_contact', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                  />
                                </div>

                                {/* Medical Conditions / Allergies */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Medical / Dietary Allergies <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Peanut allergy, Asthma (None if N/A)"
                                    value={currentParticipant.medical_conditions || ''}
                                    onChange={(e) => handleParticipantChange(activeParticipantIndex, 'medical_conditions', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                  />
                                </div>

                                {/* GitHub Profile */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    GitHub Profile <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://github.com/username"
                                    value={currentParticipant.github_profile || ''}
                                    onChange={(e) => handleParticipantChange(activeParticipantIndex, 'github_profile', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                  />
                                </div>

                                {/* LinkedIn Profile */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    LinkedIn Profile <span className="text-slate-400 text-[11px] font-normal">(optional)</span>
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://linkedin.com/in/username"
                                    value={currentParticipant.linkedin_profile || ''}
                                    onChange={(e) => handleParticipantChange(activeParticipantIndex, 'linkedin_profile', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-ink bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
                                  />
                                </div>
                              </div>

                              {/* Navigation / Next member shortcut inside roster */}
                              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                                <span className="text-[11px] text-slate-500 font-mono">
                                  Participant {activeParticipantIndex + 1} of {participants.length}
                                </span>
                                <div className="flex items-center gap-2">
                                  {activeParticipantIndex < participants.length - 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveParticipantIndex(activeParticipantIndex + 1)}
                                      className="text-xs font-semibold text-[#ea580c] hover:underline cursor-pointer"
                                    >
                                      Next Participant &rarr;
                                    </button>
                                  ) : participants.length < maxAllowedParticipants ? (
                                    <button
                                      type="button"
                                      onClick={handleAddParticipant}
                                      className="text-xs font-semibold text-[#ea580c] hover:underline cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add Member {participants.length + 1}</span>
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Participation Terms Agreement (No inline preview - opens modal on click) */}
                        <div className="pt-1">
                          <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 text-xs text-slate-700 cursor-pointer select-none hover:bg-slate-100/70 transition">
                            <input
                              type="checkbox"
                              required
                              checked={hasAgreedToTerms}
                              onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                              className="rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c] w-4 h-4 mt-0.5 shrink-0 cursor-pointer"
                            />
                            <span className="leading-relaxed">
                              I and all registered team members have read, understood, and agree to abide by the{' '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowTermsModal(true);
                                }}
                                className="font-bold text-[#ea580c] hover:underline underline-offset-2 cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>{terms?.[0]?.title || 'Participation Terms & Code of Conduct'}</span>
                                <ExternalLink className="w-3.5 h-3.5 inline text-[#ea580c]" />
                              </button>
                              .
                            </span>
                          </label>
                        </div>

                        {/* Step 3 Actions */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMessage('');
                              setCurrentStep(2);
                              window.scrollTo({ top: 160, behavior: 'smooth' });
                            }}
                            className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Coordinator</span>
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || !hasAgreedToTerms}
                            className="py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-brand-orange hover:brightness-110 shadow-md shadow-brand-orange/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ml-auto"
                            title={!hasAgreedToTerms ? 'Please agree to the Participation Terms & Code of Conduct to register' : ''}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Registering Squad & Roster...</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span>Submit Team & Participant Roster</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={isAuthOpen}
        reason={authReason}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          setIsAuthOpen(false);
          fetchExistingTeam();
        }}
        onOpenRegister={() => setIsAuthOpen(false)}
      />

      {/* Team Participants Modal */}
      {existingTeam && (
        <TeamParticipantsModal
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          team={existingTeam}
          currentUser={currentUser}
          onSuccess={(updated) => {
            setExistingTeam(updated);
            fetchExistingTeam();
          }}
        />
      )}

      <Toast />

      {/* Terms & Conditions Viewer Modal */}
      {showTermsModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Close Terms Modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-2 text-ink">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center border border-orange-100 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{terms?.[0]?.title || 'Participation Terms & Code of Conduct'}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Official rules, code of conduct, and guidelines for {hackathon?.title || 'the hackathon'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto space-y-3 pr-2 py-3 border-y border-slate-100 my-4 scrollbar-thin">
                <p className="whitespace-pre-line leading-relaxed">
                  {terms?.[0]?.content ||
                    'By participating in this hackathon, all team members agree to uphold academic integrity, original work, and community safety. Unauthorized plagiarism, offensive material, or unfair practices will result in instant disqualification. Participants retain full ownership of intellectual property produced during the event. Organizers reserve the right to photograph, record, and report on hackathon presentations for promotional purposes.'}
                </p>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setHasAgreedToTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-orange-600 transition shadow-xs cursor-pointer"
                >
                  I Understand & Agree
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
