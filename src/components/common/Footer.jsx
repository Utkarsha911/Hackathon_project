import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHackathon } from '../../context/HackathonContext';
import { Code2, Globe, Share2 } from 'lucide-react';
import HackathonBrand from './HackathonBrand';

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hackathon, schedules = [], scheduleEvents = [] } = useHackathon();

  const hasScheduleData =
    (Array.isArray(schedules) && schedules.length > 0) ||
    (Array.isArray(scheduleEvents) && scheduleEvents.length > 0) ||
    (Array.isArray(hackathon?.schedules) && hackathon.schedules.length > 0);

  const hasRulesData = (() => {
    const r = hackathon?.rules;
    if (!r) return false;
    if (typeof r === 'string') return r.trim().length > 0;
    if (Array.isArray(r)) return r.length > 0;
    if (typeof r === 'object') {
      return (
        (Array.isArray(r.eligibility) && r.eligibility.length > 0) ||
        (Array.isArray(r.submission_guidelines) && r.submission_guidelines.length > 0) ||
        (Array.isArray(r.code_of_conduct) && r.code_of_conduct.length > 0) ||
        (Array.isArray(r.evaluation_criteria) && r.evaluation_criteria.length > 0)
      );
    }
    return false;
  })();

  const navLinks = [
    { label: 'Prizes', href: '/#prizes' },
    ...(hasScheduleData ? [{ label: 'Schedule', href: '/#schedule' }] : []),
    { label: 'Partners', href: '/#sponsors' },
    ...(hasRulesData ? [{ label: 'Rules & Guidelines', href: '/#rules' }] : []),
    { label: 'FAQ', href: '/#faq' }
  ];

  const handleSectionClick = (e, targetHref) => {
    e.preventDefault();
    const hashIndex = targetHref.indexOf('#');
    if (hashIndex === -1) return;
    const hash = targetHref.substring(hashIndex);

    if (location.pathname === '/') {
      const targetEl = document.querySelector(hash);
      if (targetEl) {
        const navHeight = 72;
        const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - navHeight,
          behavior: 'smooth'
        });
        window.history.pushState(null, '', hash);
      }
    } else {
      navigate(`/${hash}`);
    }
  };

  return (
    <footer className="border-t border-slate-200 text-xs bg-slate-50 text-slate-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <HackathonBrand
                imageClassName="h-9 w-auto max-w-[160px] object-contain"
                textClassName="text-sm font-extrabold text-slate-900"
              />
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed text-xs mb-5">
              {hackathon?.sub_heading || 'Build the Next Generation of AI-Powered Sustainable Ecosystems'}
            </p>
            <div className="flex items-center gap-2">
              {[
                { href: 'https://github.com', icon: Code2, label: 'GitHub' },
                { href: 'https://twitter.com', icon: Share2, label: 'Twitter' },
                { href: 'https://bichackathon.org', icon: Globe, label: 'Website' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-coral-600 hover:border-coral-300 shadow-sm transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Event Navigation */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-4 font-mono">
              Event Navigation
            </h4>
            <ul className="space-y-2.5">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => handleSectionClick(e, item.href)}
                    className="text-slate-500 hover:text-coral-600 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Venue & Contact */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-4 font-mono">
              Venue & Contact
            </h4>
            <ul className="space-y-2.5 text-slate-500">
              <li className="font-medium text-slate-700">Boston International College</li>
              <li>Bharatpur-10, Chitwan, Nepal</li>
              <li>
                <a href="mailto:info@bostoncollege.edu.np" className="hover:text-coral-600 transition-colors">
                  info@bostoncollege.edu.np
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  onClick={(e) => handleSectionClick(e, '/#faq')}
                  className="hover:text-coral-600 transition-colors"
                >
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
          <div>
            © {hackathon?.year || 2026} Boston International College — BIC Hackathon. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Active Competition</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
