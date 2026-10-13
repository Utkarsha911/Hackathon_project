import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Target, ArrowUpRight } from 'lucide-react';

export default function ChallengesSection() {
  const { challenges } = useHackathon();

  return (
    <section id="tracks" className="py-20 border-b border-slate-800/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-mono font-semibold uppercase text-indigo-400 mb-2">
            Challenge Briefs
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Problem Statements & Technical Tracks
          </h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Squads can select from the following domain challenges backed by industry partners. Prototypes must be committed and verifiable before Day 3 code freeze.
          </p>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {challenges.map((challenge, idx) => (
            <div 
              key={challenge.id} 
              className="p-6 rounded-2xl bg-[#0e131f] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-xs font-mono font-semibold text-indigo-400">
                    Track 0{idx + 1}: {challenge.track}
                  </span>
                  
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    challenge.difficulty === 'Advanced' 
                      ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                      : challenge.difficulty === 'Intermediate'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                      : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>

                <p className="text-base font-medium text-slate-100 leading-snug">
                  {challenge.problem_statement}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-slate-400">
                  Partner: <strong className="text-slate-200">{challenge.sponsor_name}</strong>
                </span>
                <span className="font-mono text-[11px] text-slate-500">{challenge.id}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
