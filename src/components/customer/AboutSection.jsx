import React from 'react';
import { Lightbulb, Rocket, Users } from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import { formatRegistrationFeeType } from '../../utils/registration';

const PILLARS = [
  { icon: Users, title: 'Collaborate', text: 'Work in diverse teams' },
  { icon: Rocket, title: 'Build', text: 'Turn ideas into solutions' },
  { icon: Lightbulb, title: 'Make an impact', text: 'Create change for Nepal' },
];

export default function AboutSection() {
  const { hackathon } = useHackathon();
  const h = hackathon || {};
  if (!h.title) return null;

  return (
    <Section id="about" py="py-16 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <SectionHeading label="About the event" title={`What is ${h.title || 'the hackathon'}?`} className="mb-4" />

          <div className="mt-8 grid grid-cols-3 divide-x divide-slate-200 max-w-lg">
            {PILLARS.map((p) => (
              <div key={p.title} className="px-3 first:pl-0 text-center first:text-left">
                <p.icon className="w-8 h-8 text-brand-blue mb-2 mx-auto first:mx-0" strokeWidth={1.5} />
                <div className="text-sm font-bold text-ink">{p.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden min-h-[240px] bg-gradient-to-br from-brand-dark via-brand-navy to-brand-blue p-8 flex flex-col justify-center text-white">
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 120 L70 50 L110 80 L190 10 L260 85 L310 45 L400 110 L400 120 Z" fill="rgba(255,255,255,0.18)" />
            <path d="M0 120 L90 80 L150 100 L230 55 L320 105 L400 75 L400 120 Z" fill="rgba(5,11,26,0.35)" />
          </svg>
          <p className="relative text-base sm:text-lg font-medium leading-relaxed max-w-md">
            {h.description || 'Technology is most powerful when it brings people together to solve real problems.'}
          </p>
          <p className="relative mt-4 text-sm font-semibold text-blue-200">— {h.title || 'BIC Hackathon'}</p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-orange-200 bg-orange-50/60 p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Registration fee</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {Number(h.registration_fee) > 0
                ? `NPR ${Number(h.registration_fee).toLocaleString()}`
                : 'Free entry'}
            </p>
          </div>
          {Number(h.registration_fee) > 0 && (
            <span className="text-sm font-semibold text-orange-700">
              {formatRegistrationFeeType(h.registration_fee_type)}
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
