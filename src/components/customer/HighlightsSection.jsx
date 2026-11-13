import React, { useMemo } from 'react';
import { Trophy, Award, Medal, Star, NepaliRupee, BadgeCheck } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';

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

  // Do not render section if no prizes data received
  if (orderedPrizes.length === 0) return null;

  const pool =
    hackathon?.total_prize !== undefined && hackathon?.total_prize !== null
      ? Number(hackathon.total_prize) || 0
      : orderedPrizes.reduce((acc, p) => acc + (Number(p.prize_money) || 0), 0);

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
                <NepaliRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                {pool.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {orderedPrizes.slice(0, 3).map((p, idx) => {
            const amount = Number(p.prize_money) || 0;
            const Icon = idx === 0 ? Trophy : idx === 1 ? Medal : Award;
            const place = idx === 0 ? '01' : idx === 1 ? '02' : '03';

            return (
              <div
                key={p.id || idx}
                className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-transform hover:-translate-y-1 ${
                  idx === 0
                    ? 'md:-translate-y-5 bg-gradient-to-br from-brand-orange/30 to-brand-yellow/10 border-brand-yellow/50 shadow-xl shadow-brand-orange/10'
                    : 'bg-white/[0.07] border-white/15 hover:border-brand-orange/50'
                }`}
              >
                <span className="absolute right-4 top-3 text-5xl font-black text-white/10">{place}</span>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    idx === 0 ? 'bg-brand-yellow text-brand-dark' : 'bg-white/10 text-brand-yellow'
                  }`}>
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                    {idx === 0 ? 'Grand Prize' : idx === 1 ? 'Runner-up' : 'Third Place'}
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-white">{p.title}</h3>
                  <div className={`text-xl font-extrabold mt-3 inline-flex items-center ${
                    idx === 0 ? 'text-brand-yellow' : 'text-white'
                  }`}>
                    {amount > 0 ? (
                      <>
                        <NepaliRupee className="w-4 h-4 stroke-[2.5]" />
                        {amount.toLocaleString()}
                      </>
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
                <div key={p.id || idx} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/20 text-brand-yellow flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 inline-flex items-center mt-1">
                      {amount > 0 ? <><NepaliRupee className="w-3 h-3" />{amount.toLocaleString()}</> : 'Recognition award'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
