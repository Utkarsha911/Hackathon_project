import React, { useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Trophy, Award, NepaliRupee } from 'lucide-react';

export default function PrizesSection() {
  const { hackathon, prizes = [], isLoadingApi } = useHackathon();

  // Keep prizes sorted strictly according to the received order (order field or arrival sequence)
  const orderedPrizes = useMemo(() => {
    return [...prizes].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999;
      const orderB = typeof b.order === 'number' ? b.order : 999;
      return orderA - orderB;
    });
  }, [prizes]);

  // Dynamically identify the Grand Winner prize (Winner title or highest prize money)
  const grandWinnerId = useMemo(() => {
    if (!orderedPrizes.length) return null;

    // 1. Explicit winner title without runner-up
    const winnerByTitle = orderedPrizes.find(
      (p) => /(^|\b)(winner|champion|grand\s+prize|1st\s+place)(\b|$)/i.test(p.title || '') && !/runner/i.test(p.title || '')
    );
    if (winnerByTitle) return winnerByTitle.id;

    // 2. Highest prize money bounty
    let topPrize = null;
    let maxMoney = 0;
    for (const p of orderedPrizes) {
      const money = Number(p.prize_money) || 0;
      if (money > maxMoney) {
        maxMoney = money;
        topPrize = p;
      }
    }
    if (topPrize) return topPrize.id;

    return orderedPrizes[0]?.id;
  }, [orderedPrizes]);

  const totalPrizePool =
    hackathon?.total_prize !== undefined && hackathon?.total_prize !== null
      ? Number(hackathon.total_prize) || 0
      : (orderedPrizes.length > 0
          ? orderedPrizes.reduce((acc, curr) => acc + (Number(curr.prize_money) || 0), 0)
          : 0);

  // If no prizes and done loading, hide section
  if (orderedPrizes.length === 0 && !isLoadingApi) {
    return null;
  }

  const getBadgeLabel = (prize, isGrandWinner) => {
    if (isGrandWinner) return '1ST PLACE';
    if (/1st\s*runner/i.test(prize?.title || '')) return '2ND PLACE';
    if (/2nd\s*runner/i.test(prize?.title || '')) return '3RD PLACE';
    if (/3rd\s*runner/i.test(prize?.title || '')) return '4TH PLACE';
    return 'AWARD';
  };

  return (
    <section id="prizes" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="bic-section-label mb-2">Awards & Grants</div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {totalPrizePool > 0 ? (
              <span className="inline-flex items-center flex-wrap gap-x-1">
                <span className="inline-flex items-center">
                  <NepaliRupee className="w-7 sm:w-9 h-7 sm:h-9 stroke-[2.5] -mr-1 text-slate-900 shrink-0" />
                  {totalPrizePool.toLocaleString()}
                </span>
                <span>Prize Distribution</span>
              </span>
            ) : (
              'Hackathon Awards & Grants'
            )}
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Equity-free cash bounties disbursed directly to winning squads, alongside cloud
            compute grants and venture acceleration passes.
          </p>
        </div>

        {/* Skeleton while initial load */}
        {isLoadingApi && orderedPrizes.length === 0 ? (
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
            {/* Podium Cards Rendered in Ordered Sequence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-stretch">
              {orderedPrizes.slice(0, 3).map((prize) => {
                const amount = Number(prize.prize_money) || 0;
                const isGrandWinner = prize.id === grandWinnerId;
                const badgeLabel = getBadgeLabel(prize, isGrandWinner);

                return (
                  <div
                    key={prize.id}
                    className={`p-6 rounded-2xl flex flex-col justify-between transition-all ${
                      isGrandWinner
                        ? 'bg-gradient-to-b from-orange-50/70 to-white border-2 border-[#ea580c] shadow-md shadow-orange-500/10 md:-translate-y-1'
                        : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Trophy className={`w-4 h-4 ${isGrandWinner ? 'text-[#ea580c]' : 'text-slate-400'}`} />
                          <span className={`text-xs font-mono font-bold ${isGrandWinner ? 'text-[#ea580c]' : 'text-slate-500'}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        {isGrandWinner && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#ea580c] text-white px-2 py-0.5 rounded shadow-sm">
                            Grand Winner
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{prize.title}</h3>

                      <div className="my-4">
                        <span className={`text-3xl font-extrabold font-mono inline-flex items-center ${isGrandWinner ? 'text-[#ea580c]' : 'text-slate-900'}`}>
                          {amount > 0 ? (
                            <>
                              <NepaliRupee className="w-7 h-7 stroke-[2.5] -mr-0.5 inline-block shrink-0" />
                              {amount.toLocaleString()}
                            </>
                          ) : (
                            'Trophy / Grant'
                          )}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {isGrandWinner && amount > 0 ? 'Grand Cash Bounty' : amount > 0 ? 'Direct Cash Bounty' : 'Award & Incubation Pass'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-4 leading-relaxed whitespace-pre-line">
                        {prize.description}
                      </p>
                    </div>

                    <div className={`pt-4 border-t ${isGrandWinner ? 'border-orange-100' : 'border-slate-100'} flex items-center justify-between text-[11px] font-mono text-slate-400`}>
                      <span>Verified Award</span>
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Specialized Track Awards (Rank 4+) */}
            {orderedPrizes.length > 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orderedPrizes.slice(3).map((prize) => {
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
                      <span className="text-base font-bold font-mono text-[#ea580c] shrink-0 ml-4 inline-flex items-center">
                        {amount > 0 ? (
                          <>
                            <NepaliRupee className="w-4 h-4 stroke-[2.5] -mr-0.5 inline-block shrink-0" />
                            {amount.toLocaleString()}
                          </>
                        ) : (
                          'Special Award'
                        )}
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
