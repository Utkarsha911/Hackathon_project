import React from 'react';

const VARIANTS = {
  primary: 'bg-brand-orange text-white hover:brightness-110 border border-brand-orange',
  outline: 'bg-transparent text-white border border-white/70 hover:bg-white/10',
  light: 'bg-brand-tint text-brand-navy border border-brand-blue/20 hover:bg-brand-blue/10',
};

/** Pill button (renders <a> when href is given). */
export default function Button({ href, variant = 'primary', className = '', children, ...rest }) {
  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition cursor-pointer ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
