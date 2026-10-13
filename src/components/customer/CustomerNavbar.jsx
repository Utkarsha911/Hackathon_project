import React from 'react';
import { Terminal, ArrowUpRight } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';

export default function CustomerNavbar({ onOpenRegister }) {
  const { hackathon } = useHackathon();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080b11]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              {hackathon.title}
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 hidden sm:inline">
              {hackathon.year}
            </span>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
          <a href="#tracks" className="hover:text-white transition-colors">Challenges</a>
          <a href="#prizes" className="hover:text-white transition-colors">Prizes</a>
          <a href="#schedule" className="hover:text-white transition-colors">Schedule</a>
          <a href="#squads" className="hover:text-white transition-colors">Squads</a>
          <a href="#sponsors" className="hover:text-white transition-colors">Sponsors</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRegister}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Register Squad</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
