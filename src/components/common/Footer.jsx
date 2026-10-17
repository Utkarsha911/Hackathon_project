import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Flame, Code2, Globe, Share2, Shield, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { hackathon } = useHackathon();

  return (
    <footer className="border-t border-slate-200 text-xs bg-slate-50 text-slate-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-coral-500 flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{hackathon?.title || 'BIC InnovateX'}</div>
                <div className="text-[10px] font-mono text-slate-400">Boston International College</div>
              </div>
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
              {['Challenges', 'Prizes', 'Schedule', 'Squads Directory', 'Partners', 'FAQ'].map((item, i) => {
                const hrefs = ['#tracks', '#prizes', '#schedule', '#squads', '#sponsors', '#faq'];
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

          {/* Admin Route */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-4 font-mono">
              Staff & Operations
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 font-medium text-coral-600 hover:text-coral-700 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Operations Panel</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  Restricted to committee staff, judge panels, and desk reception.
                </span>
              </li>
              <li>
                <a href="#contact" className="text-slate-500 hover:text-coral-600 transition-colors">
                  Contact Committee Desk
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
          <div>
            © {hackathon?.year || 2026} Boston International College — BIC Hackathon.
            Models from <code className="text-slate-500 font-semibold">bic_hackathon_design</code>.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Live Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
