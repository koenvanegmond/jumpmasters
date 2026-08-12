import { api } from './api';

const TOKEN = 'jm_token';
const GEBRUIKER = 'jm_gebruiker';

export function saveToken(token) {
  localStorage.setItem(TOKEN, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(GEBRUIKER);
}

export function getToken() {
  return localStorage.getItem(TOKEN);
}

// We bewaren ook wie je bent. Daardoor staat de site meteen klaar bij het
// openen, zonder eerst op de server te wachten. Belangrijker nog: als de
// server even niet reageert blijf je gewoon ingelogd in plaats van dat je
// terugvalt op het inlogscherm.
export function bewaarGebruiker(user) {
  try { localStorage.setItem(GEBRUIKER, JSON.stringify(user)); } catch {}
}

export function bewaardeGebruiker() {
  try {
    const rauw = localStorage.getItem(GEBRUIKER);
    return rauw ? JSON.parse(rauw) : null;
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const data = await api.login({ email, password });
  saveToken(data.token);
  bewaarGebruiker(data.user);
  return data.user;
}

export async function signup(email, password, name) {
  const data = await api.signup({ email, password, name });
  saveToken(data.token);
  bewaarGebruiker(data.user);
  return data.user;
}

export function logout() {
  clearToken();
}
