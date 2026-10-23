import React from 'react';

/** Small blue inline link, e.g. "View all details →". */
export default function TextLink({ href, className = '', children, ...rest }) {
  return (
    <a href={href} className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-navy ${className}`} {...rest}>
      {children}
    </a>
  );
}
