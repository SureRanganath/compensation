import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import CaseNew from './pages/CaseNew';
import AlertsPage from './pages/AlertsPage';
import WorkflowPage from './pages/WorkflowPage';

// ─── Login ────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user.length < 3) return alert('Username must be at least 3 characters');
    if (pass.length < 6) return alert('Password must be at least 6 characters');
    setLoading(true);
    setTimeout(() => { onLogin(user, pass); setLoading(false); }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-brand-900">Compensation Monitor</h1>
          <p className="text-sm mt-2 text-slate-500">Telangana Women Safety Wing</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <input value={user} onChange={e => setUser(e.target.value)} placeholder="Enter username"
              className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password"
              className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-xs mt-5 text-slate-400">
          <strong>Dev:</strong> Username 3+ chars &bull; Password 6+ chars
        </p>
      </div>
    </div>
  );
}

// ─── Layout ──────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',     path: '/',           icon: '\uD83D\uDCCA' },
  { label: 'Cases',         path: '/cases',      icon: '\uD83D\uDCCB' },
  { label: 'Alerts',        path: '/alerts',     icon: '\u26A0\uFE0F' },
  { label: 'Workflow',      path: '/workflow',   icon: '\uD83D\uDD04' },
];

function AppLayout({ user, role, onLogout }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`flex flex-col flex-shrink-0 bg-slate-900 text-white transition-all duration-200 ${open ? 'w-60' : 'w-16'}`} style={{ overflow: 'hidden auto' }}>
        <div className="flex items-center gap-2.5 p-4 border-b border-white/10">
          <span className="text-xl cursor-pointer" onClick={() => setOpen(s => !s)}>&#9776;</span>
          {open && <span className="font-bold text-sm whitespace-nowrap">WSW Monitor</span>}
        </div>
        <nav className="flex-1 p-2">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition ${
                  isActive ? 'bg-blue-600/20 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }>
              <span>{item.icon}</span>
              {open && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 text-xs border-t border-white/10 text-slate-400">
          {open && (
            <div className="mb-2">
              <div className="font-semibold text-white">{user}</div>
              <div className="capitalize text-[11px]">{role}</div>
            </div>
          )}
          <button onClick={onLogout}
            className="w-full py-2 rounded-md text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-400 transition">
            {open ? 'Sign Out' : '\u21A9'}
          </button>
        </div>
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
    const t = sessionStorage.getItem('auth_token');
    const u = sessionStorage.getItem('auth_user');
    const r = sessionStorage.getItem('auth_role');
    return t ? { user: u || 'User', role: r || 'viewer' } : null;
  });

  const handleLogin = (user, pass) => {
    const token = btoa(`${user}:${pass}`);
    const role = user.toLowerCase() === 'admin' ? 'admin' : 'viewer';
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_user', user);
    sessionStorage.setItem('auth_role', role);
    setAuth({ user, role });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_role');
    setAuth(null);
  };

  return (
    <BrowserRouter>
      {auth ? (
        <AppLayout user={auth.user} role={auth.role} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </BrowserRouter>
  );
}
