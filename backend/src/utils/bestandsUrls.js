// Avatars en sessiemedia worden als data-URI in Postgres bewaard. Die
// integraal meesturen in elke lijst maakte de feed 28 MB en de ranglijst
// 3,2 MB groot — bij elke paginaweergave opnieuw, want JSON wordt niet
// gecachet. In lijsten geven we daarom alleen een URL terug. De browser haalt
// het beeld daarna apart op, laadt het pas als het in beeld komt, en bewaart
// het in zijn cache.

function basis(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function avatarUrl(req, userId, waarde) {
  return waarde ? `${basis(req)}/api/users/${userId}/avatar` : null;
}

function sessieMediaUrl(req, sessieId, waarde) {
  return waarde ? `${basis(req)}/api/sessions/${sessieId}/media` : null;
}

// "data:image/png;base64,iVBOR..." -> { mime, buffer }
function ontleedDataUri(waarde) {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(waarde || '');
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
}

// Stuurt een opgeslagen data-URI als echt bestand terug.
function stuurBestand(res, waarde) {
  const bestand = ontleedDataUri(waarde);
  if (!bestand) return res.status(404).json({ error: 'Niet gevonden' });

  res.set('Content-Type', bestand.mime);
  // Media bij een sessie verandert nooit meer, dus een dag cachen is veilig
  // en scheelt het overgrote deel van het verkeer.
  res.set('Cache-Control', 'public, max-age=86400');
  return res.send(bestand.buffer);
}

module.exports = { avatarUrl, sessieMediaUrl, ontleedDataUri, stuurBestand };
