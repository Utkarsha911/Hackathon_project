import React, { useMemo } from 'react';
import { Trophy, Award, Medal, Star, NepaliRupee } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import { getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';
import Section from '../common/Section';
import Card from '../common/Card';

const PRIZE_ICONS = [Trophy, Medal, Award, Star];

export default function HighlightsSection() {
  const { hackathon, prizes = [] } = useHackathon();

  // Keep prizes in their defined order (e.g. order 1, 2, 4...)
  const orderedPrizes = useMemo(() => {
    if (!Array.isArray(prizes)) return [];
    return [...prizes].sort((a, b) => {
      const orderA = typeof a?.order === 'number' ? a.order : 999;
      const orderB = typeof b?.order === 'number' ? b.order : 999;
      return orderA - orderB;
    });
  }, [prizes]);

  // Find the highest prize money value to highlight
  const maxPrizeMoney = useMemo(() => {
    if (!orderedPrizes.length) return 0;
    return Math.max(...orderedPrizes.map((p) => Number(p?.prize_money) || 0));
  }, [orderedPrizes]);

  // Do not render section if no prizes data received
  if (orderedPrizes.length === 0) return null;

  const pool =
    hackathon?.total_prize !== undefined && hackathon?.total_prize !== null
      ? Number(hackathon.total_prize) || 0
      : orderedPrizes.reduce((acc, p) => acc + (Number(p.prize_money) || 0), 0);

  return (
    <Section id="prizes" tone="tint" py="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Centered Heading in Customer Theme */}
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-2">
            Rewards & Honors
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            Prizes & Recognition
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Rewarding technical excellence, prototype execution, and impactful innovation.
          </p>

          {pool > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-blue/20 shadow-2xs">
              <Trophy className="w-4 h-4 text-brand-blue shrink-0" />
              <span className="text-xs font-medium text-slate-500">Total Prize Pool:</span>
              <span className="inline-flex items-center text-xs sm:text-sm font-extrabold text-ink">
                <NepaliRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                {pool.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Smaller Cards in Centered Grid */}
        <div
          className={`grid grid-cols-1 ${
            orderedPrizes.length === 2
              ? 'sm:grid-cols-2 max-w-xl mx-auto'
              : 'sm:grid-cols-2 md:grid-cols-3'
          } gap-3.5`}
        >
          {orderedPrizes.map((p, idx) => {
            const amount = Number(p.prize_money) || 0;
            const isHighest = amount > 0 && amount === maxPrizeMoney;
            const Icon = isHighest ? Trophy : PRIZE_ICONS[idx % PRIZE_ICONS.length];

            return (
              <div
                key={p.id || idx}
                className={`flex items-start gap-3 p-4 rounded-2xl transition-all ${
                  isHighest
                    ? 'bg-brand-tint/80 border border-brand-blue/40 shadow-xs ring-1 ring-brand-blue/20'
                    : 'bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isHighest ? 'bg-brand-blue text-white shadow-xs' : 'bg-slate-100 text-brand-blue'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-ink leading-snug">
                      {p.title}
                    </span>
                    {isHighest && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-brand-blue text-white">
                        Top Prize
                      </span>
                    )}
                  </div>

                  <div
                    className={`text-xs sm:text-sm font-bold mt-1 inline-flex items-center ${
                      isHighest ? 'text-brand-blue' : 'text-slate-800'
                    }`}
                  >
                    {amount > 0 ? (
                      <>
                        <NepaliRupee className="w-3 h-3 stroke-[2.5]" />
                        {amount.toLocaleString()}
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-normal">
                        Trophy & certificate
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
