import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  GraduationCap,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  LogOut,
  ExternalLink,
  Shield,
  ShieldCheck,
  Award,
  Ban,
  Loader2,
  Code2,
  Plus,
  UserPlus,
  Eye
} from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import CustomerNavbar from './CustomerNavbar';
import RegistrationModal from './RegistrationModal';
import UserAuthModal from './UserAuthModal';
import TeamParticipantsModal from './TeamParticipantsModal';
import Footer from '../common/Footer';
import api, { getMediaUrl, getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';

export default function CustomerProfilePage() {
  const { currentUser, hackathon, logoutUser } = useHackathon();
  const navigate = useNavigate();

  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [teamsError, setTeamsError] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [managingTeam, setManagingTeam] = useState(null);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // Fetch teams registered by the current user from /api/v1/hackathons/teams/
  const fetchUserTeams = async () => {
    if (!currentUser) return;
    setIsLoadingTeams(true);
    setTeamsError('');

    try {
      const res = await api.hackathons.teams.getAll({}, { forceRefresh: true });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res?.data)
            ? res.data
            : [];
      setRegisteredTeams(list);
    } catch (err) {
      console.error('Failed to fetch user teams from /api/v1/hackathons/teams/:', err);
      setTeamsError(err?.message || 'Could not load your registered teams.');
      setRegisteredTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserTeams();
    } else {
      setIsLoadingTeams(false);
    }
  }, [currentUser]);

  const fullName =
    `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() ||
    currentUser?.username ||
    currentUser?.email?.split('@')[0] ||
    'Hacker';

  const userInitial = (
    currentUser?.first_name?.[0] ||
    currentUser?.email?.[0] ||
    'U'
  ).toUpperCase();

  const role = (currentUser?.role || '').toLowerCase();
  const isStaffOrAdmin =
    currentUser?.is_staff ||
    currentUser?.is_superuser ||
    role.includes('admin') ||
    role.includes('staff') ||
    role.includes('organizer');

  const memberSince = currentUser?.date_joined || currentUser?.created_at;

  const handleSignOut = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900">
      {/* Top Navbar */}
      <CustomerNavbar
        onOpenRegister={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setIsRegisterOpen(true);
          }
        }}
        onOpenLogin={() => setIsAuthOpen(true)}
        onOpenProfile={() => {
          // Already on profile page
        }}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#ea580c] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Hackathon Home</span>
          </Link>
        </div>

        {!currentUser ? (
          /* Unauthenticated State */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sign in to view your profile</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Please sign in with your account to access your personal profile and manage your registered hackathon squads.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#ea580c] hover:bg-orange-600 text-white shadow-xs transition"
              >
                Sign In / Register
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          /* Authenticated User Profile View */
          <div className="space-y-8">
            {/* Header Profile Hero Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                {/* Avatar & Name */}
                <div className="flex items-center gap-4">
                  <img
                    src={getUserAvatarUrl(currentUser)}
                    alt={fullName}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_USER_AVATAR;
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0 bg-slate-50"
                  />

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        {fullName}
                      </h1>

                    </div>
                    <p className="text-xs sm:text-sm font-mono text-slate-500 mt-1">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {/* Actions: Register New Team & Sign Out */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#ea580c] hover:bg-orange-600 text-white shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register New Team</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100/60 text-[#ea580c] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-800 truncate block">{currentUser.email}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100/60 text-[#ea580c] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Phone</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {currentUser.phone_number || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100/60 text-[#ea580c] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Joined</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {memberSince
                        ? new Date(memberSince).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                        : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: REGISTERED HACKATHONS & TEAMS */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      My Registered Teams & Hackathons
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs">
                    {registeredTeams.length} {registeredTeams.length === 1 ? 'Registered Squad' : 'Registered Squads'}
                  </span>
                </div>
              </div>

              {isLoadingTeams ? (
                <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin" />
                  <p className="text-xs font-semibold text-slate-600">Loading registered hackathon teams...</p>
                </div>
              ) : teamsError ? (
                <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {teamsError}
                </div>
              ) : registeredTeams.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">No teams registered yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      You haven't enrolled a team for {hackathon?.title || 'the current hackathon'}.
                      Assemble your squad and enroll to compete!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#ea580c] hover:bg-orange-600 text-white shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register a Squad Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {registeredTeams.map((team) => {
                    const status = (team.status || 'submitted').toLowerCase();
                    const isApproved = status === 'approved';
                    const isParticipationConfirmed = status === 'participation_confirmed';
                    const isDisqualified = status === 'disqualified';
                    const isRejected = status === 'rejected';

                    return (
                      <div
                        key={team.id}
                        className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-orange-300 hover:shadow-md transition flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top: Hackathon Tag + Status */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-50 text-[#ea580c] font-bold border border-orange-100">
                                  {hackathon?.title || 'BIC Hackathon'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ID: {String(team.id).slice(0, 8)}...
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 mt-2">
                                {team.name}
                              </h3>
                            </div>

                            {/* Status Badge */}
                            {isParticipationConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 bg-blue-50 text-blue-700 border border-blue-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Participation Confirmed</span>
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            ) : isDisqualified ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 bg-rose-50 text-rose-700 border border-rose-200">
                                <Ban className="w-3.5 h-3.5 text-rose-600" />
                                <span>Disqualified</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 bg-red-50 text-red-700 border border-red-200">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>{team.status || 'Submitted'}</span>
                              </span>
                            )}
                          </div>

                          {/* Team Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs text-slate-600">
                            <div className="flex items-start gap-2.5">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">College</span>
                                <span className="font-semibold text-slate-800 truncate block">
                                  {team.college_name || 'Independent Squad'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">University</span>
                                <span className="font-semibold text-slate-800 truncate block">
                                  {team.affilated_university || 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">Squad Size</span>
                                <span className="font-semibold text-slate-800">
                                  {team.no_of_members || 1} Registered Members
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] text-slate-400 uppercase font-mono block">Coordinator Phone</span>
                                <span className="font-semibold text-slate-800 truncate block">
                                  {team.coordinator_phone || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {team.coordinator_email && (
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-slate-400 text-[10px] font-mono uppercase">Coordinator Email</span>
                              <span className="font-mono text-slate-700 truncate max-w-[200px]">
                                {team.coordinator_email}
                              </span>
                            </div>
                          )}

                          {/* Participants Roster Section (Allowed after team is approved/accepted) */}
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-bold text-slate-800">
                                  Participants Roster
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                  {team.participants?.length || 0} / {team.no_of_members || 1}
                                </span>
                              </div>

                              {isParticipationConfirmed ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManagingTeam(team);
                                    setIsParticipantsOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View Roster</span>
                                </button>
                              ) : isApproved ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManagingTeam(team);
                                    setIsParticipantsOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold text-white bg-[#ea580c] hover:bg-orange-600 shadow-xs transition active:scale-95 cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>{team.participants?.length > 0 ? 'Update Participants' : 'Add Participants'}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium italic">
                                  Editable once approved
                                </span>
                              )}
                            </div>

                            {/* Participant details / preview */}
                            {team.participants && team.participants.length > 0 ? (
                              <div className="space-y-1.5 mt-2">
                                {team.participants.map((p, pIdx) => (
                                  <div
                                    key={p.id || pIdx}
                                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                          pIdx === 0 ? 'bg-[#ea580c] text-white' : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        {pIdx + 1}
                                      </div>
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                                          {pIdx === 0 && (
                                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-100 text-[#ea580c] font-bold">
                                              Leader
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-mono truncate block">{p.email}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-medium text-slate-500">
                                      {p.shirt_size && (
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
                            ) : null}

                            {/* Status Context Alerts */}
                            {isParticipationConfirmed ? (
                              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-900 flex items-center gap-2 mt-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Participation confirmed! Squad details and roster are locked and cannot be edited.</span>
                              </div>
                            ) : isApproved && (!team.participants || team.participants.length === 0) ? (
                              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 flex items-center justify-between gap-2 mt-2">
                                <span>Squad approved! Click "Add Participants" to register yourself and teammates.</span>
                              </div>
                            ) : !isApproved && !isParticipationConfirmed ? (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-400 mt-2">
                                Squad application submitted. Participant profiles can be submitted after acceptance.
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Footer info & Links */}
                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          {team.college_website ? (
                            <a
                              href={team.college_website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-[#ea580c] transition"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">Campus Site</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">No campus site</span>
                          )}

                          {team.github_repo ? (
                            <a
                              href={team.github_repo}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-[#ea580c] font-semibold transition"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>GitHub Repository</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">Repo private</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          fetchUserTeams();
        }}
      />

      {/* Team Participants Modal */}
      <TeamParticipantsModal
        isOpen={isParticipantsOpen}
        onClose={() => {
          setIsParticipantsOpen(false);
          setManagingTeam(null);
        }}
        team={managingTeam}
        currentUser={currentUser}
        onSuccess={() => fetchUserTeams()}
      />

      {/* Auth Modal for unauthenticated users */}
      <UserAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode="login"
      />
    </div>
  );
}
