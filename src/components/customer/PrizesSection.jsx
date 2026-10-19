import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Trophy, Award } from 'lucide-react';

export default function PrizesSection() {
  const { hackathon, prizes = [], isLoadingApi } = useHackathon();

  const totalPrizePool =
    Number(hackathon?.total_prize) ||
    prizes.reduce(
      (acc, curr) => acc + (Number(curr.prize_money) || 0),
      0
    );

  // If no prizes and done loading, hide section
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
            {totalPrizePool > 0
              ? `NPR ${totalPrizePool.toLocaleString()} Prize Distribution`
              : 'Hackathon Awards & Grants'}
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Equity-free cash bounties disbursed directly to winning squads, alongside cloud
            compute grants and venture acceleration passes.
          </p>
        </div>

        {/* Skeleton while initial load */}
        {isLoadingApi && prizes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse space-y-4">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
                <div className="h-8 w-1/2 bg-slate-200 rounded" />
                <div className="h-16 w-full bg-slate-200/60 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Podium Cards (Top 3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {prizes.slice(0, 3).map((prize, idx) => {
                const rank = prize.order !== undefined && prize.order !== null ? prize.order + 1 : idx + 1;
                const isFirst = rank === 1 || idx === 0;
                const amount = Number(prize.prize_money) || 0;

                return (
                  <div
                    key={prize.id}
                    className={`p-6 rounded-2xl flex flex-col justify-between transition-all ${
                      isFirst
                        ? 'bg-gradient-to-b from-orange-50/70 to-white border-2 border-[#ea580c] shadow-md shadow-orange-500/10'
                        : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Trophy className={`w-4 h-4 ${isFirst ? 'text-[#ea580c]' : 'text-slate-400'}`} />
                          <span className={`text-xs font-mono font-bold ${isFirst ? 'text-[#ea580c]' : 'text-slate-500'}`}>
                            RANK #{rank}
                          </span>
                        </div>
                        {isFirst && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#ea580c] text-white px-2 py-0.5 rounded shadow-sm">
                            Grand Winner
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{prize.title}</h3>

                      <div className="my-4">
                        <span className={`text-3xl font-extrabold font-mono ${isFirst ? 'text-[#ea580c]' : 'text-slate-900'}`}>
                          {amount > 0 ? `NPR ${amount.toLocaleString()}` : 'Trophy / Grant'}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {amount > 0 ? 'Direct Cash Bounty' : 'Award & Incubation Pass'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-4 leading-relaxed whitespace-pre-line">
                        {prize.description}
                      </p>
                    </div>

                    <div className={`pt-4 border-t ${isFirst ? 'border-orange-100' : 'border-slate-100'} flex items-center justify-between text-[11px] font-mono text-slate-400`}>
                      <span>Verified Award</span>
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Specialized Track Awards (Rank 4+) */}
            {prizes.length > 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prizes.slice(3).map((prize) => {
                  const amount = Number(prize.prize_money) || 0;
                  return (
                    <div
                      key={prize.id}
                      className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between bic-card-hover shadow-sm"
                    >
                      <div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase">
                          Specialized Track Award
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{prize.title}</h4>
                        {prize.description && (
                          <p className="text-xs text-slate-500 mt-1 max-w-sm line-clamp-2">
                            {prize.description}
                          </p>
                        )}
                      </div>
                      <span className="text-base font-bold font-mono text-[#ea580c] shrink-0 ml-4">
                        {amount > 0 ? `NPR ${amount.toLocaleString()}` : 'Special Award'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}
