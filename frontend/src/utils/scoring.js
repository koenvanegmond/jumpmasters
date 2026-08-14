// Moet exact gelijk blijven aan backend/src/services/scoringService.js, anders
// wijkt het puntenaantal dat je bij het uploaden ziet af van wat er wordt
// opgeslagen. Zie daar voor waarom dit in hele getallen rekent.
export function calculateSessionPoints(height, airtime, distance) {
  const h = Math.round(height * 100);
  const a = Math.round(airtime * 100);
  const d = Math.round(distance * 100);

  const n = (h * 10) + (a * 6) + d;

  return Math.floor((n + 20) / 40) / 100;
}

export function calculateTotalPoints(sessions) {
  const sorted = sessions
    .filter(s => s.verified)
    .sort((a, b) => b.points - a.points);

  const top5 = sorted.slice(0, 5);
  const total = top5.reduce((sum, s) => sum + parseFloat(s.points), 0);
  return Math.round(total * 100) / 100;
}

export const FLEET_COLORS = {
  Bronze: { bg: 'bg-amber-700', text: 'text-white', hex: '#CD7F32' },
  Silver: { bg: 'bg-gray-400', text: 'text-white', hex: '#C0C0C0' },
  Gold: { bg: 'bg-yellow-400', text: 'text-gray-900', hex: '#FFD700' },
  Platinum: { bg: 'bg-gray-200', text: 'text-gray-800', hex: '#E5E4E2' }
};
