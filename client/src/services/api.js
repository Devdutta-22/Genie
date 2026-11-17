const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('gully_auth_token');
export const setAuthToken = (token) => localStorage.setItem('gully_auth_token', token);
export const clearAuthToken = () => localStorage.removeItem('gully_auth_token');

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to log in');
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function registerUser(formData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: formData // Multer handles multipart boundary automatically
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create account');
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    clearAuthToken();
    return null;
  }
  const data = await res.json();
  return data.user;
}

export async function fetchDemoUsers() {
  const res = await fetch(`${API_BASE}/auth/demo-users`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchUserProfile(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function updateUserLocation(userId, location_name, latitude, longitude) {
  const res = await fetch(`${API_BASE}/users/${userId}/location`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location_name, latitude, longitude })
  });
  if (!res.ok) throw new Error('Failed to update location');
}

export async function fetchGigs(params) {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'All') searchParams.append('category', params.category);
  if (params?.status && params.status !== 'All') searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.userLat !== undefined) searchParams.append('userLat', params.userLat.toString());
  if (params?.userLon !== undefined) searchParams.append('userLon', params.userLon.toString());

  const res = await fetch(`${API_BASE}/gigs?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch gigs');
  return res.json();
}

export async function fetchGigDetails(gigId) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}`);
  if (!res.ok) throw new Error('Failed to fetch gig details');
  return res.json();
}

export async function createGig(data) {
  const res = await fetch(`${API_BASE}/gigs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create gig');
  }
  return res.json();
}

export async function extractGigWithAi(prompt) {
  const res = await fetch(`${API_BASE}/gigs/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error('Failed to extract gig requirements');
  return res.json();
}

export async function fetchGigMatching(gigId) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/match`);
  if (!res.ok) throw new Error('Failed to fetch matching results');
  return res.json();
}

export async function notifyWave(gigId, wave) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/notify-wave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wave })
  });
  if (!res.ok) throw new Error('Failed to dispatch wave notifications');
  return res.json();
}

export async function acceptGig(gigId, worker_id) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ worker_id })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to accept gig');
  }
  return data;
}

export async function updateGigStatus(gigId, status, notes, link) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, submission_notes: notes, submission_link: link })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function approveGig(gigId) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('Failed to approve gig');
  return res.json();
}

export async function cancelGig(gigId) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('Failed to cancel gig');
  return res.json();
}

export async function fetchMessages(gigId) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendMessage(gigId, sender_id, receiver_id, message) {
  const res = await fetch(`${API_BASE}/gigs/${gigId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id, message })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function submitRating(gigId, data) {
  const res = await fetch(`${API_BASE}/ratings/${gigId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit rating');
  return res.json();
}

export async function fetchNotifications(userId) {
  const res = await fetch(`${API_BASE}/notifications/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(notifId) {
  await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: 'PUT' });
}
