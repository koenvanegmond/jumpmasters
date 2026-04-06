const vision = require('@google-cloud/vision');
const { calculateSessionPoints } = require('./scoringService');

let client;

function getClient() {
  if (!client) {
    // Production: pass credentials as JSON string in env var
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      client = new vision.ImageAnnotatorClient({ credentials });
    } else {
      client = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    }
  }
  return client;
}

async function extractSurfrData(imageBuffer) {
  const [result] = await getClient().textDetection(imageBuffer);
  const detections = result.textAnnotations;

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
  const airtimeMatch =
    fullText.match(/(?:Max\.?\s*vliegtijd|Max\.?\s*airtime)[^\d]*(\d+[.,]?\d*)\s*s/i) ||
    fullText.match(/(\d+[.,]?\d*)\s*s[^\n]*\n[^\n]*(?:vliegtijd|airtime)/i);

  // ── Distance ──────────────────────────────────────────────────────────────
  // Dutch: "Max afstand" / "Max. afstand"
  const distanceMatch =
    fullText.match(/(?:Max\.?\s*afstand|Max\.?\s*distance)[^\d]*(\d+[.,]?\d*)\s*m/i) ||
    fullText.match(/(\d+[.,]?\d*)\s*m[^\n]*\n[^\n]*(?:afstand|distance)/i);

  // ── Date ──────────────────────────────────────────────────────────────────
  // Dutch format: "18 sep 2025" or "18 sep 2025 18:06"
  const DUTCH_MONTHS = { jan:0, feb:1, mrt:2, apr:3, mei:4, jun:5, jul:6, aug:7, sep:8, okt:9, nov:10, dec:11 };
  let date = new Date();
  const dutchDateMatch = fullText.match(/(\d{1,2})\s+(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)\s+(\d{4})/i);
  if (dutchDateMatch) {
    date = new Date(parseInt(dutchDateMatch[3]), DUTCH_MONTHS[dutchDateMatch[2].toLowerCase()], parseInt(dutchDateMatch[1]));
  } else {
    // English fallback: "03 Nov 2025"
    const engDateMatch = fullText.match(/(\d{2} [A-Z][a-z]{2} \d{4})/);
    if (engDateMatch) date = new Date(engDateMatch[1]);
  }

  // ── Location ─────────────────────────────────────────────────────────────
  const locationMatch = fullText.match(/([A-Za-z][A-Za-z\s]+(?:aan Zee|vaert|haven|strand|beach))/i);
  const location = locationMatch ? locationMatch[1].trim() : 'Unknown';

  // ── Rider name ────────────────────────────────────────────────────────────
  const nameMatch = fullText.match(/^([A-Z][a-z]+ (?:van |de |den |der )?[A-Z][a-z]+(?:\.|)?)/m);
  const riderName = nameMatch ? nameMatch[1] : null;

  // Parse values (replace comma decimal separator)
  const height   = heightMatch   ? parseFloat(heightMatch[1].replace(',', '.'))   : null;
  const airtime  = airtimeMatch  ? parseFloat(airtimeMatch[1].replace(',', '.'))  : null;
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
