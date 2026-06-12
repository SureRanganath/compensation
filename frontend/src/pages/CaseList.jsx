import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const caseTypeColors = {
  POCSO: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  RAPE: { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  ITPA: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  OTHER_CAW: { bg: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  CHILD_VICTIM: { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const statusConfig = {
  ACTIVE: { label: 'Active', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  STALLED: { label: 'Stalled', bg: 'bg-red-100 text-red-800 border-red-200', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
  PAID: { label: 'Paid', bg: 'bg-green-100 text-green-800 border-green-200', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
};

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

// ─── Case Card Component ──────────────────────────────────────
function CaseCard({ c, isAdmin, deletingId, onDelete, onNavigate }) {
  const typeColor = caseTypeColors[c.case_type] || caseTypeColors.OTHER_CAW;
  const status = statusConfig[c.status] || statusConfig.ACTIVE;
  const stepPct = Math.min(100, ((c.current_step || 0) / 9) * 100);

  return (
    <div
      className="card card-hover cursor-pointer group animate-fade-in-up overflow-hidden"
      onClick={() => onNavigate(c.id)}
    >
      <div className="p-5">
        {/* Top row: Case type dot + FIR + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full ${typeColor.dot} shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <h3 className="font-semibold text-blue-600 group-hover:text-blue-800 transition-colors text-sm truncate">
                {c.fir_number}
              </h3>
              {c.cc_number && (
                <p className="text-xs text-slate-400 truncate">CC: {c.cc_number}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${status.bg}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={status.icon} />
              </svg>
              {status.label}
            </span>
          </div>
        </div>

        {/* Middle: District + Type + Progress */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="font-medium text-slate-600">{c.district_name || '-'}</span>
          </div>
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor.bg}`}>
            {c.case_type}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Progress</span>
            <span className="text-[11px] font-medium text-slate-500 tabular-nums">{c.current_step || 0}/9 steps</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                stepPct <= 33 ? 'bg-amber-400' :
                stepPct <= 66 ? 'bg-blue-500' :
                'bg-green-500'
              }`}
              style={{ width: `${stepPct}%` }}
            />
          </div>
        </div>

        {/* Bottom row: Date + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {c.updated_at
              ? new Date(c.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : '-'}
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {isAdmin && (
              <button
                onClick={e => onDelete(e, c.id)}
                disabled={deletingId === c.id}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-700 hover:underline transition disabled:opacity-40"
              >
                {deletingId === c.id ? (
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            )}
            <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
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
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const role = sessionStorage.getItem('auth_role') || 'viewer';
  const isAdmin = role === 'admin';
  const nav = useNavigate();

  // ─── Client-side sort handler (for table view) ──────────────
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ─── Sort cases by the selected field ────────────────────────
  const sortedTableCases = [...cases].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'current_step') {
      aVal = a.current_step || 0;
      bVal = b.current_step || 0;
    }
    if (sortField === 'updated_at') {
      aVal = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      bVal = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const numA = Number(aVal) || 0;
    const numB = Number(bVal) || 0;
    return sortDir === 'asc' ? numA - numB : numB - numA;
  });

  // ─── Sort icon ───────────────────────────────────────────────
  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-slate-300 group-hover:text-slate-400 transition-colors ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 ml-1 inline-block text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        {sortDir === 'asc' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        )}
      </svg>
    );
  };

  const SortHeader = ({ field, children, className = '' }) => (
    <th className={`cursor-pointer select-none group ${className}`} onClick={() => handleSort(field)}>
      <div className="inline-flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Case Management</h1>
          <p className="text-sm text-slate-500 mt-1">View, filter, and manage compensation cases</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Card view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h2.25m-2.25 0a1.125 1.125 0 01-1.125 1.125M12 12h2.25m-2.25 0a1.125 1.125 0 001.125 1.125M13.125 12l.375 1.5M10.875 12l-.375 1.5" />
              </svg>
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => nav('/cases/new')} className="btn btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Case
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <FilterIcon />
          Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FIR or CC number..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
            <option value="">All Types</option>
            <option value="POCSO">POCSO</option>
            <option value="RAPE">Rape</option>
            <option value="ITPA">ITPA</option>
            <option value="OTHER_CAW">Other CAW</option>
            <option value="CHILD_VICTIM">Child Victim</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="STALLED">Stalled</option>
            <option value="PAID">Paid</option>
            <option value="CLOSED">Closed</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
            <option value="">All Districts</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-5">
                <div className="skeleton h-4 w-32 mb-3" />
                <div className="skeleton h-3 w-24 mb-4" />
                <div className="skeleton h-2 w-full mb-2" />
                <div className="skeleton h-3 w-20 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <div className="p-8 text-center">
              <div className="skeleton h-4 w-40 mx-auto mb-4" />
              <div className="skeleton h-8 w-full mb-2" />
              <div className="skeleton h-8 w-full mb-2" />
              <div className="skeleton h-8 w-full" />
            </div>
          </div>
        )
      ) : cases.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-14 h-14 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-slate-500 font-medium">No cases found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or create a new case.</p>
        </div>
      ) : viewMode === 'card' ? (
        <>
          {/* Card View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map(c => (
              <CaseCard
                key={c.id}
                c={c}
                isAdmin={isAdmin}
                deletingId={deletingId}
                onDelete={handleDelete}
                onNavigate={(id) => nav(`/cases/${id}`)}
              />
            ))}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500">
              <span className="font-medium">{total}</span> total case{total !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2 items-center">
              <button disabled={page <= 1} onClick={() => fetchCases(page - 1)}
                className="btn btn-secondary text-xs py-1.5 px-3">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Previous
              </button>
              <span className="text-sm text-slate-500 px-2 tabular-nums">
                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages || 1}</span>
              </span>
              <button disabled={page >= totalPages} onClick={() => fetchCases(page + 1)}
                className="btn btn-secondary text-xs py-1.5 px-3">
                Next
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Table View — card-matched design */}
          <div className="table-container overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <SortHeader field="fir_number" className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">FIR #</SortHeader>
                  <SortHeader field="case_type" className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">Type</SortHeader>
                  <SortHeader field="district_name" className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">District</SortHeader>
                  <SortHeader field="cc_number" className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">CC #</SortHeader>
                  <SortHeader field="current_step" className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">Progress</SortHeader>
                  <SortHeader field="status" className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">Status</SortHeader>
                  <SortHeader field="updated_at" className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">Updated</SortHeader>
                  {isAdmin && <th className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 text-center">Actions</th>}
                  <th className="px-4 py-3.5 w-8 bg-slate-50/50 border-b border-slate-100" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedTableCases.map(c => {
                  const typeColor = caseTypeColors[c.case_type] || caseTypeColors.OTHER_CAW;
                  const status = statusConfig[c.status] || statusConfig.ACTIVE;
                  const stepPct = Math.min(100, ((c.current_step || 0) / 9) * 100);
                  return (
                    <tr key={c.id} className="group cursor-pointer transition-all duration-150 hover:bg-blue-50/40 active:bg-slate-100" onClick={() => nav(`/cases/${c.id}`)}>
                      {/* FIR # with type dot */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${typeColor.dot} shrink-0`} />
                          <span className="font-medium text-blue-600 group-hover:text-blue-800 transition-colors text-sm">
                            {c.fir_number}
                          </span>
                        </div>
                      </td>
                      {/* Case Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${typeColor.bg}`}>
                          {c.case_type}
                        </span>
                      </td>
                      {/* District with icon */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          {c.district_name || '-'}
                        </div>
                      </td>
                      {/* CC Number */}
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {c.cc_number || '-'}
                      </td>
                      {/* Progress bar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                stepPct <= 33 ? 'bg-amber-400' :
                                stepPct <= 66 ? 'bg-blue-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${stepPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 tabular-nums">{c.current_step || 0}/9</span>
                        </div>
                      </td>
                      {/* Status with icon */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${status.bg}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={status.icon} />
                          </svg>
                          {status.label}
                        </span>
                      </td>
                      {/* Updated date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="tabular-nums">
                            {c.updated_at
                              ? new Date(c.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                          </span>
                        </div>
                      </td>
                      {/* Actions */}
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <button onClick={e => handleDelete(e, c.id)} disabled={deletingId === c.id}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition disabled:opacity-40">
                            {deletingId === c.id ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            )}
                          </button>
                        </td>
                      )}
                      {/* Arrow indicator */}
                      <td className="px-4 py-3">
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                <span className="font-medium">{total}</span> total case{total !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2 items-center">
                <button disabled={page <= 1} onClick={() => fetchCases(page - 1)}
                  className="btn btn-secondary text-xs py-1.5 px-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Previous
                </button>
                <span className="text-sm text-slate-500 px-2 tabular-nums">
                  Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages || 1}</span>
                </span>
                <button disabled={page >= totalPages} onClick={() => fetchCases(page + 1)}
                  className="btn btn-secondary text-xs py-1.5 px-3">
                  Next
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
