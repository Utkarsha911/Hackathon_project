import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, User, LogOut, Menu, X, Shield, Award } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl, getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';
import HackathonBrand from '../common/HackathonBrand';

export default function CustomerNavbar({ onOpenRegister, onOpenLogin, onOpenProfile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hackathon, currentUser, logoutUser, schedules = [], scheduleEvents = [] } = useHackathon();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const hasScheduleData =
    (Array.isArray(schedules) && schedules.length > 0) ||
    (Array.isArray(scheduleEvents) && scheduleEvents.length > 0) ||
    (Array.isArray(hackathon?.schedules) && hackathon.schedules.length > 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const role = (currentUser?.role || '').toLowerCase();
  const isStaffOrAdmin =
    currentUser?.is_staff ||
    currentUser?.is_superuser ||
    role.includes('admin') ||
    role.includes('staff') ||
    role.includes('organizer');

  const displayName = currentUser?.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
    : currentUser?.email?.split('@')[0] || 'User';

  const userInitial = (currentUser?.first_name?.[0] || currentUser?.email?.[0] || 'U').toUpperCase();

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleSectionClick = (e, targetHash) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const targetEl = document.querySelector(targetHash);
      if (targetEl) {
        const navHeight = 72;
        const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - navHeight,
          behavior: 'smooth'
        });
        window.history.pushState(null, '', targetHash);
      }
    } else {
      navigate(`/${targetHash}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      {/* Main Navbar */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <HackathonBrand
              imageClassName="h-8 sm:h-9 w-auto max-w-[150px] object-contain transition-transform group-hover:scale-102"
              textClassName="text-sm font-extrabold text-slate-900 group-hover:text-[#ea580c] transition-colors"
              showSubText={true}
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-slate-600">
          <a
            href="/#prizes"
            onClick={(e) => handleSectionClick(e, '#prizes')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Prizes
          </a>
          {hasScheduleData && (
            <a
              href="/#schedule"
              onClick={(e) => handleSectionClick(e, '#schedule')}
              className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
            >
              Schedule
            </a>
          )}
          <a
            href="/#sponsors"
            onClick={(e) => handleSectionClick(e, '#sponsors')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Sponsors
          </a>
          <a
            href="/#organizers"
            onClick={(e) => handleSectionClick(e, '#organizers')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Organizers
          </a>
          <a
            href="/#contact"
            onClick={(e) => handleSectionClick(e, '#contact')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Contact
          </a>
          {currentUser && (
            <Link
              to="/profile"
              className="px-3 py-1.5 rounded-lg text-[#ea580c] hover:bg-orange-50 font-semibold transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
          )}
        </nav>

        {/* CTA & User Authentication */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {currentUser ? (
            /* Logged In User Rounded Circle Profile & Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="relative flex items-center justify-center rounded-full p-0.5 border-2 border-orange-200 hover:border-[#ea580c] transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-xs group cursor-pointer"
                aria-label="User account and profile menu"
                title={`${displayName} - View Profile`}
              >
                <img
                  src={getUserAvatarUrl(currentUser)}
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_USER_AVATAR;
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in">
                  {/* Clickable Profile Summary Header linking to /profile */}
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-3 py-2.5 border-b border-slate-100 hover:bg-orange-50/60 rounded-xl transition group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#ea580c]">
                        {displayName}
                      </p>
                      <span className="text-[10px] text-[#ea580c] font-medium flex items-center gap-0.5">
                        Profile →
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                  </Link>

                  <div className="py-1">
                    {/* View Profile & Registered Teams action */}
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-orange-50 hover:text-[#ea580c] rounded-xl flex items-center gap-2 transition font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-[#ea580c]" />
                      <span>My Profile & Registered Teams</span>
                    </Link>



                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenRegister();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Enroll New Squad</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutUser();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition mt-1 border-t border-slate-100 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sign In Button for unauthenticated visitors */
            <button
              type="button"
              onClick={onOpenLogin}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#ea580c] hover:bg-slate-100/80 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Register Squad CTA */}
          <button
            onClick={onOpenRegister}
            className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 sm:px-4 shadow-sm"
          >
            <span>Register Squad</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 border-b border-slate-200 px-4 pt-2 pb-5 space-y-2 shadow-xl animate-fade-in">
          {hackathon?.title && (
            <div className="p-3 rounded-xl bg-slate-900 text-white border border-coral-500/30 mb-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-coral-400 bg-coral-500/20 px-2 py-0.5 rounded-full">
                  Current Event
                </span>
                {hackathon.version && (
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {hackathon.version}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white mt-1.5">{hackathon.title}</p>
              {hackathon.sub_heading && (
                <p className="text-xs text-slate-400 mt-0.5">{hackathon.sub_heading}</p>
              )}
              {hackathon.venue && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>📍</span> {hackathon.venue}
                </p>
              )}
            </div>
          )}
          <nav className="flex flex-col space-y-1 font-medium text-sm text-slate-700">
            <a
              href="/#prizes"
              onClick={(e) => {
                handleMobileNavClick();
                handleSectionClick(e, '#prizes');
              }}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Prizes & Awards
            </a>
            {hasScheduleData && (
              <a
                href="/#schedule"
                onClick={(e) => {
                  handleMobileNavClick();
                  handleSectionClick(e, '#schedule');
                }}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
              >
                48-Hour Sprint Schedule
              </a>
            )}
            <a
              href="/#sponsors"
              onClick={(e) => {
                handleMobileNavClick();
                handleSectionClick(e, '#sponsors');
              }}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Sponsors & Partners
            </a>
            <a
              href="/#organizers"
              onClick={(e) => {
                handleMobileNavClick();
                handleSectionClick(e, '#organizers');
              }}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Organizers & Mentors
            </a>
            <a
              href="/#contact"
              onClick={(e) => {
                handleMobileNavClick();
                handleSectionClick(e, '#contact');
              }}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Contact Committee
            </a>

            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  onClick={handleMobileNavClick}
                  className="w-full text-left px-3 py-2 rounded-xl bg-orange-50 text-[#ea580c] hover:bg-orange-100 transition font-semibold flex items-center gap-2 mt-2"
                >
                  <User className="w-4 h-4 text-[#ea580c]" />
                  <span>My Profile & Registered Teams</span>
                </Link>



                <button
                  type="button"
                  onClick={() => {
                    handleMobileNavClick();
                    logoutUser();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleMobileNavClick();
                  if (onOpenLogin) onOpenLogin();
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition font-semibold flex items-center gap-2 mt-2"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Sign In / Register</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
