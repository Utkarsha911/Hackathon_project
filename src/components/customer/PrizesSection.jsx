import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Trophy, Check } from 'lucide-react';

export default function PrizesSection() {
  const { prizes, isLoadingApi } = useHackathon();
  const totalPrizePool = prizes.reduce(
    (acc, curr) => acc + (Number(curr.prize_money) || 0),
    0
  );

  if (prizes.length === 0 && !isLoadingApi) {
    return null;
  }

  return (
    <section id="prizes" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="bic-section-label mb-2">Awards & Grants</div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            NPR {totalPrizePool.toLocaleString()} Prize Distribution
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Equity-free cash bounties disbursed directly to winning squads, alongside cloud
            compute grants and venture acceleration passes.
          </p>
        </div>

        {/* Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {prizes.slice(0, 3).map((prize, idx) => {
            const rank = prize.rank || idx + 1;
            const isFirst = rank === 1;
            const amount = Number(prize.prize_money) || 0;

            return (
              <div
                key={prize.id}
                className={`p-6 rounded-2xl flex flex-col justify-between transition-all ${
                  isFirst
                    ? 'bg-gradient-to-b from-coral-50/70 to-white border-2 border-coral-500 shadow-md shadow-coral-500/10'
                    : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className={`w-4 h-4 ${isFirst ? 'text-coral-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-mono font-bold ${isFirst ? 'text-coral-700' : 'text-slate-500'}`}>
                        RANK #{rank}
                      </span>
                    </div>
                    {isFirst && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-coral-500 text-white px-2 py-0.5 rounded shadow-sm">
                        Grand Winner
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{prize.title}</h3>

                  <div className="my-4">
                    <span className={`text-3xl font-extrabold font-mono ${isFirst ? 'text-coral-600' : 'text-slate-900'}`}>
                      NPR {amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">Direct Cash Bounty</span>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">{prize.description}</p>
                </div>

                {prize.perks && (
                  <div className={`pt-4 border-t space-y-2 ${isFirst ? 'border-coral-100' : 'border-slate-100'}`}>
                    {prize.perks.map((perk, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-coral-600 shrink-0 mt-0.5" />
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
          {prizes.slice(3).map((prize) => {
            const amount = Number(prize.prize_money) || 0;
            return (
              <div key={prize.id} className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between bic-card-hover shadow-sm">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Specialized Track Award</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{prize.title}</h4>
                  {prize.description && (
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">{prize.description}</p>
                  )}
                </div>
                <span className="text-base font-bold font-mono text-coral-600 shrink-0 ml-4">
                  NPR {amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
