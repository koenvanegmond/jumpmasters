const vision = require('@google-cloud/vision');
const { calculateSessionPoints } = require('./scoringService');

let client;

function getClient() {
  if (!client) {
    // Production: pass credentials as JSON string in env var
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      let raw = process.env.GOOGLE_CREDENTIALS_JSON;
      // Some platforms double-escape backslashes — fix that
      // Also handle case where the entire JSON was wrapped in extra quotes
      if (raw.startsWith('"') && raw.endsWith('"')) {
        try { raw = JSON.parse(raw); } catch {}
      }
      let credentials;
      try {
        credentials = JSON.parse(raw);
      } catch (parseErr) {
        console.error('GOOGLE_CREDENTIALS_JSON is not valid JSON:', parseErr.message);
        throw new Error('OCR configuratiefout — neem contact op met de beheerder');
      }
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key
          .replace(/\\n/g, '\n')   // handle escaped newlines from env var
          .replace(/\\r/g, '');    // strip any carriage returns
      }
      console.log('Vision client init — project_id:', credentials.project_id, '| key starts with:', credentials.private_key?.slice(0, 30));
      client = new vision.ImageAnnotatorClient({ credentials });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      client = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    } else {
      throw new Error('Geen Google credentials gevonden — stel GOOGLE_CREDENTIALS_JSON in op Render');
    }
  }
  return client;
}

// Een sessiedatum is een kale dag, geen moment in de tijd. Bouwen we hem met
// new Date(jaar, maand, dag), dan is dat middernacht Nederlandse tijd, en
// schuift toISOString() hem in de zomer twee uur terug — naar de dag ervoor.
// Middernacht UTC houdt de dag heel, waar de server ook staat.
function kaleDatum(jaar, maandIndex, dag) {
  return new Date(Date.UTC(jaar, maandIndex, dag));
}

// Vision leest de 's' van seconden geregeld als een 5, waardoor "6.9s" als
// "6.95" binnenkomt. Surfr toont vliegtijd altijd met één decimaal — alle
// sessies in de database bevestigen dat — dus een tweede decimaal die precies
// een 5 is en waar géén eenheid achter herkend werd, is die verdwaalde 's'.
function normaliseerVliegtijd(ruw, teken) {
  const waarde = String(ruw).replace(',', '.');
  const eenheidHerkend = /^[sS@]$/.test(teken || '');

  if (!eenheidHerkend && /^\d+\.\d{2}$/.test(waarde) && waarde.endsWith('5')) {
    return parseFloat(waarde.slice(0, -1));
  }
  return parseFloat(waarde);
}

async function extractSurfrData(imageBuffer) {
  let detections;
  try {
    const [result] = await getClient().textDetection(imageBuffer);
    detections = result.textAnnotations;
  } catch (err) {
    // Alles wat hier misgaat ligt aan onze kant, niet aan de foto: ontbrekende
    // credentials, facturering uit, quota op, of Google onbereikbaar. Dat moet
    // de gebruiker anders te horen krijgen dan "probeer een andere foto", en de
    // details horen in het serverlog thuis en niet in de browser.
    console.error('Vision niet beschikbaar:', err.message);
    const storing = new Error('De automatische scan is tijdelijk niet beschikbaar');
    storing.ocrUnavailable = true;
    throw storing;
  }

  if (!detections || detections.length === 0) {
    throw new Error('No text detected in image');
  }

  const fullText = detections[0].description;
  console.log('OCR raw text:\n', fullText); // helpful for debugging new screenshot formats

  // ── Height ───────────────────────────────────────────────────────────────
  // Share card: "Hoogste sprong\n6.4m"  (label above value)
  // Feed view:  "6.4 m\nHoogste sprong" (value above label)
  // Also handles "Highest jump" for English Surfr users
  const heightMatch =
    fullText.match(/(?:Hoogste sprong|Highest jump)[^\d]*(\d+[.,]?\d*)\s*m/i) ||
    fullText.match(/(\d+[.,]?\d*)\s*m[^\n]*\n[^\n]*(?:Hoogste sprong|Highest jump)/i);

  // ── Airtime ───────────────────────────────────────────────────────────────
  // Dutch: "Max vliegtijd" / "Max. airtime"
  // Note: OCR sometimes reads "s" as "@" or other chars — so we just grab the number after the label
  // Het teken ná het getal wordt meegevangen: daaraan zien we of de eenheid
  // wel of niet als zodanig herkend is — zie normaliseerVliegtijd.
  const airtimeMatch =
    fullText.match(/(?:Max\.?\s*vliegtijd|Max\.?\s*airtime)[^\d]*(\d+[.,]?\d*)\s*([^\d\s.,]?)/i) ||
    fullText.match(/(\d+[.,]?\d*)\s*([s@])[^\n]*\n[^\n]*(?:vliegtijd|airtime)/i);

  // ── Distance ──────────────────────────────────────────────────────────────
  // Dutch: "Max afstand" / "Max. afstand"
  const distanceMatch =
    fullText.match(/(?:Max\.?\s*afstand|Max\.?\s*distance)[^\d]*(\d+[.,]?\d*)\s*m/i) ||
    fullText.match(/(\d+[.,]?\d*)\s*m[^\n]*\n[^\n]*(?:afstand|distance)/i);

  // ── Date ──────────────────────────────────────────────────────────────────
  // Dutch format: "18 sep 2025" or "18 sep 2025 18:06"
  const DUTCH_MONTHS = { jan:0, feb:1, mrt:2, apr:3, mei:4, jun:5, jul:6, aug:7, sep:8, okt:9, nov:10, dec:11 };

  const nu = new Date();
  let date = kaleDatum(nu.getFullYear(), nu.getMonth(), nu.getDate());

  const dutchDateMatch = fullText.match(/(\d{1,2})\s+(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)\s+(\d{4})/i);
  if (dutchDateMatch) {
    date = kaleDatum(
      parseInt(dutchDateMatch[3]),
      DUTCH_MONTHS[dutchDateMatch[2].toLowerCase()],
      parseInt(dutchDateMatch[1])
    );
  } else {
    // English fallback: "03 Nov 2025"
    const engDateMatch = fullText.match(/(\d{2} [A-Z][a-z]{2} \d{4})/);
    if (engDateMatch) {
      const d = new Date(engDateMatch[1]);
      if (!isNaN(d)) date = kaleDatum(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }

  // ── Location ─────────────────────────────────────────────────────────────
  const locationMatch = fullText.match(/([A-Za-z][A-Za-z\s]+(?:aan Zee|vaert|haven|strand|beach))/i);
  const location = locationMatch ? locationMatch[1].trim() : 'Unknown';

  // ── Rider name ────────────────────────────────────────────────────────────
  const nameMatch = fullText.match(/^([A-Z][a-z]+ (?:van |de |den |der )?[A-Z][a-z]+(?:\.|)?)/m);
  const riderName = nameMatch ? nameMatch[1] : null;

  // Parse values (replace comma decimal separator)
  const height   = heightMatch   ? parseFloat(heightMatch[1].replace(',', '.'))   : null;
  const airtime  = airtimeMatch  ? normaliseerVliegtijd(airtimeMatch[1], airtimeMatch[2]) : null;
  const distance = distanceMatch ? parseFloat(distanceMatch[1].replace(',', '.')) : null;

  if (!height || !airtime || !distance) {
    console.log('Failed to extract — height:', height, 'airtime:', airtime, 'distance:', distance);
    throw new Error('Could not extract all required metrics from image');
  }

  const points = calculateSessionPoints(height, airtime, distance);

  return {
    riderName,
    date,
    height,
    airtime,
    distance,
    location,
    points,
    confidence: calculateConfidence(height, airtime, distance)
  };
}

function calculateConfidence(height, airtime, distance) {
  let score = 0;
  if (height > 0 && height < 50) score += 0.33;
  if (airtime > 0 && airtime < 20) score += 0.33;
  if (distance > 0 && distance < 200) score += 0.34;
  return score;
}

module.exports = { extractSurfrData };
