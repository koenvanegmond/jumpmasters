const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

function getToken() {
  return localStorage.getItem('jm_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Fout: ${res.status}`);
  return data;
}

export const api = {
  // Auth
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  changePassword: (body) => request('/auth/password', { method: 'PATCH', body: JSON.stringify(body) }),

  // Sessions
  uploadScreenshot: (formData) => request('/sessions/upload', { method: 'POST', body: formData }),
  confirmSession: (formData) => request('/sessions/confirm', { method: 'POST', body: formData }),
  manualSession: (formData) => request('/sessions/manual', { method: 'POST', body: formData }),
  mySessions: () => request('/sessions/mine'),

  // Leaderboard
  leaderboardOverall: () => request('/leaderboard/overall'),
  leaderboardFleet: (fleet) => request(`/leaderboard/fleet/${fleet}`),

  // Users
  userStats: (id) => request(`/users/${id}/stats`),
  searchUsers: (q) => request(`/users?q=${encodeURIComponent(q)}`),
  uploadAvatar: (formData) => request('/users/avatar', { method: 'POST', body: formData }),

  // Feed
  sessionFeed: () => request('/sessions/feed'),

  // Going today
  goingToday: () => request('/going/today'),
  setGoing: (status) => request('/going', { method: 'POST', body: JSON.stringify({ status }) }),
  removeGoing: () => request('/going', { method: 'DELETE' }),

  // News
  getNews: () => request('/news'),
  createNews: (body) => request('/news', { method: 'POST', body: JSON.stringify(body) }),
  deleteNews: (id) => request(`/news/${id}`, { method: 'DELETE' }),

  // Social
  toggleLike: (sessionId) => request(`/social/like/${sessionId}`, { method: 'POST' }),
  getLikes: (sessionId) => request(`/social/likes/${sessionId}`),
  getComments: (sessionId) => request(`/social/comments/${sessionId}`),
  postComment: (sessionId, content) => request(`/social/comment/${sessionId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteComment: (commentId) => request(`/social/comment/${commentId}`, { method: 'DELETE' }),
  getNotifications: () => request('/social/notifications'),
  markNotificationsRead: () => request('/social/notifications/read', { method: 'PATCH' }),

  // Admin
  adminPending: () => request('/admin/sessions/pending'),
  adminVerify: (id, verified) => request(`/admin/sessions/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }) }),
  adminEditSession: (id, body) => request(`/admin/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminStats: () => request('/admin/stats'),
  adminUsers: () => request('/admin/users')
};
