import React from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';

export default function CustomerNavbar({ onOpenRegister }) {
  const { hackathon } = useHackathon();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <a href="#" className="flex items-center gap-3 group">
          {/* BIC Flame Seal Icon */}
          <div className="w-9 h-9 rounded-full bg-coral-500 flex items-center justify-center shadow-md shadow-coral-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-coral-600 transition-colors">
                {hackathon?.title || 'BIC Hackathon'}
              </span>
              {hackathon?.version && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-coral-50 text-coral-700 border border-coral-200 font-bold hidden sm:inline-block">
                  {hackathon.version}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-500 hidden sm:block">
              Boston International College · {hackathon?.year || 2026}
            </span>
          </div>
        </a>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
          <a href="#tracks" className="hover:text-coral-600 transition-colors">Challenges</a>
          <a href="#prizes" className="hover:text-coral-600 transition-colors">Prizes</a>
          <a href="#schedule" className="hover:text-coral-600 transition-colors">Schedule</a>
          <a href="#rules" className="hover:text-coral-600 transition-colors">Rules</a>
          <a href="#squads" className="hover:text-coral-600 transition-colors">Squads</a>
          <a href="#sponsors" className="hover:text-coral-600 transition-colors">Sponsors</a>
          <a href="#organizers" className="hover:text-coral-600 transition-colors">Organizers</a>
          <a href="#contact" className="hover:text-coral-600 transition-colors">Contact</a>
        </nav>

        {/* CTA */}
        <button
          onClick={onOpenRegister}
          className="btn-primary flex items-center gap-1.5 text-xs"
        >
          <span>Register Squad</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
