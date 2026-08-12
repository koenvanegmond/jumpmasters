// Bijhouden wat je al gezien hebt in de feed. Dat gebeurt lokaal per account:
// het is geen gegeven dat de server hoeft te kennen, en zo werkt het ook als
// je even geen verbinding hebt.

const sleutel = (userId) => `jm_feed_gezien_${userId || 'gast'}`;

export function laatstGezien(userId) {
  try {
    return localStorage.getItem(sleutel(userId)) || null;
  } catch {
    return null;
  }
}

export function markeerFeedGezien(userId, nieuwste) {
  if (!nieuwste) return;
  try {
    localStorage.setItem(sleutel(userId), nieuwste);
  } catch { /* niets aan te doen */ }
}

/**
 * Hoeveel sessies zijn er bijgekomen sinds je voor het laatst keek?
 * De eerste keer telt niets als ongelezen, anders begint iedereen met een
 * bolletje van vijftig.
 */
export function aantalNieuw(sessies, userId, eigenId) {
  if (!sessies?.length) return 0;
  const sinds = laatstGezien(userId);
  if (!sinds) return 0;
  return sessies.filter(
    (s) => new Date(s.created_at) > new Date(sinds) && s.user_id !== eigenId
  ).length;
}
