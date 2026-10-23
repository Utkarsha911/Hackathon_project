import React, { useState } from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { getMediaUrl } from '../../services/api';

// Static brand mark from /public, used when the API has no hackathon logo.
const DEFAULT_LOGO = '/LOGO%20ONLY.svg';

export default function HackathonBrand({
  hackathon: hackathonProp,
  className = '',
  imageClassName = 'h-8 sm:h-9 w-auto max-w-[180px] object-contain',
  textClassName = 'font-extrabold text-slate-900 tracking-tight text-sm sm:text-base',
  subTextClassName = 'text-[10px] font-mono font-bold text-brand-blue',
  iconSizeClass = 'w-8 h-8',
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
      <img src={DEFAULT_LOGO} alt="" className={`${iconSizeClass} object-contain shrink-0`} />
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
