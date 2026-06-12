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
import './App.css';

// ─── Role-based access ───────────────────────────────────────
const ROLE_HIERARCHY = { admin: 4, supervisor: 3, officer: 2, viewer: 1 };

function hasAccess(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ─── Animated background particles for login ──────────────────
function LoginBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 -left-20 w-[300px] h-[300px] rounded-full bg-cyan-400/8 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-1/3 -right-20 w-[300px] h-[300px] rounded-full bg-violet-400/8 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
}

// ─── Login Page (Enhanced) ──────────────────────────────────
function LoginPage({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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

  const inputClass = (field) =>
    `w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-all duration-200 bg-white/80 ${
      focusedField === field
        ? 'border-blue-500 ring-2 ring-blue-500/20'
        : error && !user && field === 'username'
        ? 'border-red-300 bg-red-50/50'
        : error && !pass && field === 'password'
        ? 'border-red-300 bg-red-50/50'
        : 'border-slate-300 hover:border-slate-400'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 30%, #1e3a8a 70%, #1d4ed8 100%)' }}>
      
      <LoginBackground />

      {/* Animated security badge - floating */}
      <div className="absolute top-8 left-8 flex items-center gap-2 text-white/40 text-xs font-medium animate-fade-in">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span>Government Secure System</span>
      </div>

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/20">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 mb-4 shadow-lg shadow-blue-600/20 animate-scale-in">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Compensation Monitor</h1>
            <p className="text-sm mt-2 text-slate-500 font-medium">
              Telangana Women Safety Wing
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Secure Portal
              </span>
              <span className="h-px w-8 bg-slate-200" />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 animate-slide-in-left">
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
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === 'username' ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <input
                  id="username"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your username"
                  className={inputClass('username')}
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
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  aria-label="Password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  className={inputClass('password')}
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
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
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
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
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
              <summary className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium select-none list-none flex items-center justify-center gap-1.5 transition-colors">
                <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Development Access
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
                {[
                  { role: 'Admin', user: 'admin', color: 'text-red-600', bg: 'bg-red-50' },
                  { role: 'Supervisor', user: 'supervisor', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { role: 'Officer', user: 'officer', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { role: 'Viewer', user: 'viewer', color: 'text-green-600', bg: 'bg-green-50' },
                ].map(({ role, user, color, bg }) => (
                  <div key={role} className={`${bg} rounded-lg p-2.5 text-center border border-transparent hover:border-slate-200 transition`}>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{role}</div>
                    <div className={`text-xs font-mono font-bold ${color}`}>{user}</div>
                    <div className="text-[10px] text-slate-400">Pass: password123</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-white/30 tracking-wide">
        &copy; {new Date().getFullYear()} Telangana Women Safety Wing &bull; Government Secure System
      </div>
    </div>
  );
}

// ─── SVG Icons for Sidebar ────────────────────────────────────
const Icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  cases: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  alerts: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  workflow: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
};

// ─── Layout ──────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',     path: '/',           icon: Icons.dashboard, minRole: 'viewer' },
  { label: 'Cases',         path: '/cases',      icon: Icons.cases,     minRole: 'viewer' },
  { label: 'Alerts',        path: '/alerts',     icon: Icons.alerts,    minRole: 'supervisor' },
  { label: 'Workflow',      path: '/workflow',   icon: Icons.workflow,  minRole: 'viewer' },
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
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`flex flex-col flex-shrink-0 bg-slate-900 text-white transition-all duration-300 ease-in-out ${open ? 'w-60' : 'w-16'}`} style={{ overflow: 'hidden auto' }}>
        {/* Logo section */}
        <div className="flex items-center gap-2.5 p-4 border-b border-white/10 min-h-[60px]">
          <button
            onClick={() => setOpen(s => !s)}
            className="text-lg hover:bg-white/10 rounded-lg p-1.5 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
          {open && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {Icons.shield}
              </div>
              <span className="font-bold text-sm whitespace-nowrap">WSW Monitor</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 mt-2">
          {navItems.filter(item => hasAccess(role, item.minRole)).map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600/20 text-white font-semibold shadow-sm border-l-2 border-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`
              }>
              <span className="shrink-0">{item.icon}</span>
              {open && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info & actions */}
        <div className="p-3 text-xs border-t border-white/10 text-slate-400">
          {open && (
            <div className="mb-3 animate-fade-in">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-600/20">
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white text-xs truncate">{displayName || user}</div>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${roleColors[role] || 'bg-gray-100 text-gray-700'}`}>
                    {roleLabels[role] || role}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <button onClick={() => setShowChangePassword(true)}
            className="w-full mb-1.5 py-2 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 group">
            {Icons.lock}
            {open && <span>Change Password</span>}
          </button>
          
          <button onClick={onLogout}
            className="w-full py-2 rounded-md text-xs font-medium bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center gap-2 group">
            {Icons.logout}
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

      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
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
        </div>
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
