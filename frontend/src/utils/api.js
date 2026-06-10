/**
 * API Utility — Compensation Monitoring System
 * Matches all backend REST endpoints
 */

const API_BASE = '/api';

async function request(path, opts = {}) {
  try {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const token = sessionStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

    if (!res.ok) {
      const text = await res.text();
      let msg = 'Unknown error';
      try { const d = JSON.parse(text); msg = d.error || msg; } catch (e) { msg = text || res.statusText; }
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

// ─── EXPORTS ──────────────────────────────────────────────────

const api = {
  getCases, getCase, createCase, updateCase, deleteCase,
  getCaseSteps, completeStep, updateStep,
  getDashboardStats,
  getAlerts, resolveAlert,
  getWorkflowSteps,
  searchCases,
  getDistricts
};
export default api;
