import type { ReactNode } from 'react';

export function Panel({ id, title, eyebrow, accessory, className = '', children }: {
  id: string;
  title: string;
  eyebrow?: string;
  accessory?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return <section className={`panel ${className}`} aria-labelledby={id}>
    <div className="section-title">
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={id}>{title}</h2></div>
      {accessory}
    </div>
    {children}
  </section>;
}
