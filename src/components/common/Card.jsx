import React from 'react';

/** White rounded card with a soft border. `hover` lifts it, `highlight` tints it blue. */
export default function Card({ as: Tag = 'div', hover = false, highlight = false, className = '', children, ...rest }) {
  return (
    <Tag
      className={`rounded-2xl border ${highlight ? 'bg-brand-tint border-brand-blue/30' : 'bg-white border-slate-200/80'} shadow-[0_2px_12px_-4px_rgba(15,31,92,0.12)] ${
        hover ? 'transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(15,31,92,0.25)]' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
