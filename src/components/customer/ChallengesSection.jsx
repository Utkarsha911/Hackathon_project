import React from 'react';
import { Brain, ShieldCheck, Building2, Landmark, Leaf, Target } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import Card from '../common/Card';

const STYLES = [
  { icon: Brain, bg: 'bg-brand-navy' },
  { icon: ShieldCheck, bg: 'bg-brand-tint0' },
  { icon: Building2, bg: 'bg-brand-orange' },
  { icon: Landmark, bg: 'bg-brand-red' },
  { icon: Leaf, bg: 'bg-brand-gold' },
  { icon: Target, bg: 'bg-brand-coral' },
];

export default function ChallengesSection() {
  const { challenges = [], isLoadingApi } = useHackathon();

  if (challenges.length === 0 && !isLoadingApi) return null;

  return (
    <Section id="tracks" tone="tint">
      <SectionHeading label="Competition tracks" title="Choose your track">
        Pick a problem below and build something that matters.
      </SectionHeading>

      {isLoadingApi && challenges.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-5 h-56 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {challenges.map((c, idx) => {
            const st = STYLES[idx % STYLES.length];
            return (
              <Card key={c.id} hover className="p-5">
                <div className={`w-14 h-14 rounded-full ${st.bg} text-white flex items-center justify-center mb-4`}>
                  <st.icon className="w-7 h-7" strokeWidth={1.6} />
                </div>
                <h3 className="font-bold text-ink leading-snug">{c.track}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-4">{c.problem_statement}</p>
                {c.sponsor_name && <p className="mt-3 text-[11px] text-slate-400">Backed by {c.sponsor_name}</p>}
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );
}
