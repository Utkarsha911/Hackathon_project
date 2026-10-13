import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Trophy, Check } from 'lucide-react';

export default function PrizesSection() {
  const { prizes } = useHackathon();

  return (
    <section id="prizes" className="py-20 border-b border-slate-800/60 bg-[#080b11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-mono font-semibold uppercase text-amber-400 mb-2">
            Awards & Grants
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            NPR 565,000+ Prize Distribution
          </h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Equity-free cash bounties disbursed directly to winning squads, alongside cloud compute grants and venture acceleration passes.
          </p>
        </div>

        {/* Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {prizes.slice(0, 3).map((prize) => {
            const isFirst = prize.rank === 1;

            return (
              <div
                key={prize.id}
                className={`p-6 rounded-2xl flex flex-col justify-between transition-all ${
                  isFirst
                    ? 'bg-[#111726] border-2 border-indigo-500/60 shadow-lg'
                    : 'bg-[#0e131f] border border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      RANK #{prize.rank}
                    </span>
                    {isFirst && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                        Grand Winner
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {prize.title}
                  </h3>

                  <div className="my-4">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      NPR {(prize.prize_money || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">Direct Cash Bounty</span>
                  </div>

                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    {prize.description}
                  </p>
                </div>

                {prize.perks && (
                  <div className="pt-4 border-t border-slate-800/80 space-y-2">
                    {prize.perks.map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Specialized Track Awards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prizes.slice(3).map((prize) => (
            <div key={prize.id} className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase">Specialized Track Award</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{prize.title}</h4>
              </div>
              <span className="text-base font-bold font-mono text-indigo-300">
                NPR {(prize.prize_money || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
