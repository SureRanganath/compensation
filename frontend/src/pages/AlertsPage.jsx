import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const alertConfig = {
  OVERDUE: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: 'text-red-500', label: 'Overdue' },
  STALLED: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: 'text-red-500', label: 'Stalled' },
  STALLED_15D: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', icon: 'text-orange-500', label: 'No Progress (15d+)' },
  MISSING_DOCS: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: 'text-amber-500', label: 'Missing Docs' },
  PENDING_APPROVAL: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: 'text-blue-500', label: 'Pending Approval' },
};

function AlertIcon({ type }) {
  const color = alertConfig[type]?.icon || 'text-slate-500';
  return (
    <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [msg, setMsg] = useState('');
  const [resolving, setResolving] = useState(null);
  const nav = useNavigate();

  const fetchAlerts = async (skipCheck = false) => {
    setLoading(true); setError('');
    try {
      // First run the stagnation check to auto-generate alerts for stale cases
      if (!skipCheck) {
        try { await api.checkStagnation(15); } catch (e) { /* non-critical */ }
      }
      const data = await api.getAlerts({ type: filter || undefined, resolved: showResolved ? 'true' : 'false' });
      setAlerts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [filter, showResolved]);

  const handleResolve = async (alertId) => {
    setResolving(alertId);
    try {
      await api.resolveAlert(alertId);
      setMsg('Alert resolved');
      await fetchAlerts();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Alerts</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor and manage case alerts and escalations</p>
      </div>

      {msg && (
        <div className={`mb-4 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5 shadow-sm ${
          msg.startsWith('Error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {msg.startsWith('Error') ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <span className="flex-1">{msg}</span>
          <button onClick={() => setMsg('')} className="font-bold opacity-70 hover:opacity-100 transition">&times;</button>
        </div>
      )}

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filters</span>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
          <option value="">All Types</option>
          <option value="OVERDUE">Overdue</option>
          <option value="STALLED">Stalled</option>
          <option value="STALLED_15D">No Progress (15d+)</option>
          <option value="MISSING_DOCS">Missing Docs</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none ml-auto">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Show resolved
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-3 w-64 mb-1" />
              <div className="skeleton h-3 w-48" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      ) : alerts.length === 0 && !loading ? (
        <div className="card p-12 text-center">
          <svg className="w-14 h-14 mx-auto text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-500 font-medium">All clear!</p>
          <p className="text-sm text-slate-400 mt-1">No alerts found. All cases are up to date!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const config = alertConfig[a.alert_type] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', icon: 'text-slate-500' };
            return (
              <div key={a.id} className={`${config.bg} border rounded-xl p-4 card-hover animate-fade-in-up`} style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <AlertIcon type={a.alert_type} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${config.text}`}>{config.label || a.alert_type}</span>
                        <button onClick={() => nav(`/cases/${a.case_id}`)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 underline transition">
                          {a.fir_number}
                        </button>
                      </div>
                      <p className="text-sm mt-1 text-slate-600">{a.message}</p>
                      <div className="text-xs mt-2 text-slate-400">
                        Created: {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {a.is_resolved && a.resolved_at && ` | Resolved: ${new Date(a.resolved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                      </div>
                    </div>
                  </div>
                  {!a.is_resolved && (
                    <button onClick={() => handleResolve(a.id)} disabled={resolving === a.id}
                      className="btn btn-success text-xs py-1.5 px-3 shrink-0">
                      {resolving === a.id ? (
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Resolve</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
