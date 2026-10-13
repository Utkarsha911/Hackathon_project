import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Calendar, MapPin, Trophy, ArrowRight, ShieldCheck, Code2 } from 'lucide-react';

export default function HeroSection({ onOpenRegister }) {
  const { hackathon, prizes } = useHackathon();
  const totalPrizePool = prizes.reduce((acc, curr) => acc + (curr.prize_money || 0), 0);

  return (
    <section className="relative pt-16 pb-20 border-b border-slate-800/60 overflow-hidden">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Top announcement pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Applications open until Nov 05, {hackathon.year}</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400 font-medium">{hackathon.event_time}</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.08]">
          Build the Next Generation of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-teal-300">
            Intelligent Systems
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-normal">
          {hackathon.description}
        </p>

        {/* Event Key Facts */}
        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2 bg-[#0e131f] border border-slate-800/80 px-3.5 py-2 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nov 14 – 16, {hackathon.year}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0e131f] border border-slate-800/80 px-3.5 py-2 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>{hackathon.venue}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0e131f] border border-slate-800/80 px-3.5 py-2 rounded-lg">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Prize Pool: NPR {totalPrizePool.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            onClick={onOpenRegister}
            className="px-6 py-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Register Your Squad</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <a
            href="#tracks"
            className="px-5 py-3 rounded-lg text-xs font-semibold text-slate-300 bg-[#0e131f] border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
          >
            Review Problem Statements
          </a>
        </div>

        {/* Architecture Specs Counter */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-800/60">
          <div className="p-4 rounded-xl bg-[#0e131f]/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-white font-mono">48 Hours</div>
            <div className="text-xs text-slate-400 mt-1">Continuous Sprint</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e131f]/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-indigo-400 font-mono">NPR 565k</div>
            <div className="text-xs text-slate-400 mt-1">Cash Grants & Perks</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e131f]/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-white font-mono">2 - 4</div>
            <div className="text-xs text-slate-400 mt-1">Engineers per Squad</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e131f]/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-1">Participant IP Retained</div>
          </div>
        </div>

      </div>
    </section>
  );
}
