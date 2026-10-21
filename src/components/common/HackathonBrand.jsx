import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';

export default function HackathonBrand({
  hackathon: hackathonProp,
  className = '',
  imageClassName = 'h-8 sm:h-9 w-auto max-w-[180px] object-contain',
  textClassName = 'font-extrabold text-slate-900 tracking-tight text-sm sm:text-base',
  subTextClassName = 'text-[10px] font-mono font-bold text-[#ea580c]',
  iconSizeClass = 'w-8 h-8 text-xs',
  showSubText = true,
  fallbackTitle = 'BIC HACKATHON'
}) {
  const { hackathon: contextHackathon } = useHackathon() || {};
  const currentHackathon = hackathonProp !== undefined ? hackathonProp : contextHackathon;
  const [imageFailed, setImageFailed] = useState(false);

  const rawLogo =
    currentHackathon?.logo ||
    currentHackathon?.logo_url;

  const logoUrl = rawLogo ? getMediaUrl(rawLogo) : null;
  const title = currentHackathon?.title || fallbackTitle;
  const version = currentHackathon?.version;
  const initial = (title?.[0] || 'B').toUpperCase();

  if (logoUrl && !imageFailed) {
    return (
      <img
        src={logoUrl}
        alt={title}
        className={imageClassName}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${iconSizeClass} rounded-xl bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white flex items-center justify-center font-black shadow-xs tracking-wider shrink-0 select-none`}>
        {initial}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`leading-tight truncate ${textClassName}`}>
          {title}
        </span>
        {showSubText && version && (
          <span className={`leading-none mt-0.5 ${subTextClassName}`}>
            {version}
          </span>
        )}
      </div>
    </div>
  );
}
