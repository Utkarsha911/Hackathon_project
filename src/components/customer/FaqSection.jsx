import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function FaqSection() {
  const { faqs = [], isLoadingApi } = useHackathon();
  const [openId, setOpenId] = useState(null);

  const activeOpenId = openId !== null ? openId : faqs[0]?.id;

  const toggle = (id) => {
    setOpenId(activeOpenId === id ? false : id);
  };

  if (faqs.length === 0 && !isLoadingApi) {
    return null;
  }

  return (
    <section id="faq" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-[#ea580c] mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-[#ea580c]" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Everything you need to know about eligibility, equipment, food, mentors, and prize dispersal.
          </p>
        </div>

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
                <div
                  key={faq.id}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-xs ${
                    isOpen ? 'border-[#ea580c] shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:text-[#ea580c] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <div
                      className={`p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#ea580c] border-orange-300' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 whitespace-pre-line">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
