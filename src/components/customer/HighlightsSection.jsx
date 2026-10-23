import React, { useMemo } from 'react';
import { Trophy, Award, Medal, Star, NepaliRupee } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import { getUserAvatarUrl, DEFAULT_USER_AVATAR } from '../../services/api';
import Section from '../common/Section';
import Card from '../common/Card';

const PRIZE_ICONS = [Trophy, Medal, Award, Star];

export default function HighlightsSection() {
  const { hackathon, prizes = [], organizers = [], isLoadingApi } = useHackathon();

  const orderedPrizes = useMemo(
    () => [...prizes].sort((a, b) => (typeof a.order === 'number' ? a.order : 999) - (typeof b.order === 'number' ? b.order : 999)),
    [prizes]
  );
  const people = useMemo(
    () => [...organizers].sort((a, b) => (typeof a.order === 'number' ? a.order : 999) - (typeof b.order === 'number' ? b.order : 999)).slice(0, 4),
    [organizers]
  );

  const pool =
    hackathon?.total_prize !== undefined && hackathon?.total_prize !== null
      ? Number(hackathon.total_prize) || 0
      : orderedPrizes.reduce((acc, p) => acc + (Number(p.prize_money) || 0), 0);

  if (orderedPrizes.length === 0 && people.length === 0 && !isLoadingApi) return null;

  return (
    <Section id="prizes" tone="tint" py="py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {orderedPrizes.length > 0 && (
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Trophy className="w-10 h-10 text-brand-blue shrink-0" strokeWidth={1.4} />
              <div>
                <h2 className="text-2xl font-extrabold text-ink">Prizes & recognition</h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center flex-wrap gap-x-1">
                  {pool > 0 ? (
                    <>
                      <span>Prize pool:</span>
                      <span className="inline-flex items-center font-bold text-ink">
                        <NepaliRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                        {pool.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    'We celebrate innovation, impact and teamwork.'
                  )}
                </p>
              </div>
            </div>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {orderedPrizes.slice(0, 3).map((p, idx) => {
                const Icon = PRIZE_ICONS[idx % PRIZE_ICONS.length];
                const amount = Number(p.prize_money) || 0;
                return (
                  <li key={p.id} className="flex sm:flex-col items-start gap-3 sm:gap-2">
                    <Icon className="w-7 h-7 text-brand-blue shrink-0" strokeWidth={1.5} />
                    <div>
                      <div className="text-sm font-bold text-ink leading-snug">{p.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 inline-flex items-center">
                        {amount > 0 ? (
                          <>
                            <NepaliRupee className="w-3 h-3 stroke-[2.5]" />
                            {amount.toLocaleString()}
                          </>
                        ) : (
                          'Trophy and a pass'
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {(people.length > 0 || isLoadingApi) && (
          <Card id="organizers" className="p-6 scroll-mt-20">
            <h2 className="text-2xl font-extrabold text-ink">Meet the organizers</h2>
            <p className="text-sm text-slate-500 mt-1">The people running the event. Find us on the day.</p>

            <ul className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {people.map((org) => {
                const u = org.user || {};
                const name = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Organizer';
                const img = getUserAvatarUrl(u.profile_picture || org.profile_picture || org.image);
                return (
                  <li key={org.id} className="text-center sm:text-left">
                    <img
                      src={img}
                      alt={name}
                      onError={(e) => { e.currentTarget.src = DEFAULT_USER_AVATAR; }}
                      className="w-14 h-14 rounded-full object-cover mx-auto sm:mx-0 bg-slate-100"
                    />
                    <div className="mt-2 text-sm font-bold text-ink leading-snug">{name}</div>
                    <div className="text-xs text-slate-500">{org.designation || org.position || 'Organizer'}</div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </Section>
  );
}
