/**
 * API Utility — Compensation Monitoring System
 * Matches all backend REST endpoints
 */

const API_BASE = '/api';

let cachedToken = null;

export function getAuthToken() {
  return cachedToken || sessionStorage.getItem('auth_token');
}

export function setAuthToken(token) {
  cachedToken = token;
  if (token) {
    sessionStorage.setItem('auth_token', token);
  } else {
    sessionStorage.removeItem('auth_token');
  }
}

export function clearAuth() {
  cachedToken = null;
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_role');
}

async function request(path, opts = {}) {
  try {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

    if (!res.ok) {
      const text = await res.text();
      let msg = 'Unknown error';
      try { const d = JSON.parse(text); msg = d.error || msg; } catch (e) { msg = text || res.statusText; }
      
      // If 401 (unauthorized), clear auth and let the app redirect
      if (res.status === 401) {
        clearAuth();
        // Dispatch custom event so App can react
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      
      throw new Error(`API Error [${res.status}]: ${msg}`);
    }
    return await res.json();
  } catch (error) {
    if (error.message.startsWith('API Error')) throw error;
    console.error('Request failed:', error);
    throw new Error('Network error — is the backend running?');
  }
}

// ─── CASES ────────────────────────────────────────────────────

export async function getCases(filters = {}) {
  const { search, type, status, district, page, limit } = filters;
  const params = new URLSearchParams();
  if (search) params.set('search', search.substring(0, 100));
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  if (district) params.set('district', district);
  if (page) params.set('page', Math.max(1, Math.min(100, parseInt(page))));
  if (limit) params.set('limit', Math.max(5, Math.min(100, parseInt(limit))));
  return request(`/cases?${params.toString()}`);
}

export async function getCase(id) {
  if (!id) throw new Error('Case ID required');
  return request(`/cases/${encodeURIComponent(id)}`);
}

export async function createCase(payload) {
  const required = ['fir_number', 'case_type', 'data_source', 'date_of_fir'];
  for (const f of required) {
    if (!payload[f]) throw new Error(`${f} is required`);
  }
  return request('/cases', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCase(id, data) {
  if (!id) throw new Error('Case ID required');
  return request(`/cases/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function markCaseAsPaid(id) {
  if (!id) throw new Error('Case ID required');
  return request(`/cases/${encodeURIComponent(id)}/mark-paid`, { method: 'POST' });
}

export async function deleteCase(id) {
  if (!id) throw new Error('Case ID required');
  return request(`/cases/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── STEPS ────────────────────────────────────────────────────

export async function getCaseSteps(caseId) {
  if (!caseId) throw new Error('Case ID required');
  return request(`/cases/${encodeURIComponent(caseId)}/steps`);
}

export async function completeStep(caseId, stepNumber, data = {}) {
  if (!caseId || !stepNumber) throw new Error('Case ID and step number required');
  return request(`/cases/${encodeURIComponent(caseId)}/steps/${stepNumber}/complete`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function revertStep(caseId, stepNumber) {
  if (!caseId || !stepNumber) throw new Error('Case ID and step number required');
  return request(`/cases/${encodeURIComponent(caseId)}/steps/${stepNumber}/revert`, {
    method: 'POST'
  });
}

export async function updateStep(caseId, stepNumber, data = {}) {
  if (!caseId || !stepNumber) throw new Error('Case ID and step number required');
  return request(`/cases/${encodeURIComponent(caseId)}/steps/${stepNumber}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ─── DASHBOARD ────────────────────────────────────────────────

export async function getDashboardStats() {
  return request('/dashboard/stats');
}

// ─── ALERTS ───────────────────────────────────────────────────

export async function getAlerts(filters = {}) {
  const { type, resolved } = filters;
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (resolved !== undefined) params.set('resolved', resolved);
  return request(`/alerts?${params.toString()}`);
}

export async function resolveAlert(id, resolvedBy = 'system') {
  if (!id) throw new Error('Alert ID required');
  return request(`/alerts/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolved_by: resolvedBy })
  });
}

// ─── WORKFLOW ─────────────────────────────────────────────────

export async function getWorkflowSteps() {
  return request('/workflow/steps');
}

// ─── SEARCH ───────────────────────────────────────────────────

export async function searchCases(q) {
  if (!q) return [];
  return request(`/search?q=${encodeURIComponent(q.substring(0, 100))}`);
}

// ─── DISTRICTS ────────────────────────────────────────────────

export async function getDistricts() {
  return request('/districts');
}

// ─── AUTH ────────────────────────────────────────────────────

export async function login(username, password, rememberMe = false) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, rememberMe })
  });
  // Store the token
  setAuthToken(res.token);
  sessionStorage.setItem('auth_user', JSON.stringify(res.user));
  sessionStorage.setItem('auth_role', res.user.role);
  return res;
}

export async function verifyToken() {
  return request('/auth/verify');
}

export async function changePassword(currentPassword, newPassword) {
  return request('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

// ─── EXPORTS ──────────────────────────────────────────────────

const api = {
  login, verifyToken, changePassword,
  getCases, getCase, createCase, updateCase, deleteCase, markCaseAsPaid,
  getCaseSteps, completeStep, revertStep, updateStep,
  getDashboardStats,
  getAlerts, resolveAlert,
  getWorkflowSteps,
  searchCases,
  getDistricts
};
export default api;
