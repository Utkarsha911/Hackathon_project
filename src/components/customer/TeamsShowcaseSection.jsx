import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Code2, Building2 } from 'lucide-react';

export default function TeamsShowcaseSection() {
  const { teams } = useHackathon();

  return (
    <section id="squads" className="py-20 bg-[#fafafa] border-b border-gray-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="bic-section-label mb-2">Participants Directory</div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Accepted Squads & Projects
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Squads with confirmed registration. Repositories will be made public upon the
            start of sprint hacking.
          </p>
        </div>

        {/* Teams Grid */}
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team) => {
              const status = (team.status || 'submitted').toLowerCase();
              const isApproved = status === 'approved';
              const isDisqualified = status === 'disqualified';
              const isRejected = status === 'rejected';

              return (
                <div
                  key={team.id}
                  className="bg-white border border-slate-200/90 rounded-2xl bic-card-hover p-5 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[11px] text-slate-400">{team.id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDisqualified
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isRejected
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {team.status || 'submitted'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{team.name}</h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{team.college_name || team.college_org || 'Independent Squad'}</span>
                    </div>

                    {team.project_title && (
                      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                        <span className="text-slate-400 text-[10px] uppercase font-mono block">Working Prototype</span>
                        <strong className="text-slate-800 mt-0.5 block font-semibold">{team.project_title}</strong>
                        {team.track && (
                          <span className="text-[11px] text-coral-600 mt-1 block font-mono font-medium">
                            {team.track}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {team.github_repo_link ? (
                      <a
                        href={team.github_repo_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-coral-600 transition-colors font-mono"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Repository</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Repository Hidden</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500">Squad rosters will appear here upon registration and approval.</p>
          </div>
        )}

      </div>
    </section>
  );
}
