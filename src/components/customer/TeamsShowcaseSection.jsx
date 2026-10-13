import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { Users, Code2, Building2, CheckCircle2, Clock } from 'lucide-react';

export default function TeamsShowcaseSection() {
  const { teams } = useHackathon();

  return (
    <section id="squads" className="py-20 border-b border-slate-800/60 bg-[#080b11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-mono font-semibold uppercase text-emerald-400 mb-2">
            Participants Directory
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Accepted Squads & Projects
          </h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Squads with confirmed registration. Repositories will be made public upon the start of sprint hacking.
          </p>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => {
            const isApproved = team.status === 'approved';
            return (
              <div 
                key={team.id}
                className="p-5 rounded-xl bg-[#0e131f] border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] text-slate-500">{team.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isApproved 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                    }`}>
                      {team.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {team.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{team.college_org || 'Independent Squad'}</span>
                  </div>

                  {team.project_title && (
                    <div className="mt-4 p-3 rounded-lg bg-[#090d15] border border-slate-800 text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-mono block">Working Prototype</span>
                      <strong className="text-slate-200 mt-0.5 block">{team.project_title}</strong>
                      {team.track && (
                        <span className="text-[11px] text-indigo-400 mt-1 block font-mono">
                          {team.track}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {team.github_repo_link ? (
                    <a
                      href={team.github_repo_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors font-mono"
                    >
                      <Code2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Repository</span>
                    </a>
                  ) : (
                    <span className="text-slate-600 font-mono text-[11px]">Repository Hidden</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
