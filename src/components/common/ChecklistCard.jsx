import React from 'react';
import Card from './Card';

/** Titled card with an icon-bulleted list. */
export default function ChecklistCard({ title, icon: Icon, headerIcon: HeaderIcon, items = [] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5 mb-5 text-brand-blue">
        <HeaderIcon className="w-5 h-5" />
        <h4 className="text-lg font-extrabold text-ink">{title}</h4>
      </div>
      <ul className="space-y-3.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
            <Icon className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
