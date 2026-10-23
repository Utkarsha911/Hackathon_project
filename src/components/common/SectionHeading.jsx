import React from 'react';

/** Small blue label, navy title, optional blurb (children) and right-aligned action. */
export default function SectionHeading({ label, title, as: Tag = 'h2', action, className = 'mb-8', children }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="max-w-2xl">
        {label && <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-2">{label}</div>}
        <Tag className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">{title}</Tag>
        {children && <p className="mt-3 text-slate-600 leading-relaxed">{children}</p>}
      </div>
      {action}
    </div>
  );
}
