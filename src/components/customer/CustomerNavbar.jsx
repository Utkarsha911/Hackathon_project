import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, User, LogOut, Menu, X, Shield } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import hackathonLogo from '../../assets/HACKATHON-LOGO.png';

export default function CustomerNavbar({ onOpenRegister }) {
  const { hackathon, currentUser, logoutUser } = useHackathon();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      {/* Top Banner: Current Live / Active Hackathon */}
      {hackathon?.title && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-coral-500/20 px-3 sm:px-6 py-2 shadow-xs transition-all">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-coral-500/15 text-coral-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-coral-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-coral-400 animate-pulse" />
                Current Hackathon
              </span>

              <span className="font-semibold text-white tracking-tight truncate">
                {hackathon.title}
              </span>

              {hackathon.version && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-coral-300 border border-coral-500/20">
                  {hackathon.version}
                </span>
              )}

              {hackathon.sub_heading && (
                <span className="hidden md:inline text-slate-400 text-xs truncate">
                  • {hackathon.sub_heading}
                </span>
              )}

              {hackathon.venue && (
                <span className="hidden lg:inline-flex items-center gap-1 text-slate-400 text-[11px] truncate">
                  <span className="text-coral-500/70">📍</span> {hackathon.venue}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {(hackathon.registration_end_date || hackathon.registration_enddate) && (
                <span className="hidden sm:inline-block text-[11px] text-slate-300 font-mono">
                  Registration open till{' '}
                  <strong className="text-coral-400 font-medium">
                    {new Date(hackathon.registration_end_date || hackathon.registration_enddate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              )}

              <button
                type="button"
                onClick={onOpenRegister}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-coral-600 hover:bg-coral-500 text-white px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <span>Register Squad</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Brand */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img
              src={hackathonLogo}
              alt={hackathon?.title || 'BIC Hackathon'}
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
            />
            {hackathon?.title && (
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 tracking-tight leading-none group-hover:text-coral-600 transition-colors">
                    {hackathon.title}
                  </span>
                  {hackathon.version && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-coral-50 text-coral-600 border border-coral-200/80 leading-none">
                      {hackathon.version}
                    </span>
                  )}
                </div>
                {hackathon.sub_heading && (
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[190px] leading-tight mt-0.5">
                    {hackathon.sub_heading}
                  </span>
                )}
              </div>
            )}
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-slate-600">
          <a
            href="#prizes"
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Prizes
          </a>
          <a
            href="#schedule"
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Schedule
          </a>
          <a
            href="#sponsors"
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Sponsors
          </a>
          <a
            href="#organizers"
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Organizers
          </a>
          <a
            href="#contact"
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* CTA & User Authentication */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {currentUser && (
            /* Logged In User Profile Pill & Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 py-1.5 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-coral-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-slate-800 max-w-[100px] sm:max-w-[110px] truncate hidden sm:inline-block">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-coral-50 text-coral-700 font-bold border border-coral-200">
                        {currentUser.role || 'Participant'}
                      </span>
                      {isStaffOrAdmin && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                          Staff
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    {isStaffOrAdmin && (
                      <Link
                        to="/admin-control-site"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs text-orange-700 hover:bg-orange-50 rounded-xl flex items-center gap-2 transition font-medium"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#e8622a]" />
                        <span>Admin Workspace</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenRegister();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Register Squad</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutUser();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition mt-1 border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              href="#prizes"
              onClick={handleMobileNavClick}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Prizes & Awards
            </a>
            <a
              href="#schedule"
              onClick={handleMobileNavClick}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              48-Hour Sprint Schedule
            </a>
            <a
              href="#sponsors"
              onClick={handleMobileNavClick}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Sponsors & Partners
            </a>
            <a
              href="#organizers"
              onClick={handleMobileNavClick}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Organizers & Mentors
            </a>
            <a
              href="#contact"
              onClick={handleMobileNavClick}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Contact Committee
            </a>

            {isStaffOrAdmin && (
              <Link
                to="/admin-control-site"
                onClick={handleMobileNavClick}
                className="px-3 py-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition font-semibold flex items-center gap-2 mt-2"
              >
                <Shield className="w-4 h-4 text-[#e8622a]" />
                <span>Admin Workspace</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
