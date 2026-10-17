/* The nav's 1red steps aside while another 1red is on screen, or while a
   busy full-bleed picture sits behind it (Rajat, 2026-10-17). Sections that
   paint a mark the DOM cannot see (a logo inside a film) claim it here;
   Navigation reads the claims on its overlap tick. */
const claims = new Set<string>();

export function claimNavMark(id: string, on: boolean) {
  if (on) claims.add(id);
  else claims.delete(id);
}

export function navMarkClaimed() {
  return claims.size > 0;
}
