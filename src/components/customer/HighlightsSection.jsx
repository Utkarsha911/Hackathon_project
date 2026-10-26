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
    <Section id="prizes" tone="tint" py="py-16">
      <Card className="p-6 sm:p-8 max-w-5xl mx-auto shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#ea580c] flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-ink">Prizes & recognition</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Rewarding technical excellence, prototype execution, and impactful innovation.
              </p>
            </div>
          </div>

          {pool > 0 && (
            <div className="sm:text-right px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200/80 inline-block sm:block">
              <span className="block text-[11px] font-bold text-orange-900 uppercase tracking-wider">Total Prize Pool</span>
              <span className="inline-flex items-center text-xl font-extrabold text-[#ea580c]">
                <NepaliRupee className="w-4 h-4 stroke-[2.5]" />
                {pool.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <ul className={`mt-6 grid grid-cols-1 ${orderedPrizes.length === 2 ? 'sm:grid-cols-2' : orderedPrizes.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 md:grid-cols-3'} gap-4`}>
          {orderedPrizes.map((p, idx) => {
            const amount = Number(p.prize_money) || 0;
            const isHighest = amount > 0 && amount === maxPrizeMoney;
            const Icon = isHighest ? Trophy : PRIZE_ICONS[idx % PRIZE_ICONS.length];
            return (
              <li
                key={p.id || idx}
                className={`flex items-start gap-3.5 p-4 rounded-2xl transition ${
                  isHighest
                    ? 'bg-orange-50/90 border-2 border-orange-300/90 shadow-sm ring-2 ring-orange-500/10'
                    : 'bg-slate-50/80 border border-slate-200/90'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHighest ? 'bg-[#ea580c] text-white shadow-xs' : 'bg-brand-tint text-brand-blue'}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-ink leading-snug">{p.title}</span>
                    {isHighest && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-[#ea580c] text-white">
                        Top Prize
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-bold mt-1 inline-flex items-center ${isHighest ? 'text-[#ea580c]' : 'text-slate-800'}`}>
                    {amount > 0 ? (
                      <>
                        <NepaliRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                        {amount.toLocaleString()}
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-normal">Trophy & certificate</span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </Section>
  );
}
