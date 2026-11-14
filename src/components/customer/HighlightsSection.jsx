import React, { useMemo } from 'react';
import { Trophy, Award, Medal, Star, BadgeCheck } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import { formatNpr } from '../../utils/currency';

export default function HighlightsSection() {
  const { prizes = [] } = useHackathon();

  const orderedPrizes = useMemo(() => {
    if (!Array.isArray(prizes)) return [];
    return [...prizes].sort((a, b) => {
      const orderDifference = (Number(a?.order) || 0) - (Number(b?.order) || 0);
      if (orderDifference !== 0) return orderDifference;
      return String(a?.id || '').localeCompare(String(b?.id || ''));
    });
  }, [prizes]);

  // Do not render section if no prizes data received
  if (orderedPrizes.length === 0) return null;

  const pool = orderedPrizes.reduce((acc, p) => acc + (Number(p.prize_money) || 0), 0);
  const podiumPrizes = orderedPrizes.slice(0, 3).map((prize, index) => ({
    ...prize,
    rank: index + 1
  }));
  const podiumLayout = [podiumPrizes[1], podiumPrizes[0], podiumPrizes[2]].filter(Boolean);
  const normalizeTitle = (title) => String(title || '').replace(/\bmistery\b/gi, 'Mystery');

  return (
    <Section id="prizes" tone="dark" py="py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        {/* Centered Heading in Customer Theme */}
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-brand-yellow mb-2">
            <BadgeCheck className="inline-block w-3.5 h-3.5 mr-1 align-[-2px]" />
            Rewards & Honors
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Prizes & Recognition
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Rewarding technical excellence, prototype execution, and impactful innovation.
          </p>

          {pool > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15">
              <Trophy className="w-4 h-4 text-brand-yellow shrink-0" />
              <span className="text-xs font-medium text-slate-300">Total prize pool</span>
              <span className="inline-flex items-center text-xs sm:text-sm font-extrabold text-white">
                    {formatNpr(pool)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {podiumLayout.map((p) => {
            const amount = Number(p.prize_money) || 0;
            const isGrandPrize = p.rank === 1;
            const Icon = isGrandPrize ? Trophy : p.rank === 2 ? Medal : Award;
            const place = String(p.rank).padStart(2, '0');

            return (
              <div
                key={p.id || p.rank}
                className={`relative ${
                  p.rank === 1 ? 'order-1 md:order-2' : p.rank === 2 ? 'order-2 md:order-1' : 'order-3 md:order-3'
                } overflow-hidden rounded-3xl border p-5 sm:p-6 transition-transform hover:-translate-y-1 ${
                  isGrandPrize
                    ? 'md:-translate-y-5 bg-gradient-to-br from-brand-orange/30 to-brand-yellow/10 border-brand-yellow/50 shadow-xl shadow-brand-orange/10'
                    : 'bg-white/[0.07] border-white/15 hover:border-brand-orange/50'
                }`}
              >
                <span className="absolute right-4 top-3 text-5xl font-black text-white/10">{place}</span>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isGrandPrize ? 'bg-brand-yellow text-brand-dark' : 'bg-white/10 text-brand-yellow'
                  }`}>
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                    {p.rank === 1 ? 'First Place' : p.rank === 2 ? 'Second Place' : 'Third Place'}
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-white">{normalizeTitle(p.title)}</h3>
                  <div className={`text-xl font-extrabold mt-3 inline-flex items-center ${
                    isGrandPrize ? 'text-brand-yellow' : 'text-white'
                  }`}>
                    {amount > 0 ? (
                      formatNpr(amount)
                    ) : (
                      <span className="text-xs text-slate-300 font-normal">
                        Trophy & certificate
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <div
                      className="text-xs text-slate-300 mt-3 leading-relaxed prize-html-content"
                      dangerouslySetInnerHTML={{ __html: p.description }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {orderedPrizes.length > 3 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orderedPrizes.slice(3).map((p, idx) => {
              const amount = Number(p.prize_money) || 0;
              return (
                <div key={p.id || idx} className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  'border-white/10 bg-white/[0.05]'
                }`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-brand-blue/20 text-brand-yellow">
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{normalizeTitle(p.title)}</p>
                    <p className="text-xs text-slate-400 inline-flex items-center mt-1">
                      {amount > 0 ? formatNpr(amount) : 'Recognition award'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <a href="#rules" className="text-xs font-semibold text-slate-300 hover:text-brand-yellow">
            View rules and judging details
          </a>
        </div>
      </div>
    </Section>
  );
}
