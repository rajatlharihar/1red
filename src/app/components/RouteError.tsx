import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router';

/* Route-level error page (replaces react-router's developer screen).
   A stale chunk after a deploy ("Failed to fetch dynamically imported
   module" / "Importing a module script failed") reloads once onto the new
   build; anything else gets a calm, on-brand page with a way out. */
const STALE = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i;
const KEY = '1red-chunk-reload';

export function RouteError() {
  const error = useRouteError() as { message?: string } | undefined;
  const stale = STALE.test(String(error?.message ?? error ?? ''));

  useEffect(() => {
    if (!stale) return;
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    }
  }, [stale]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', color: '#0A0A0A', padding: '2rem 1rem', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 640 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 88px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.95, margin: 0 }}>
          {stale ? 'Fresh paint.' : 'Well, that’s awkward.'}
          <br />
          <span style={{ opacity: 0.4 }}>{stale ? 'Loading the new version.' : 'Something broke on our side.'}</span>
        </h1>
        <div style={{ height: 1, background: '#0A0A0A', margin: '28px 0' }} />
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="fill-btn btn-corners fill-btn--red"
          >
            <span className="fill-btn__fill" aria-hidden />
            <span className="fill-btn__label">
              <span>Reload</span>
              <span aria-hidden>Reload</span>
            </span>
          </button>
          <Link to="/" reloadDocument className="fill-btn btn-corners fill-btn--red-outline" style={{ textDecoration: 'none' }}>
            <span className="fill-btn__fill" aria-hidden />
            <span className="fill-btn__label">
              <span>Take me home</span>
              <span aria-hidden>Take me home</span>
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
