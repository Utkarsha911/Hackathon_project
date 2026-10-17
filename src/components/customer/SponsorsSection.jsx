import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { ExternalLink, MapPin } from 'lucide-react';

export default function SponsorsSection() {
  const { sponsors, isLoadingApi } = useHackathon();

  if (sponsors.length === 0 && !isLoadingApi) {
    return null;
  }

  return (
    <section id="sponsors" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <div className="bic-section-label mb-2">Partners</div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ecosystem Backers & Industry Partners
          </h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            Leading labs and infrastructure providers powering computing clusters, mentor hours,
            and incubation pipelines for participants.
          </p>
        </div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sponsors.map((sponsor) => {
            const tierLabels = {
              title_sponsor: 'Title Sponsor',
              entitle_sponsor: 'Entitle Sponsor',
              platinum: 'Platinum Partner',
              gold: 'Gold Partner',
              silver: 'Silver Partner',
            };
            const tierStyle = {
              title_sponsor: 'bg-coral-50 text-coral-700 border-coral-200',
              entitle_sponsor: 'bg-amber-50 text-amber-700 border-amber-200',
              platinum: 'bg-slate-100 text-slate-800 border-slate-300',
              gold: 'bg-yellow-50 text-yellow-800 border-yellow-200',
            };

            return (
              <div
                key={sponsor.id}
                className="bg-white border border-slate-200/90 rounded-2xl bic-card-hover p-6 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      {sponsor.logo_url ? (
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 items-center justify-center text-coral-600 text-xl font-bold"
                        style={{ display: sponsor.logo_url ? 'none' : 'flex' }}
                      >
                        {sponsor.name?.[0] || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{sponsor.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {sponsor.tier && (
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tierStyle[sponsor.tier] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {tierLabels[sponsor.tier] || sponsor.tier.toUpperCase()}
                            </span>
                          )}
                          {(sponsor.location || sponsor.phone_number1) && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{sponsor.location || sponsor.phone_number1}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {sponsor.website_url && (
                      <a
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-coral-600 hover:border-coral-300 transition-colors"
                        title="Website"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{sponsor.description}</p>

                {sponsor.service && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <span className="font-semibold text-coral-700">Sponsored Resources: </span>
                    {sponsor.service}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{sponsor.contact_email}</span>
                <span>{sponsor.id}</span>
              </div>
            </div>
          );
        })}
        </div>

      </div>
    </section>
  );
}
