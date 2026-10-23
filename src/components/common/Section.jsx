import React from 'react';

const TONES = {
  white: 'bg-white',
  tint: 'bg-brand-tint',
  dark: 'bg-brand-dark text-white',
};

/** Landing-page section: tone background and centered container. */
export default function Section({ id, tone = 'white', width = 'max-w-6xl', py = 'py-16', className = '', children }) {
  return (
    <section id={id} className={`${TONES[tone]} scroll-mt-16 ${py} ${className}`}>
      <div className={`${width} mx-auto px-4 sm:px-6 lg:px-8`}>{children}</div>
    </section>
  );
}
