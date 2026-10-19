import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Code2, Globe, Share2 } from 'lucide-react';
import hackathonLogo from '../../assets/HACKATHON-LOGO.png';

export default function Footer() {
  const { hackathon } = useHackathon();

  return (
    <footer className="border-t border-slate-200 text-xs bg-slate-50 text-slate-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={hackathonLogo}
                alt={hackathon?.title || 'BIC Hackathon'}
                className="h-9 w-auto object-contain"
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
              {['Challenges', 'Prizes', 'Schedule', 'Squads Directory', 'Partners', 'Rules & Guidelines', 'FAQ'].map((item, i) => {
                const hrefs = ['#tracks', '#prizes', '#schedule', '#squads', '#sponsors', '#rules', '#faq'];
                return (
                  <li key={item}>
                    <a href={hrefs[i]} className="text-slate-500 hover:text-coral-600 transition-colors">
                      {item}
                    </a>
                  </li>
                );
              })}
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
                <a href="#faq" className="hover:text-coral-600 transition-colors">
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
