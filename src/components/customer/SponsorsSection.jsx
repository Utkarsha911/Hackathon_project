import React, { useState, useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import Section from '../common/Section';
import {
  ExternalLink,
  MapPin,
  Award,
  BadgeCheck
} from 'lucide-react';

// Generate Monogram Initials
function getInitials(name = '') {
  if (!name) return 'SP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Tier Priority Order
function getTierPriority(tierName = '') {
  const t = String(tierName || '').toLowerCase().trim();
  if (t.includes('title') || t.includes('headline')) return 1;
  if (t.includes('premium') || t.includes('platinum')) return 2;
  if (t.includes('gold')) return 3;
  if (t.includes('silver')) return 4;
  if (t.includes('bronze')) return 5;
  return 6;
}

// Professional Tier Palette (Solid Opaque Badges, Clean Left Border Accents)
function getTierConfig(tierName = '') {
  const t = String(tierName || '').toLowerCase().trim();
  
  if (t.includes('title') || t.includes('headline')) {
    return {
      label: tierName || 'Title Partner',
      badgeClass: 'bg-brand-blue text-white',
      borderAccent: 'border-l-[#ea580c]',
      avatarGradient: 'from-[#ea580c] to-[#c2410c]',
      Icon: Award
    };
  }
  
  if (t.includes('premium') || t.includes('platinum')) {
    return {
      label: tierName || 'Platinum Partner',
      badgeClass: 'bg-indigo-600 text-white',
      borderAccent: 'border-l-indigo-600',
      avatarGradient: 'from-indigo-600 to-indigo-800',
      Icon: BadgeCheck
    };
  }
  
  if (t.includes('gold')) {
    return {
      label: tierName || 'Gold Partner',
      badgeClass: 'bg-brand-red text-slate-950 font-black',
      borderAccent: 'border-l-amber-500',
      avatarGradient: 'from-amber-500 to-amber-700',
      Icon: Award
    };
  }
  
  if (t.includes('silver')) {
    return {
      label: tierName || 'Silver Partner',
      badgeClass: 'bg-slate-700 text-white',
      borderAccent: 'border-l-slate-400',
      avatarGradient: 'from-slate-600 to-slate-800',
      Icon: BadgeCheck
    };
  }

  return {
    label: tierName || 'Official Partner',
    badgeClass: 'bg-slate-800 text-white',
    borderAccent: 'border-l-slate-300',
    avatarGradient: 'from-slate-800 to-slate-900',
    Icon: BadgeCheck
  };
}

// Seamless infinite loop helper
function getMarqueeList(items = []) {
  if (!items.length) return [];
  let list = [...items];
  while (list.length < 8) {
    list = [...list, ...items];
  }
  return [...list, ...list];
}

// Executive Sponsor Card Component
function SponsorCard({ sponsor, sIdx, brokenImages, setBrokenImages }) {
  const rawLogo = sponsor.logo || sponsor.logo_url;
  const logoSrc = rawLogo ? getMediaUrl(rawLogo) : null;
  const isImageBroken = Boolean(brokenImages[`${sponsor.id}-${sIdx}`]);
  const showLogoImage = logoSrc && !isImageBroken;

  const tierName = sponsor.sponsor_type_name || sponsor.tier || 'Official Partner';
  const tierConfig = getTierConfig(tierName);
  const websiteUrl = sponsor.website_link || sponsor.website_url;
  const initials = getInitials(sponsor.name);

  const subtitle = sponsor.service || sponsor.description || null;

  return (
    <div
      className={`w-72 sm:w-80 shrink-0 group relative rounded-2xl bg-white border border-slate-200/90 border-l-4 ${tierConfig.borderAccent} p-3 sm:p-3.5 shadow-2xs hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3.5 mx-2 sm:mx-2.5 select-none overflow-hidden`}
    >
      {/* Logo Box */}
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:border-slate-200 transition-colors">
        {showLogoImage ? (
          <img
            src={logoSrc}
            alt={sponsor.name}
            className="w-full h-full object-contain filter group-hover:scale-105 transition-transform"
            onError={() => setBrokenImages(prev => ({ ...prev, [`${sponsor.id}-${sIdx}`]: true }))}
          />
        ) : (
          <div className={`w-full h-full rounded-lg bg-gradient-to-br ${tierConfig.avatarGradient} text-white flex items-center justify-center font-black text-xs tracking-wider select-none shadow-xs`}>
            {initials}
          </div>
        )}
      </div>

      {/* Info Details */}
      <div className="min-w-0 flex-1">
        {/* Tier Badge & Location Row */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${tierConfig.badgeClass} shadow-2xs`}>
            {tierName}
          </span>
          {sponsor.location && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
              <MapPin className="w-2.5 h-2.5 text-brand-blue shrink-0" />
              <span className="truncate">{sponsor.location}</span>
            </span>
          )}
        </div>

        {/* Sponsor / Organization Name */}
        <h4 className="text-xs sm:text-sm font-bold text-ink group-hover:text-brand-blue transition-colors truncate leading-tight">
          {sponsor.name}
        </h4>

        {/* Contribution or Subtitle */}
        {subtitle ? (
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5 leading-tight" title={subtitle}>
            {subtitle}
          </p>
        ) : (
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate mt-0.5 leading-tight">
            Official Partner
          </p>
        )}
      </div>

      {/* Discrete External Link Button */}
      {websiteUrl && (
        <a
          href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
          target="_blank"
          rel="noreferrer"
          className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-orange-50 text-slate-400 group-hover:text-brand-blue border border-slate-200/60 group-hover:border-orange-200 flex items-center justify-center transition-all shrink-0 cursor-pointer"
          title="Visit Website"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

export default function SponsorsSection() {
  const { hackathon, sponsors, isLoadingApi } = useHackathon();
  const [brokenImages, setBrokenImages] = useState({});

  // Normalize data from current_hackathon API sponsor_packages or fallback to context sponsors
  const allSponsors = useMemo(() => {
    let list = [];
    if (Array.isArray(hackathon?.sponsor_packages) && hackathon.sponsor_packages.length > 0) {
      list = hackathon.sponsor_packages
        .filter(item => item && item.organization)
        .map(item => ({
          ...item.organization,
          sponsor_package_id: item.id,
          sponsor_type_name: item.sponsor_type_name || 'Official Partner',
          tier: item.sponsor_type_name || 'Official Partner',
          tier_order: item.order ?? item.sponsor_type_order ?? getTierPriority(item.sponsor_type_name)
        }));
    } else if (Array.isArray(sponsors)) {
      list = sponsors.map(s => ({
        ...s,
        tier: s.tier || 'Official Partner',
        sponsor_type_name: s.sponsor_type_name || s.tier || 'Official Partner',
        tier_order: getTierPriority(s.tier || s.sponsor_type_name)
      }));
    }

    // Sort by tier priority
    list.sort((a, b) => (a.tier_order || 99) - (b.tier_order || 99));
    return list;
  }, [hackathon?.sponsor_packages, sponsors]);

  // Interleave sponsors into Row 1 and Row 2 for balanced visual hierarchy
  const { row1List, row2List } = useMemo(() => {
    if (!allSponsors.length) return { row1List: [], row2List: [] };

    if (allSponsors.length === 1) {
      return {
        row1List: getMarqueeList(allSponsors),
        row2List: getMarqueeList(allSponsors)
      };
    }

    const r1 = [];
    const r2 = [];
    allSponsors.forEach((item, idx) => {
      if (idx % 2 === 0) r1.push(item);
      else r2.push(item);
    });

    return {
      row1List: getMarqueeList(r1.length > 0 ? r1 : allSponsors),
      row2List: getMarqueeList(r2.length > 0 ? r2 : allSponsors)
    };
  }, [allSponsors]);

  if (!Array.isArray(allSponsors) || allSponsors.length === 0) {
    return null;
  }

  return (
    <Section id="sponsors" tone="tint" py="py-12" width="max-w-7xl" className="overflow-hidden">
      
      {/* Single-Screen Header - Clean & Focused */}
      <div className="text-center max-w-xl mx-auto mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          Our sponsors
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          They paid for the prizes, the food and the wifi.
        </p>
      </div>

      {/* Dual-Track Smooth Moving Conveyor Belts (Fits in Single Screen) */}
      <div className="space-y-3 relative">
        {/* Row 1: Moving Left */}
        {row1List.length > 0 && (
          <div className="relative w-full overflow-hidden py-1">
            <div className="animate-marquee-left">
              {row1List.map((sponsor, sIdx) => (
                <SponsorCard
                  key={`r1-${sponsor.id || sponsor.sponsor_package_id}-${sIdx}`}
                  sponsor={sponsor}
                  sIdx={`r1-${sIdx}`}
                  brokenImages={brokenImages}
                  setBrokenImages={setBrokenImages}
                />
              ))}
            </div>
          </div>
        )}

        {/* Row 2: Moving Right */}
        {row2List.length > 0 && (
          <div className="relative w-full overflow-hidden py-1">
            <div className="animate-marquee-right">
              {row2List.map((sponsor, sIdx) => (
                <SponsorCard
                  key={`r2-${sponsor.id || sponsor.sponsor_package_id}-${sIdx}`}
                  sponsor={sponsor}
                  sIdx={`r2-${sIdx}`}
                  brokenImages={brokenImages}
                  setBrokenImages={setBrokenImages}
                />
              ))}
            </div>
          </div>
        )}
      </div>

    </Section>
  );
}
