import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>;

  const statusColors = {
    ACTIVE: 'bg-amber-100 text-amber-800',
    STALLED: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-600',
    UNDER_REVIEW: 'bg-purple-100 text-purple-800',
  };

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
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Cases</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{totalCases}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{activeCases}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{paidCases}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stalled</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{stalledCases}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cases by District */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Cases by District</h3>
          <div className="space-y-2">
            {stats?.byDistrict?.filter(d => d.count > 0).slice(0, 10).map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-32 truncate">{d.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, (parseInt(d.count) / Math.max(...stats.byDistrict.filter(x => x.count > 0).map(x => parseInt(x.count)))) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-8 text-right">{d.count}</span>
              </div>
            ))}
            {(!stats?.byDistrict || stats.byDistrict.filter(d => d.count > 0).length === 0) && (
              <p className="text-sm text-slate-400">No district data</p>
            )}
          </div>
        </div>

        {/* Cases by Type */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Cases by Type</h3>
          <div className="flex flex-wrap gap-3">
            {stats?.byType?.map(t => {
              const colors = { POCSO: 'bg-blue-100 text-blue-800', RAPE: 'bg-orange-100 text-orange-800', ITPA: 'bg-red-100 text-red-800', OTHER_CAW: 'bg-gray-100 text-gray-700', CHILD_VICTIM: 'bg-purple-100 text-purple-800' };
              return (
                <div key={t.case_type} className={`px-4 py-3 rounded-lg text-center ${colors[t.case_type] || 'bg-gray-100 text-gray-700'}`}>
                  <div className="text-lg font-bold">{t.count}</div>
                  <div className="text-xs font-medium">{t.case_type}</div>
                </div>
              );
            })}
          </div>
          {stats?.avgDaysToPayment && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs font-semibold text-green-700">Avg Days to Payment</div>
              <div className="text-xl font-bold text-green-800">{stats.avgDaysToPayment} days</div>
            </div>
          )}
        </div>
      </div>

      {/* Stalled Cases */}
      {stats?.stalledCases?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Cases Needing Attention</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b border-gray-200">
                <tr><th className="pb-2 font-medium">FIR #</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">Step</th><th className="pb-2 font-medium">District</th><th className="pb-2 font-medium">Status</th></tr>
              </thead>
              <tbody>
                {stats.stalledCases.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => nav(`/cases/${c.id}`)}>
                    <td className="py-2.5 font-medium text-blue-600">{c.fir_number}</td>
                    <td className="py-2.5">{c.case_type}</td>
                    <td className="py-2.5">Step {c.current_step}/9</td>
                    <td className="py-2.5">{c.district_name}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unresolved Alerts Banner */}
      {stats?.stalledCount > 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <span className="text-lg">&#x26A0;&#xFE0F;</span>
          <div>
            <div className="font-semibold text-amber-800">{stats.stalledCount} case{stats.stalledCount > 1 ? 's' : ''} stalled</div>
            <div className="text-sm text-amber-700">View <button onClick={() => nav('/alerts')} className="underline font-medium">alerts page</button> for details</div>
          </div>
        </div>
      )}
    </div>
  );
}
