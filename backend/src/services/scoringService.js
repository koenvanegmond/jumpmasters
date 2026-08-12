function calculateSessionPoints(height, airtime, distance) {
  const rawScore = (height * 2.5) + (airtime * 1.5) + (distance * 0.25);
  return Math.round((rawScore / 10) * 100) / 100;
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

function determineFleet(sessions) {
  if (!sessions.length) return 'Bronze';

  const maxHeight = Math.max(...sessions.map(s => parseFloat(s.height_m)));

  if (maxHeight >= 15) return 'Platinum';
  if (maxHeight >= 10) return 'Gold';
  if (maxHeight >= 5) return 'Silver';
  return 'Bronze';
}

module.exports = { calculateSessionPoints, calculateTotalPoints, determineFleet };
