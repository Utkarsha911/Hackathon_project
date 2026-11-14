import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHackathon } from '../../context/HackathonContext';
import { Code2, Globe, Share2 } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_PHONES, EVENT_YEAR } from '../../config/event';
import HackathonBrand from './HackathonBrand';

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    hackathon,
    schedules = [],
    scheduleEvents = [],
    prizes = [],
    faqs = [],
    sponsors = []
  } = useHackathon();

  const hasScheduleData =
    (Array.isArray(schedules) && schedules.some((s) => !s.type || s.type === 'hackathon')) ||
    (Array.isArray(scheduleEvents) && scheduleEvents.length > 0) ||
    (Array.isArray(hackathon?.schedules) && hackathon.schedules.some((s) => !s.type || s.type === 'hackathon'));

  const hasPrizesData = Array.isArray(prizes) && prizes.length > 0;
  const hasFaqData = Array.isArray(faqs) && faqs.length > 0;
  const hasSponsorsData =
    (Array.isArray(sponsors) && sponsors.length > 0) ||
    (Array.isArray(hackathon?.sponsor_packages) && hackathon.sponsor_packages.length > 0);

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

  const quickLinks = [
    ...(hackathon?.title ? [{ label: 'About', href: '/#about' }] : []),
    ...(hasScheduleData ? [{ label: 'Schedule', href: '/#schedule' }] : []),
    ...(hasPrizesData ? [{ label: 'Prizes', href: '/#prizes' }] : []),
  ];
  const resources = [
    ...(hasFaqData ? [{ label: 'FAQ', href: '/#faq' }] : []),
    ...(hasRulesData ? [{ label: 'Rules & Guidelines', href: '/#rules' }] : []),
    ...(hasSponsorsData ? [{ label: 'Partners', href: '/#sponsors' }] : []),
    { label: 'Contact', href: '/#contact' },
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

  const linkCls = 'text-slate-400 hover:text-white transition-colors';
  const colTitle = 'font-bold text-white text-sm mb-4';

  return (
    <footer className="bg-brand-dark text-slate-400 text-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-8 mb-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-9 md:grid-cols-4 md:gap-8">

          <div className="sm:col-span-2 md:col-span-1">
            <HackathonBrand
              imageClassName="h-8 w-auto max-w-[170px] object-contain"
              iconSizeClass="w-10 h-10"
              textClassName="text-sm font-extrabold text-white"
              subTextClassName="text-[10px] font-mono font-bold text-brand-yellow"
            />
          </div>

          <div>
            <h4 className={colTitle}>Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} onClick={(e) => handleSectionClick(e, item.href)} className={linkCls}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={colTitle}>Resources</h4>
            <ul className="space-y-2.5 text-sm">
              {resources.map((item) => (
                <li key={item.label}>
                  <a href={item.href} onClick={(e) => handleSectionClick(e, item.href)} className={linkCls}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={colTitle}>Find us</h4>
            <ul className="space-y-2.5 text-sm leading-relaxed">
              <li className="max-w-[18rem] text-slate-200 font-medium">Boston International College</li>
              <li className="max-w-[18rem]">Bharatpur-10, Chitwan, Nepal</li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={`${linkCls} break-all`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                <div className="flex flex-col items-start gap-1">
                  {CONTACT_PHONES.map((n) => (
                    <a key={n} href={`tel:${n.replace(/-/g, '')}`} className={linkCls}>{n}</a>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col items-start gap-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="max-w-xs leading-relaxed">
            <div>© {EVENT_YEAR} Boston International College. All rights reserved.</div>
            <a
              href="https://www.linkedin.com/in/elis-kandel/"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-slate-300 transition-colors hover:text-white"
            >
              Created by Elis Kandel
            </a>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {[
              { href: 'https://github.com', icon: Code2, label: 'GitHub' },
              { href: 'https://twitter.com', icon: Share2, label: 'Twitter' },
              { href: 'https://bichackathon.org', icon: Globe, label: 'Website' },
            ].map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" title={label} className="p-2 rounded-full bg-white/10 text-slate-300 hover:bg-brand-orange hover:text-white transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
