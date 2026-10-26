import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import Card from '../common/Card';
import { ChevronDown } from 'lucide-react';

export default function FaqSection() {
  const { faqs = [], isLoadingApi } = useHackathon();
  const [openId, setOpenId] = useState(null);

  const activeOpenId = openId !== null ? openId : faqs[0]?.id;

  const toggle = (id) => {
    setOpenId(activeOpenId === id ? false : id);
  };

  if (!Array.isArray(faqs) || faqs.length === 0) {
    return null;
  }

  return (
    <Section id="faq" tone="white" py="py-20" width="max-w-4xl">

      <SectionHeading label="FAQ" title="Stuff people ask us" className="mb-10">
        Can't find your answer? Scroll down and message us.
      </SectionHeading>

      {/* Skeleton while initial load */}
      {isLoadingApi && faqs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse space-y-2">
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        /* FAQ Accordion */
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = activeOpenId === faq.id;
            return (
              <Card
                key={faq.id}
                highlight={isOpen}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base text-ink cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <div
                    className={`shrink-0 text-ink transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-slate-700 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

    </Section>
  );
}
