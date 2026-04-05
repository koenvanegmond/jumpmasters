import { api } from './api';

export function saveToken(token) {
  localStorage.setItem('jm_token', token);
}

export function clearToken() {
  localStorage.removeItem('jm_token');
}

export function getToken() {
  return localStorage.getItem('jm_token');
}

export async function login(email, password) {
  const data = await api.login({ email, password });
  saveToken(data.token);
  return data.user;
}

export async function signup(email, password, name) {
  const data = await api.signup({ email, password, name });
  saveToken(data.token);
  return data.user;
}

export function logout() {
  clearToken();
}
