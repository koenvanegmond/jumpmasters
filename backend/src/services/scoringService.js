// De score is (hoogte × 2.5 + vliegtijd × 1.5 + afstand × 0.25) ÷ 10, afgerond
// op twee decimalen. Dat laatste gaat mis met gewone kommagetallen: 5.105 × 100
// is in drijvende komma 510.49999999999994, dus Math.round maakt er 5.10 van
// waar 5.11 hoort. Bij 5.725 valt het toevallig wél goed uit, waardoor de
// afronding per sessie verschilde. Daarom rekenen we in hele getallen.
function calculateSessionPoints(height, airtime, distance) {
  const h = Math.round(height * 100);
  const a = Math.round(airtime * 100);
  const d = Math.round(distance * 100);

  // punten × 4000, exact zolang de invoer hoogstens twee decimalen heeft.
  const n = (h * 10) + (a * 6) + d;

  // Delen door 40 geeft punten × 100; + 20 rondt halve centen naar boven.
  return Math.floor((n + 20) / 40) / 100;
}

// Standaard tellen je vijf beste sessies mee. Het feestweekklassement gebruikt
// dezelfde regel met een ander aantal, zodat er maar één plek is waar bepaald
// wordt hoe een totaal tot stand komt.
function calculateTotalPoints(sessions, aantalBeste = 5) {
  const sorted = sessions
    .filter(s => s.verified)
    .sort((a, b) => b.points - a.points);

  const beste = sorted.slice(0, aantalBeste);
  const total = beste.reduce((sum, s) => sum + parseFloat(s.points), 0);
  return Math.round(total * 100) / 100;
}

// Eén hoge sprong is geen bewijs, drie wel. Promotie naar een fleet vraagt
// om drie verschillende sessies boven de drempel van die fleet, niet één
// toevalstreffer.
const PROMOTIE_DREMPEL = 3;

function determineFleet(sessions) {
  const heights = sessions.map(s => parseFloat(s.height_m));

  const boven = (drempel) => heights.filter(h => h >= drempel).length >= PROMOTIE_DREMPEL;

  if (boven(15)) return 'Platinum';
  if (boven(10)) return 'Gold';
  if (boven(5)) return 'Silver';
  return 'Bronze';
}

module.exports = { calculateSessionPoints, calculateTotalPoints, determineFleet };
