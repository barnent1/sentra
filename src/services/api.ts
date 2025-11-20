// API is now same-origin (Next.js API routes), no separate backend URL needed
const API_URL = '';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');

  // Ensure endpoint starts with /api
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('accessToken', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Retry original request
        return fetchWithAuth(endpoint, options);
      }
    }

    // Refresh failed, redirect to login
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  return response;
}
