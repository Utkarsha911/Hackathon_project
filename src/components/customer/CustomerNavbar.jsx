import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Award } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl, getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';
import HackathonBrand from '../common/HackathonBrand';
import Button from '../common/Button';

export default function CustomerNavbar({ onOpenRegister, onOpenLogin, onOpenProfile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    hackathon,
    currentUser,
    logoutUser,
    isRegistrationOpen,
    schedules = [],
    scheduleEvents = [],
    prizes = [],
    organizers = [],
    faqs = [],
    previousHackathons = []
  } = useHackathon();

  const hasScheduleData =
    (Array.isArray(schedules) && schedules.some((s) => !s.type || s.type === 'hackathon')) ||
    (Array.isArray(scheduleEvents) && scheduleEvents.length > 0) ||
    (Array.isArray(hackathon?.schedules) && hackathon.schedules.some((s) => !s.type || s.type === 'hackathon'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState('#top');
  const dropdownRef = useRef(null);

  // Monitor scroll position to apply dynamic blur effect when moving downward
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const hasPrizesData = Array.isArray(prizes) && prizes.length > 0;
  const hasOrganizersData = Array.isArray(organizers) && organizers.length > 0;
  const hasFaqData = Array.isArray(faqs) && faqs.length > 0;

  const navLinks = [
    { label: 'Home', hash: '#top' },
    { label: 'About', hash: '#about' },
    ...(hasScheduleData ? [{ label: 'Schedule', hash: '#schedule' }] : []),
    ...(hasPrizesData ? [{ label: 'Prizes', hash: '#prizes' }] : []),
    ...(hasOrganizersData ? [{ label: 'Organizers', hash: '#organizers' }] : []),
    ...(hasFaqData ? [{ label: 'FAQ', hash: '#faq' }] : []),
    ...(previousHackathons.length > 0 ? [{ label: 'History', href: '/previous-hackathons' }] : []),
  ];

  useEffect(() => {
    const sections = navLinks
      .filter((link) => link.hash)
      .map((link) => document.querySelector(link.hash))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveHash(`#${visible.target.id}`);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.4, 0.7] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [navLinks.length]);

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
        setActiveHash(targetHash);
        window.history.pushState(null, '', targetHash);
      }
    } else {
      navigate(`/${targetHash}`);
    }
  };

  const linkCls = (hash) => `relative px-3 py-2 text-[13px] font-semibold transition-colors ${
    activeHash === hash ? 'text-white' : 'text-slate-300 hover:text-white'
  }`;

  return (
    <header className={`sticky top-0 z-40 w-full bg-brand-dark/95 backdrop-blur border-b transition-shadow ${
      scrolled ? 'border-white/15 shadow-lg shadow-brand-dark/20' : 'border-white/10'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between">

        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="BIC Hackathon home">
          <HackathonBrand
            imageClassName="h-9 sm:h-10 w-auto max-w-[190px] object-contain"
            iconSizeClass="w-11 h-11"
            textClassName="text-sm sm:text-base font-extrabold text-white"
            subTextClassName="text-[10px] font-mono font-bold text-brand-yellow"
            showSubText={true}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            l.href ? (
              <Link key={l.label} to={l.href} className={linkCls('')}>
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={`/${l.hash}`} onClick={(e) => handleSectionClick(e, l.hash)} className={linkCls(l.hash)}>
                {l.label}
                {activeHash === l.hash && (
                  <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-brand-yellow" />
                )}
              </a>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center justify-center rounded-full p-0.5 border-2 border-white/30 hover:border-brand-orange transition cursor-pointer"
                aria-label="User account and profile menu"
                title={`${displayName} - View Profile`}
              >
                <img
                  src={getUserAvatarUrl(currentUser)}
                  alt={displayName}
                  onError={(e) => { e.currentTarget.src = DEFAULT_USER_AVATAR; }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in">
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-3 py-2.5 border-b border-slate-100 hover:bg-brand-tint rounded-xl transition"
                  >
                    <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                  </Link>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-brand-tint rounded-xl flex items-center gap-2 transition font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-brand-blue" />
                      <span>My Profile & Registered Teams</span>
                    </Link>
                    {isRegistrationOpen && (
                      <button
                        type="button"
                        onClick={() => { setUserDropdownOpen(false); onOpenRegister(); }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>Register a new team</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setUserDropdownOpen(false); logoutUser(); }}
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
            <Button
              variant="outline"
              onClick={onOpenLogin}
              className={`${isRegistrationOpen ? 'hidden sm:inline-flex' : 'inline-flex'} !px-5 !py-2 !text-xs`}
            >
              Login
            </Button>
          )}

          {isRegistrationOpen && (
            <Button onClick={onOpenRegister} className="!px-5 !py-2 !text-xs shadow-md shadow-brand-orange/20">
              Register
            </Button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white border border-white/20 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-dark border-t border-white/10 px-4 pt-2 pb-5 animate-fade-in">
          <nav className="flex flex-col space-y-1 text-sm font-medium text-slate-200">
            {navLinks.map((l) => (
              l.href ? (
                <Link
                  key={l.label}
                  to={l.href}
                  onClick={handleMobileNavClick}
                  className="px-3 py-2.5 rounded-xl transition flex items-center justify-between hover:bg-white/10"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={`/${l.hash}`}
                  onClick={(e) => { handleMobileNavClick(); handleSectionClick(e, l.hash); }}
                  className={`px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                    activeHash === l.hash ? 'bg-white/10 text-white' : 'hover:bg-white/10'
                  }`}
                >
                  {l.label}
                  {activeHash === l.hash && <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow" />}
                </a>
              )
            ))}
            {currentUser ? (
              <>
                <Link to="/profile" onClick={handleMobileNavClick} className="px-3 py-2 rounded-xl bg-brand-orange/20 text-brand-yellow font-semibold flex items-center gap-2 mt-2">
                  <User className="w-4 h-4" />
                  <span>My Profile & Registered Teams</span>
                </Link>
                <button
                  type="button"
                  onClick={() => { handleMobileNavClick(); logoutUser(); }}
                  className="text-left px-3 py-2 rounded-xl text-red-400 hover:bg-white/10 font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { handleMobileNavClick(); if (onOpenLogin) onOpenLogin(); }}
                className="text-left px-3 py-2 rounded-xl bg-white/10 text-white font-semibold flex items-center gap-2 mt-2"
              >
                <User className="w-4 h-4" />
                <span>{isRegistrationOpen ? 'Login / Register' : 'Login'}</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
