import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Target, Copy, Check, FolderCode } from 'lucide-react';

export default function ChallengesSection() {
  const { challenges, isLoadingApi } = useHackathon();
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <section id="tracks" className="py-24 bg-[#fafafa] border-b border-gray-200/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="bic-section-label mb-2.5">Hackathon Tracks</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Problem Statements & Challenges
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Registered squads must select one problem statement from the following official briefs.
            All code must be committed to your public GitHub repo before Day 3 code freeze.
          </p>
        </div>

        {/* Loading Skeletons */}
        {isLoadingApi && challenges.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 p-8 rounded-2xl animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                <div className="h-4 bg-slate-200 rounded w-5/6 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Challenges Grid - Clean layout without fake static fallback data */}
        {challenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge, idx) => {
              const statement = challenge.problem_statement || '';
              const isCopied = copiedId === challenge.id;

              return (
                <div
                  key={challenge.id}
                  className="group relative bg-white border border-slate-200/90 hover:border-coral-400/60 p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-lg"
                >
                  <div>
                    {/* Header: Track index badge and copy button */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-coral-50 border border-coral-200 text-coral-700 font-mono text-xs font-bold">
                        <Target className="w-3.5 h-3.5 text-coral-600" />
                        <span>Problem Statement #{String(idx + 1).padStart(2, '0')}</span>
                      </div>

                      <button
                        onClick={() => handleCopy(challenge.id, statement)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-coral-400 text-slate-600 hover:text-slate-900 transition-colors text-xs font-mono"
                        title="Copy Statement to Clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 text-[11px] font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Problem Statement Body */}
                    <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
                      {statement}
                    </p>
                  </div>

                  {/* Footer Bar */}
                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span className="inline-flex items-center gap-1.5 text-coral-700">
                      <Target className="w-3.5 h-3.5 text-coral-500" />
                      <span>Sprint Eligible</span>
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]" title={challenge.id}>
                      ID: {challenge.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isLoadingApi ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <FolderCode className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No Problem Statements Loaded</h3>
            <p className="text-xs text-slate-500">Problem statements will synchronize when connected to the backend API.</p>
          </div>
        ) : null}

      </div>
    </section>
  );
}
