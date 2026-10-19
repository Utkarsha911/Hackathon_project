import React, { useState, useEffect } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import api, { getMediaUrl } from '../../services/api';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  GraduationCap,
  MapPin,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  LogOut,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  Loader2,
  Award,
  Ban
} from 'lucide-react';
import hackathonLogo from '../../assets/HACKATHON-LOGO.png';

export default function CustomerProfileModal({ isOpen, onClose, onOpenRegister }) {
  const { currentUser, hackathon, logoutUser } = useHackathon();

  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState('');

  useBodyScrollLock(isOpen);

  // Fetch teams registered by the current user from /api/v1/hackathons/teams/
  useEffect(() => {
    if (isOpen && currentUser) {
      let isMounted = true;
      setIsLoadingTeams(true);
      setTeamsError('');

      api.hackathons.teams
        .getAll({}, { forceRefresh: true })
        .then((res) => {
          if (!isMounted) return;
          const list = Array.isArray(res)
            ? res
            : Array.isArray(res?.results)
            ? res.results
            : Array.isArray(res?.data)
            ? res.data
            : [];
          setRegisteredTeams(list);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error('Failed to fetch user teams from /api/v1/hackathons/teams/:', err);
          setTeamsError(err?.message || 'Could not load registered teams.');
          setRegisteredTeams([]);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingTeams(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const fullName =
    `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() ||
    currentUser.username ||
    currentUser.email?.split('@')[0] ||
    'Hacker';

  const userInitial = (currentUser.first_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase();

  const memberSince = currentUser.date_joined || currentUser.created_at;

  const handleRegisterNewTeam = () => {
    onClose();
    if (typeof onOpenRegister === 'function') {
      setTimeout(() => {
        onOpenRegister();
      }, 150);
    }
  };

  const handleSignOut = () => {
    logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
        <div className="p-6 sm:p-8">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Title / Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={hackathonLogo}
                alt="BIC Hackathon"
                className="h-7 w-auto object-contain"
              />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ea580c]">
                User Profile
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Account & Hackathon Registrations
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              View your personal profile details and the teams you have registered for the hackathon.
            </p>
          </div>

          {/* SECTION 1: PERSONAL DETAILS */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3.5">
                {currentUser.profile_picture ? (
                  <img
                    src={getMediaUrl(currentUser.profile_picture)}
                    alt={fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#ea580c] text-white flex items-center justify-center text-xl font-extrabold shadow-sm">
                    {userInitial}
                  </div>
                )}
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {fullName}
                  </h4>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verified Hacker
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Email Address</span>
                  <span className="font-medium text-slate-800 truncate block">{currentUser.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Phone Number</span>
                  <span className="font-medium text-slate-800">
                    {currentUser.phone_number || 'Not provided'}
                  </span>
                </div>
              </div>

              {currentUser.college && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Institution</span>
                    <span className="font-medium text-slate-800 truncate block">{currentUser.college}</span>
                  </div>
                </div>
              )}

              {memberSince && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Member Since</span>
                    <span className="font-medium text-slate-800">
                      {new Date(memberSince).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: REGISTERED HACKATHON TEAMS (/api/v1/hackathons/teams/) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#ea580c]" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Registered Hackathons & Teams
                </h4>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {registeredTeams.length} {registeredTeams.length === 1 ? 'Team' : 'Teams'}
              </span>
            </div>

            {isLoadingTeams ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-[#ea580c] animate-spin" />
                <p className="text-xs text-slate-500 font-medium">
                  Loading registered hackathons and teams...
                </p>
              </div>
            ) : teamsError ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {teamsError}
              </div>
            ) : registeredTeams.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">No teams registered yet</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You haven't enrolled a team for {hackathon?.title || 'the hackathon'} yet. Register your squad to participate!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegisterNewTeam}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#c2410c] px-4 py-2 rounded-xl shadow-xs transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Squad Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {registeredTeams.map((team) => {
                  const status = (team.status || 'submitted').toLowerCase();
                  const isApproved = status === 'approved';
                  const isRejected = status === 'rejected';
                  const isDisqualified = status === 'disqualified';

                  return (
                    <div
                      key={team.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-orange-300 transition"
                    >
                      {/* Top Header of Team Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-50 text-[#ea580c] font-bold border border-orange-100">
                              {hackathon?.title || 'BIC Hackathon'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {String(team.id).slice(0, 8)}...
                            </span>
                          </div>
                          <h5 className="text-base font-bold text-slate-900 mt-1">
                            {team.name}
                          </h5>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isDisqualified
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isRejected
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isDisqualified ? (
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                            ) : isRejected ? (
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>{team.status || 'Submitted'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Team Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">College</span>
                            <span className="font-semibold text-slate-800">{team.college_name || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Affiliated University</span>
                            <span className="font-semibold text-slate-800">{team.affilated_university || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Location</span>
                            <span className="font-medium text-slate-700">{team.college_address || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Team Size</span>
                            <span className="font-medium text-slate-700">{team.no_of_members || 1} Members</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Coordinator Email</span>
                            <span className="font-medium text-slate-700 truncate block">{team.coordinator_email}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Coordinator Phone</span>
                            <span className="font-medium text-slate-700">{team.coordinator_phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Info / Links */}
                      {(team.college_website || team.github_repo || team.created_at) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3">
                            {team.college_website && (
                              <a
                                href={team.college_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#ea580c] hover:underline font-mono text-[11px]"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Website</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {team.github_repo && (
                              <a
                                href={team.github_repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-mono text-[11px]"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Repository</span>
                              </a>
                            )}
                          </div>

                          {team.created_at && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Registered: {new Date(team.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
