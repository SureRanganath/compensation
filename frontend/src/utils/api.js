/**
 * API Utility — Compensation Monitoring System
 * Matches all backend REST endpoints
 * Features automatic retry with exponential backoff for 429 (Too Many Requests).
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

// ─── Retry Configuration ─────────────────────────────────────
const RETRY_CONFIG = {
  maxRetries: 3,          // Max number of retry attempts
  baseDelayMs: 1000,      // Initial delay before first retry (doubles each attempt)
  maxDelayMs: 10000,      // Cap on delay to avoid excessive waiting
  jitter: true            // Add random jitter (+/- 25%) to prevent thundering herd
};

/**
 * Sleep for `ms` milliseconds.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for a given retry attempt with optional jitter.
 * Uses exponential backoff: baseDelay * 2^(attempt-1), capped at maxDelay.
 */
function getDelay(attempt) {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
    RETRY_CONFIG.maxDelayMs
  );
  if (RETRY_CONFIG.jitter) {
    // Add +/- 25% random jitter
    const jitterFactor = 0.75 + Math.random() * 0.5;
    return Math.round(delay * jitterFactor);
  }
  return delay;
}

/**
 * Parse the Retry-After header value (seconds or HTTP-date).
 * Returns delay in milliseconds, or null if unparseable.
 */
function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const seconds = parseInt(headerValue, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  // Could try parsing HTTP-date here, but seconds is the common format
  return null;
}

async function request(path, opts = {}, attempt = 1) {
  try {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

    if (!res.ok) {
      const text = await res.text();
      let msg = 'Unknown error';
      try { const d = JSON.parse(text); msg = d.error || msg; } catch (e) { msg = text || res.statusText; }
      
      // If 401 (unauthorized), clear auth and let the app redirect — no retry
      if (res.status === 401) {
        clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error(`API Error [${res.status}]: ${msg}`);
      }

      // If 429 (Too Many Requests), retry with exponential backoff
      if (res.status === 429 && attempt <= RETRY_CONFIG.maxRetries) {
        // Prefer server-provided Retry-After header, otherwise use our backoff.
        // When the server specifies a wait time, we use the longer of the server's
        // instruction and our own backoff to avoid burning retries too early.
        const retryAfterMs = parseRetryAfter(res.headers.get('Retry-After'));
        const backoffMs = getDelay(attempt);
        const delayMs = retryAfterMs !== null
          ? Math.max(retryAfterMs, backoffMs)
          : backoffMs;

        console.warn(
          `API 429 [${path}]: attempt ${attempt}/${RETRY_CONFIG.maxRetries}, ` +
          `retrying in ${Math.round(delayMs / 1000)}s...`
        );

        await sleep(delayMs);
        return request(path, opts, attempt + 1);
      }
      
      throw new Error(`API Error [${res.status}]: ${msg}`);
    }
    return await res.json();
  } catch (error) {
    // If it's our own API Error, re-throw it
    if (error.message.startsWith('API Error')) throw error;
    // If we haven't exhausted retries and it looks like a transient network error,
    // retry (e.g., connection reset, DNS failure, etc.)
    if (attempt <= RETRY_CONFIG.maxRetries) {
      console.warn(
        `Network error [${path}]: attempt ${attempt}/${RETRY_CONFIG.maxRetries}, retrying...`,
        error.message
      );
      const delayMs = getDelay(attempt);
      await sleep(delayMs);
      return request(path, opts, attempt + 1);
    }
    console.error('Request failed after retries:', error);
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

// ─── SUPERVISOR NOTES ────────────────────────────────────────

export async function updateSupervisorNotes(caseId, stepNumber, notes) {
  if (!caseId || !stepNumber) throw new Error('Case ID and step number required');
  return request(`/cases/${encodeURIComponent(caseId)}/steps/${stepNumber}/supervisor-notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes })
  });
}

export async function deleteSupervisorNotes(caseId, stepNumber) {
  if (!caseId || !stepNumber) throw new Error('Case ID and step number required');
  return request(`/cases/${encodeURIComponent(caseId)}/steps/${stepNumber}/supervisor-notes`, {
    method: 'DELETE'
  });
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
  getDistricts,
  updateSupervisorNotes, deleteSupervisorNotes
};
export default api;
