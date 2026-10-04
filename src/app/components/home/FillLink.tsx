import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** The site's fill button (theme.css .fill-btn), as a real link. */
export function FillLink({ to, children, outline = false, icon }: { to: string; children: string; outline?: boolean; icon?: ReactNode }) {
  const cls = `fill-btn btn-corners ${outline ? 'fill-btn--red-outline' : 'fill-btn--red'}`;
  const inner = (
    <>
      <span className="fill-btn__fill" aria-hidden />
      <span className="fill-btn__label">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
      {icon && <span className="fill-btn__icon">{icon}</span>}
    </>
  );
  return /^(mailto:|https?:)/.test(to) ? (
    <a href={to} className={cls} style={{ textDecoration: 'none' }}>{inner}</a>
  ) : (
    <Link to={to} className={cls} style={{ textDecoration: 'none' }}>{inner}</Link>
  );
}
