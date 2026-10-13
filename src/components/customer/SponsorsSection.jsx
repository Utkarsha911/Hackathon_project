import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { ExternalLink, MapPin } from 'lucide-react';

export default function SponsorsSection() {
  const { sponsors } = useHackathon();

  return (
    <section id="sponsors" className="py-20 border-b border-slate-800/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-mono font-semibold uppercase text-indigo-400 mb-2">
            Partners
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ecosystem Backers & API Partners
          </h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Leading labs and infrastructure providers powering computing clusters, mentor hours, and incubation pipelines for participants.
          </p>
        </div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="p-6 rounded-2xl bg-[#0e131f] border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={sponsor.logo_url} 
                      alt={sponsor.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 bg-slate-900"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {sponsor.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{sponsor.location}</span>
                      </div>
                    </div>
                  </div>

                  {sponsor.website_url && (
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors"
                      title="Website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {sponsor.description}
                </p>

                {sponsor.service && (
                  <div className="mt-4 p-3 rounded-lg bg-[#090d15] border border-slate-800 text-xs text-slate-300">
                    <span className="font-semibold text-indigo-400">Sponsored Resources:</span> {sponsor.service}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>{sponsor.contact_email}</span>
                <span>{sponsor.id}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
