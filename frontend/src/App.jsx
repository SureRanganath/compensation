import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import CaseNew from './pages/CaseNew';
import AlertsPage from './pages/AlertsPage';
import WorkflowPage from './pages/WorkflowPage';
import api, { login as apiLogin, clearAuth, getAuthToken } from './utils/api';
import ChangePasswordModal from './components/ChangePasswordModal';

// ─── Role-based access ───────────────────────────────────────
const ROLE_HIERARCHY = { admin: 4, supervisor: 3, officer: 2, viewer: 1 };

function hasAccess(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ─── Login Page (Redesigned) ──────────────────────────────────
function LoginPage({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = user.trim();
    if (trimmedUser.length < 3) {
      return setError('Username must be at least 3 characters');
    }
    if (pass.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await onLogin(trimmedUser, pass, rememberMe);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Compensation Monitor</h1>
          <p className="text-sm mt-2 text-slate-500 font-medium">
            Telangana Women Safety Wing
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-slate-200" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Secure Portal
            </span>
            <span className="h-px w-8 bg-slate-200" />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-700 font-medium flex-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <input
                id="username"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                aria-label="Password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Remember me (7 days)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Dev credentials hint */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <details className="group">
            <summary className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium select-none list-none flex items-center justify-center gap-1.5">
              <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Development Access
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { role: 'Admin', user: 'admin', color: 'text-red-600' },
                { role: 'Supervisor', user: 'supervisor', color: 'text-purple-600' },
                { role: 'Officer', user: 'officer', color: 'text-blue-600' },
                { role: 'Viewer', user: 'viewer', color: 'text-green-600' },
              ].map(({ role, user, color }) => (
                <div key={role} className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">{role}</div>
                  <div className={`text-xs font-mono font-bold ${color}`}>{user}</div>
                  <div className="text-[10px] text-slate-400">Password: password123</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-white/30">
        &copy; {new Date().getFullYear()} Telangana Women Safety Wing &bull; Secure System
      </div>
    </div>
  );
}

// ─── Layout ──────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',     path: '/',           icon: '📊', minRole: 'viewer' },
  { label: 'Cases',         path: '/cases',      icon: '📋', minRole: 'viewer' },
  { label: 'Alerts',        path: '/alerts',     icon: '⚠️', minRole: 'supervisor' },
  { label: 'Workflow',      path: '/workflow',   icon: '🔄', minRole: 'viewer' },
];

const roleLabels = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  officer: 'Case Officer',
  viewer: 'Viewer',
};

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  supervisor: 'bg-purple-100 text-purple-700',
  officer: 'bg-blue-100 text-blue-700',
  viewer: 'bg-green-100 text-green-700',
};

function AppLayout({ user, role, displayName, onLogout }) {
  const [open, setOpen] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Listen for auth expiration events
  useEffect(() => {
    const handler = () => {
      onLogout();
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [onLogout]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`flex flex-col flex-shrink-0 bg-slate-900 text-white transition-all duration-200 ${open ? 'w-60' : 'w-16'}`} style={{ overflow: 'hidden auto' }}>
        <div className="flex items-center gap-2.5 p-4 border-b border-white/10">
          <button
            onClick={() => setOpen(s => !s)}
            className="text-xl hover:bg-white/5 rounded-lg p-1 transition"
            aria-label="Toggle sidebar"
          >
            {open ? '\u2715' : '\u2630'}
          </button>
          {open && (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="font-bold text-sm whitespace-nowrap">WSW Monitor</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2">
          {navItems.filter(item => hasAccess(role, item.minRole)).map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }>
              <span className="text-base">{item.icon}</span>
              {open && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info & logout */}
        <div className="p-3 text-xs border-t border-white/10 text-slate-400">
          {open && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs truncate">{displayName || user}</div>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[role] || 'bg-gray-100 text-gray-700'}`}>
                    {roleLabels[role] || role}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Change Password button */}
          <button onClick={() => setShowChangePassword(true)}
            className="w-full mb-1.5 py-2 rounded-md text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-400 transition flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            {open && <span>Change Password</span>}
          </button>
          <button onClick={onLogout}
            className="w-full py-2 rounded-md text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-400 transition flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {open && <span>Sign Out</span>}
          </button>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePasswordModal
            onClose={() => setShowChangePassword(false)}
          />
        )}
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases" element={<CaseList />} />
            <Route path="/cases/new" element={<CaseNew />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(() => {
    const t = getAuthToken();
    const u = sessionStorage.getItem('auth_user');
    const r = sessionStorage.getItem('auth_role');
    if (t && u) {
      try {
        const userData = JSON.parse(u);
        return {
          user: userData.username,
          role: userData.role || r || 'viewer',
          displayName: userData.display_name || userData.username,
          id: userData.id
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const handleLogin = async (username, password, rememberMe = false) => {
    const result = await apiLogin(username, password, rememberMe);
    setAuth({
      user: result.user.username,
      role: result.user.role,
      displayName: result.user.display_name,
      id: result.user.id
    });
  };

  const handleLogout = useCallback(() => {
    clearAuth();
    setAuth(null);
  }, []);

  return (
    <BrowserRouter>
      {auth ? (
        <AppLayout
          user={auth.user}
          role={auth.role}
          displayName={auth.displayName}
          onLogout={handleLogout}
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </BrowserRouter>
  );
}
