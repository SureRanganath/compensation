import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const alertColors = {
  OVERDUE: 'bg-red-50 border-red-200 text-red-800',
  STALLED: 'bg-red-50 border-red-200 text-red-800',
  MISSING_DOCS: 'bg-amber-50 border-amber-200 text-amber-800',
  PENDING_APPROVAL: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [msg, setMsg] = useState('');
  const [resolving, setResolving] = useState(null);
  const nav = useNavigate();

  const fetchAlerts = async () => {
    setLoading(true); setError('');
    try {
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
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Alerts</h1>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${msg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {msg} <button onClick={() => setMsg('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
          <option value="">All Types</option>
          <option value="OVERDUE">Overdue</option>
          <option value="STALLED">Stalled</option>
          <option value="MISSING_DOCS">Missing Docs</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)}
            className="rounded border-gray-300" />
          Show resolved
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading alerts...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-slate-400">
          No alerts found. All cases are up to date!
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(a => (
            <div key={a.id} className={`p-4 rounded-xl border ${alertColors[a.alert_type] || 'bg-gray-50 border-gray-200'} shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.alert_type}</span>
                    <button onClick={() => nav(`/cases/${a.case_id}`)}
                      className="text-xs font-medium underline opacity-70 hover:opacity-100">{a.fir_number}</button>
                  </div>
                  <p className="text-sm mt-1 opacity-80">{a.message}</p>
                  <div className="text-xs mt-2 opacity-60">
                    Created: {new Date(a.created_at).toLocaleDateString()}
                    {a.is_resolved && a.resolved_at && ` | Resolved: ${new Date(a.resolved_at).toLocaleDateString()}`}
                  </div>
                </div>
                {!a.is_resolved && (
                  <button onClick={() => handleResolve(a.id)} disabled={resolving === a.id}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-300 hover:bg-gray-50 font-medium transition disabled:opacity-40">
                    {resolving === a.id ? '...' : 'Resolve'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
