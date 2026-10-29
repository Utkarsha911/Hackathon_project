import React, { useState, useMemo } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';
import Section from '../common/Section';

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
  if (t.includes('basic') || t.includes('bronze')) return 5;
  return 6;
}

// Clean and capitalize tier/package label (e.g. "premium" -> "Premium", "basic" -> "Basic")
function formatTierLabel(rawTier = '') {
  if (!rawTier) return null;
  const clean = String(rawTier).replace(/_/g, ' ').trim();
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Subtle badge styling on the right side
function getTierBadgeClass(rawTier = '') {
  const t = String(rawTier || '').toLowerCase();
  if (t.includes('title') || t.includes('headline')) {
    return 'bg-orange-50 text-[#ea580c] border-orange-200/80';
  }
  if (t.includes('premium') || t.includes('platinum')) {
    return 'bg-purple-50 text-purple-700 border-purple-200/80';
  }
  if (t.includes('gold')) {
    return 'bg-amber-50 text-amber-700 border-amber-200/80';
  }
  if (t.includes('silver')) {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }
  if (t.includes('basic') || t.includes('bronze')) {
    return 'bg-blue-50 text-blue-700 border-blue-200/80';
  }
  return 'bg-slate-50 text-slate-600 border-slate-200/80';
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

// Minimalist Partner / Sponsor Card matching modern integrations showcase
function SponsorCard({ sponsor, sIdx, brokenImages, setBrokenImages }) {
  const rawLogo = sponsor.logo || sponsor.logo_url;
  const logoSrc = rawLogo ? getMediaUrl(rawLogo) : null;
  const isImageBroken = Boolean(brokenImages[`${sponsor.id}-${sIdx}`]);
  const showLogoImage = logoSrc && !isImageBroken;

  const websiteUrl = sponsor.website_link || sponsor.website_url;
  const initials = getInitials(sponsor.name);
  const tierName = sponsor.sponsor_type_name || sponsor.tier || sponsor.type || '';
  const tierLabel = formatTierLabel(tierName);
  const tierBadgeClass = getTierBadgeClass(tierName);
  const subtitle = sponsor.service || sponsor.description || sponsor.location || 'Partner';

  const CardElement = websiteUrl ? 'a' : 'div';
  const cardProps = websiteUrl
    ? {
        href: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
        target: '_blank',
        rel: 'noreferrer'
      }
    : {};

  return (
    <CardElement
      {...cardProps}
      className="w-64 sm:w-72 shrink-0 group rounded-2xl bg-white border border-slate-200/70 p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3 mx-2 select-none overflow-hidden no-underline cursor-pointer"
    >
      {/* Left: Squircle Logo Box */}
      <div className="w-11 h-11 rounded-xl bg-slate-100/90 border border-slate-200/60 p-2 flex items-center justify-center shrink-0 group-hover:bg-slate-50 transition-colors">
        {showLogoImage ? (
          <img
            src={logoSrc}
            alt={sponsor.name}
            className="w-full h-full object-contain filter group-hover:scale-105 transition-transform"
            onError={() => setBrokenImages((prev) => ({ ...prev, [`${sponsor.id}-${sIdx}`]: true }))}
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs select-none">
            {initials}
          </div>
        )}
      </div>

      {/* Middle: Name and Subtitle */}
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-blue transition-colors truncate leading-tight">
          {sponsor.name}
        </h4>
        <p className="text-xs text-slate-500 font-normal truncate mt-0.5 leading-tight">
          {subtitle}
        </p>
      </div>

      {/* Right: Tier / Package Badge (e.g. "Premium", "Basic", "Gold") */}
      {tierLabel && (
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap leading-normal ${tierBadgeClass}`}
        >
          {tierLabel}
        </span>
      )}
    </CardElement>
  );
}

export default function SponsorsSection() {
  const { hackathon, sponsors } = useHackathon();
  const [brokenImages, setBrokenImages] = useState({});

  // Normalize data from current_hackathon API sponsor_packages or fallback to context sponsors
  const allSponsors = useMemo(() => {
    let list = [];
    if (Array.isArray(hackathon?.sponsor_packages) && hackathon.sponsor_packages.length > 0) {
      list = hackathon.sponsor_packages
        .filter((item) => item && item.organization)
        .map((item) => ({
          ...item.organization,
          sponsor_package_id: item.id,
          sponsor_type_name: item.sponsor_type_name || 'Partner',
          tier: item.sponsor_type_name || 'Partner',
          tier_order: item.order ?? item.sponsor_type_order ?? getTierPriority(item.sponsor_type_name)
        }));
    } else if (Array.isArray(sponsors)) {
      list = sponsors.map((s) => ({
        ...s,
        tier: s.tier || s.sponsor_type_name || s.type || 'Partner',
        sponsor_type_name: s.sponsor_type_name || s.tier || s.type || 'Partner',
        tier_order: getTierPriority(s.tier || s.sponsor_type_name || s.type)
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
      {/* Centered Heading in Customer Theme */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-2">
          Partners & Sponsors
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          Our Sponsors
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Supported by visionary partners powering innovation and opportunities for hackers.
        </p>
      </div>

      {/* Dual-Track Smooth Moving Conveyor Belts (Fits in Single Screen) */}
      <div className="space-y-3 relative">
        {/* Soft edge gradient fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-brand-tint to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-l from-brand-tint to-transparent" />

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
