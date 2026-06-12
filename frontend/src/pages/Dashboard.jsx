import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function StatCard({ label, value, color, icon, delay = 0 }) {
  const colorMap = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', icon: 'text-blue-500', bar: 'stat-card-blue' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', icon: 'text-amber-500', bar: 'stat-card-amber' },
    green: { text: 'text-green-600', bg: 'bg-green-50', icon: 'text-green-500', bar: 'stat-card-green' },
    red: { text: 'text-red-600', bg: 'bg-red-50', icon: 'text-red-500', bar: 'stat-card-red' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`card card-hover p-5 stat-card ${c.bar} animate-fade-in-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-bold ${c.text} mt-1`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    ACTIVE: 'bg-amber-100 text-amber-800 border-amber-200',
    STALLED: 'bg-red-100 text-red-800 border-red-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
    UNDER_REVIEW: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return (
    <span className={`badge border ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // Run stagnation check first to auto-generate alerts for stale cases
        try { await api.checkStagnation(15); } catch (e) { /* non-critical */ }
        
        // Fetch dashboard stats and recent alerts in parallel
        const [data, alertsData] = await Promise.all([
          api.getDashboardStats(),
          api.getAlerts({ resolved: 'false' })
        ]);
        setStats(data);
        setRecentAlerts(alertsData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      {error}
    </div>
  );

  const findStatusCount = (status) => {
    const s = stats?.byStatus?.find(s => s.status === status);
    return s ? parseInt(s.count) : 0;
  };

  const totalCases = stats?.total || 0;
  const activeCases = findStatusCount('ACTIVE');
  const paidCases = findStatusCount('PAID');
  const stalledCases = findStatusCount('STALLED');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of compensation case statistics</p>
        </div>
        <div className="text-xs text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Cases"
          value={totalCases}
          color="blue"
          delay={0}
          icon={
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
        />
        <StatCard
          label="Active"
          value={activeCases}
          color="amber"
          delay={0.05}
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Paid"
          value={paidCases}
          color="green"
          delay={0.1}
          icon={
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Stalled"
          value={stalledCases}
          color="red"
          delay={0.15}
          icon={
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Cases by District */}
        <div className="card p-5 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700">Cases by District</h3>
          </div>
          <div className="space-y-3">
            {stats?.byDistrict?.filter(d => parseInt(d.count) > 0).slice(0, 10).map((d, i) => {
              const maxCount = Math.max(1, ...stats.byDistrict.filter(x => parseInt(x.count) > 0).map(x => parseInt(x.count)));
              const pct = Math.max(3, (parseInt(d.count) / maxCount) * 100);
              return (
                <div key={d.name} className="flex items-center gap-3 group">
                  <span className="text-sm text-slate-600 w-32 truncate font-medium">{d.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out group-hover:from-blue-600 group-hover:to-blue-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right tabular-nums">{d.count}</span>
                </div>
              );
            })}
            {(!stats?.byDistrict || stats.byDistrict.filter(d => parseInt(d.count) > 0).length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">No district data available</p>
            )}
          </div>
        </div>

        {/* Cases by Type */}
        <div className="card p-5 animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700">Cases by Type</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats?.byType?.map((t, i) => {
              const typeColors = {
                POCSO: { bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'text-blue-500' },
                RAPE: { bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'text-orange-500' },
                ITPA: { bg: 'bg-red-100 text-red-800 border-red-200', icon: 'text-red-500' },
                OTHER_CAW: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'text-slate-500' },
                CHILD_VICTIM: { bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: 'text-purple-500' },
              };
              const c = typeColors[t.case_type] || typeColors.OTHER_CAW;
              return (
                <div
                  key={t.case_type}
                  className={`${c.bg} border px-4 py-3 rounded-xl text-center min-w-[100px] card-hover animate-fade-in-up`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="text-xl font-bold">{t.count}</div>
                  <div className="text-xs font-medium mt-0.5">{t.case_type.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
          {stats?.avgDaysToPayment && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Avg Days to Payment</div>
                <div className="text-xl font-bold text-green-800">{stats.avgDaysToPayment} days</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cases Needing Attention — Alerts & Stalled Cases */}
      {(recentAlerts.length > 0 || stats?.stalledCases?.length > 0) && (
        <div className="card overflow-hidden mb-6 animate-fade-in-up stagger-5">
          {/* Section header */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Cases Needing Attention</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Recent alerts and stalled cases requiring action</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {recentAlerts.length} alert{recentAlerts.length !== 1 ? 's' : ''}
                </span>
                <button 
                  onClick={() => nav('/alerts')} 
                  className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition flex items-center gap-1"
                >
                  View all alerts
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Alerts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 text-left whitespace-nowrap">Type / Alert</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 text-left whitespace-nowrap">FIR #</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 text-left whitespace-nowrap">Progress</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 text-left whitespace-nowrap">District</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 text-left whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentAlerts.map((a, i) => {
                  const config = {
                    OVERDUE: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
                    STALLED: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
                    STALLED_15D: { bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
                    MISSING_DOCS: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
                    PENDING_APPROVAL: { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400' },
                  };
                  const c = config[a.alert_type] || { bg: 'bg-slate-50', dot: 'bg-slate-400' };
                  const daysSince = Math.floor((Date.now() - new Date(a.created_at)) / 86400000);
                  return (
                    <tr
                      key={a.id}
                      className="clickable group transition-all duration-150 hover:bg-red-50/40"
                      onClick={() => nav(`/cases/${a.case_id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                          <div>
                            <span className={`text-xs font-semibold ${
                              a.alert_type === 'OVERDUE' ? 'text-red-700' :
                              a.alert_type === 'STALLED' ? 'text-red-700' :
                              a.alert_type === 'STALLED_15D' ? 'text-orange-700' :
                              a.alert_type === 'MISSING_DOCS' ? 'text-amber-700' :
                              a.alert_type === 'PENDING_APPROVAL' ? 'text-blue-700' :
                              'text-slate-700'
                            }`}>
                              {a.alert_type === 'STALLED_15D' ? 'No Progress (15d+)' :
                               a.alert_type === 'MISSING_DOCS' ? 'Missing Docs' :
                               a.alert_type === 'PENDING_APPROVAL' ? 'Pending Approval' :
                               a.alert_type}
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[260px]">{a.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-blue-600 group-hover:text-blue-800 transition-colors text-sm">
                          {a.fir_number}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                (a.current_step || 0) <= 3 ? 'bg-red-400' :
                                (a.current_step || 0) <= 6 ? 'bg-amber-400' :
                                'bg-green-400'
                              }`}
                              style={{ width: `${((a.current_step || 0) / 9) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 tabular-nums">
                            {a.current_step || '?'}/9
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          {a.district_name || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-500 tabular-nums">
                          {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          {daysSince > 0 && <span className="ml-1">({daysSince}d ago)</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Click any row to view case details — Alerts auto-generate after 15 days of no step progress
            </div>
            <button 
              onClick={() => nav('/cases')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition flex items-center gap-1"
            >
              View all cases
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Unresolved Alerts Banner */}
      {stats?.stalledCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-amber-800">{stats.stalledCount} case{stats.stalledCount > 1 ? 's' : ''} stalled</div>
            <div className="text-sm text-amber-700">View <button onClick={() => nav('/alerts')} className="underline font-semibold hover:text-amber-900">alerts page</button> for details</div>
          </div>
          <button onClick={() => nav('/alerts')} className="btn btn-secondary text-xs">
            View Alerts
          </button>
        </div>
      )}
    </div>
  );
}
