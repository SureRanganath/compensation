import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const caseTypeColors = { POCSO: 'bg-blue-100 text-blue-800', RAPE: 'bg-orange-100 text-orange-800', ITPA: 'bg-red-100 text-red-800', OTHER_CAW: 'bg-gray-100 text-gray-700', CHILD_VICTIM: 'bg-purple-100 text-purple-800' };
const statusColors = { ACTIVE: 'bg-amber-100 text-amber-800', STALLED: 'bg-red-100 text-red-800', PAID: 'bg-green-100 text-green-800', CLOSED: 'bg-gray-100 text-gray-600', UNDER_REVIEW: 'bg-purple-100 text-purple-800' };

export default function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districts, setDistricts] = useState([]);
  const [districtFilter, setDistrictFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const role = sessionStorage.getItem('auth_role') || 'viewer';
  const isAdmin = role === 'admin';
  const nav = useNavigate();

  const fetchCases = useCallback(async (p = 1) => {
    setLoading(true); setError('');
    try {
      const res = await api.getCases({ search, type: typeFilter, status: statusFilter, district: districtFilter, page: p, limit: 20 });
      setCases(res.items || []);
      setTotal(res.total || 0);
      setPage(p);
    } catch (e) {
      setError(e.message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, districtFilter]);

  useEffect(() => { fetchCases(1); }, [fetchCases]);

  useEffect(() => {
    (async () => { try { const d = await api.getDistricts(); setDistricts(d); } catch (e) {} })();
  }, []);

  const handleDelete = async (e, caseId) => {
    e.stopPropagation();
    if (!window.confirm('Permanently delete this case? This action cannot be undone. All case data, steps, notes, alerts, and audit logs will be removed.')) return;
    setDeletingId(caseId);
    try {
      await api.deleteCase(caseId);
      setCases(prev => prev.filter(c => c.id !== caseId));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Case Management</h1>
        {isAdmin && (
          <button onClick={() => nav('/cases/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + New Case
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FIR or CC number..."
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
            <option value="">All Types</option>
            <option value="POCSO">POCSO</option>
            <option value="RAPE">Rape</option>
            <option value="ITPA">ITPA</option>
            <option value="OTHER_CAW">Other CAW</option>
            <option value="CHILD_VICTIM">Child Victim</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="STALLED">Stalled</option>
            <option value="PAID">Paid</option>
            <option value="CLOSED">Closed</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
            <option value="">All Districts</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No cases found. Create a new case to get started.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">FIR #</th>
                    <th className="px-4 py-3 font-medium">CC #</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">District</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    {isAdmin && <th className="px-4 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => nav(`/cases/${c.id}`)}>
                      <td className="px-4 py-3 font-medium text-blue-600">{c.fir_number}</td>
                      <td className="px-4 py-3 text-slate-500">{c.cc_number || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${caseTypeColors[c.case_type] || 'bg-gray-100 text-gray-700'}`}>{c.case_type}</span>
                      </td>
                      <td className="px-4 py-3">{c.district_name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5,6,7,8,9].map(s => (
                              <div key={s} className={`w-2 h-2 rounded-full ${s <= c.current_step ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{c.current_step}/9</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '-'}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <button onClick={e => handleDelete(e, c.id)} disabled={deletingId === c.id}
                            className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition disabled:opacity-40">
                            {deletingId === c.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="text-sm text-slate-500">{total} total case{total !== 1 ? 's' : ''}</div>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => fetchCases(page - 1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition">Previous</button>
                <span className="px-3 py-1.5 text-sm text-slate-500">Page {page} of {totalPages || 1}</span>
                <button disabled={page >= totalPages} onClick={() => fetchCases(page + 1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
