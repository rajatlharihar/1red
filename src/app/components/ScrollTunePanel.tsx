import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULTS, EASINGS, onTune, resetTune, setTune, tune, type GlideEasing } from './scrollTune';

/* TEMPORARY, localhost only (?tune): live sliders for the scroll feel.
 * Remove before any push (see scrollTune.ts). */
export function ScrollTunePanel() {
  const [, force] = useState(0);
  useEffect(() => onTune(() => force((n) => n + 1)), []);
  if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('tune')) return null;
  const row = (label: string, key: 'glideS' | 'lerp' | 'wheelMultiplier', min: number, max: number, step: number) => (
    <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr 48px', gap: 8, alignItems: 'center' }}>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={tune[key]} onChange={(e) => setTune({ [key]: Number(e.target.value) })} />
      <span style={{ textAlign: 'right' }}>{tune[key]}</span>
    </label>
  );
  return createPortal(
    <div
      style={{
        position: 'fixed', top: 12, right: 12, zIndex: 9999, width: 320, padding: 14, borderRadius: 10,
        background: 'rgba(255,255,255,0.95)', color: '#0A0A0A', font: '12px/1.4 ui-monospace, monospace',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)', display: 'grid', gap: 8,
      }}
    >
      <b>Scroll tuning (dev only)</b>
      {row('glide seconds', 'glideS', 1.5, 9, 0.1)}
      <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
        <span>glide easing</span>
        <select value={tune.glideEasing} onChange={(e) => setTune({ glideEasing: e.target.value as GlideEasing })}>
          {Object.keys(EASINGS).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      {row('lerp', 'lerp', 0.02, 0.2, 0.005)}
      {row('wheel speed', 'wheelMultiplier', 0.3, 1.5, 0.05)}
      <button onClick={resetTune}>reset to defaults ({DEFAULTS.glideS}s, {DEFAULTS.glideEasing}, {DEFAULTS.lerp}, {DEFAULTS.wheelMultiplier})</button>
    </div>,
    document.body
  );
}
