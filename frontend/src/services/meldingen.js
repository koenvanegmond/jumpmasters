import { api } from './api';

// Draait de site als geïnstalleerde app? Op iPhone is dat de voorwaarde:
// Safari geeft alleen meldingen als de site op het beginscherm staat.
export function draaitAlsApp() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function wordtOndersteund() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Waarom kan deze bezoeker geen meldingen krijgen? Geeft null terug als het
 * gewoon kan, anders een uitleg die we op het scherm kunnen zetten.
 */
export function waaromNiet() {
  if (wordtOndersteund()) return null;
  if (isIOS() && !draaitAlsApp()) {
    return 'Op de iPhone werken meldingen alleen als je Jump Masters op je beginscherm zet. '
      + 'Tik onderin op het deelicoontje en kies "Zet op beginscherm".';
  }
  return 'Deze browser ondersteunt geen meldingen.';
}

function naarUint8Array(base64) {
  const opvulling = '='.repeat((4 - (base64.length % 4)) % 4);
  const netjes = (base64 + opvulling).replace(/-/g, '+').replace(/_/g, '/');
  const rauw = atob(netjes);
  return Uint8Array.from([...rauw].map((c) => c.charCodeAt(0)));
}

async function registreer() {
  return navigator.serviceWorker.register('/sw.js');
}

export async function huidigAbonnement() {
  if (!wordtOndersteund()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function zetAan() {
  if (!wordtOndersteund()) throw new Error(waaromNiet() || 'Meldingen kunnen niet aan');

  const toestemming = await Notification.requestPermission();
  if (toestemming !== 'granted') {
    throw new Error('Je hebt meldingen geweigerd. Zet ze aan in de instellingen van je browser.');
  }

  const { sleutel } = await api.pushSleutel();
  const reg = await registreer();
  await navigator.serviceWorker.ready;

  const abonnement = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: naarUint8Array(sleutel),
  });

  await api.pushAbonneer(abonnement.toJSON());
  return abonnement;
}

export async function zetUit() {
  const abonnement = await huidigAbonnement();
  if (abonnement) {
    await api.pushAfmelden({ endpoint: abonnement.endpoint }).catch(() => {});
    await abonnement.unsubscribe().catch(() => {});
  }
}
