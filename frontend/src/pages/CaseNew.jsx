import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const caseTypes = ['POCSO', 'RAPE', 'ITPA', 'OTHER_CAW', 'CHILD_VICTIM'];
const dataSources = ['BHAROSA', 'AHTU_PMU', 'ACP_LAW_ORDER', 'DLSA', 'OTHER'];
const compTypes = ['', 'INTERIM', 'FINAL', 'SPECIAL', 'INTERIM_AND_FINAL'];

export default function CaseNew() {
  const nav = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState({
    fir_number: '', cc_number: '', case_type: 'POCSO', district_id: '',
    data_source: 'BHAROSA', date_of_fir: '', victim_age: '', victim_gender: 'Female',
    eligible_for_compensation: true, comp_type: '', comp_amount_approved: '',
    responsible_officer: '', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => { try { const d = await api.getDistricts(); setDistricts(d); } catch (e) {} })();
  }, []);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fir_number || !form.date_of_fir) {
      return setError('FIR Number and Date of FIR are required');
    }
    setLoading(true); setError('');
    try {
      const res = await api.createCase({
        ...form,
        district_id: form.district_id ? parseInt(form.district_id) : null,
        victim_age: form.victim_age ? parseInt(form.victim_age) : null,
        comp_amount_approved: form.comp_amount_approved ? parseFloat(form.comp_amount_approved) : null,
        eligible_for_compensation: form.eligible_for_compensation === true || form.eligible_for_compensation === 'true'
      });
      nav(`/cases/${res.case.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Case</h1>
          <p className="text-sm text-slate-500 mt-1">Create a new compensation case record</p>
        </div>
        <button onClick={() => nav('/cases')} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700">Case Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">FIR Number <span className="text-red-500">*</span></label>
              <input value={form.fir_number} onChange={e => update('fir_number', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="e.g., FIR-2025-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CC Number</label>
              <input value={form.cc_number} onChange={e => update('cc_number', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="e.g., CC-2025-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Case Type <span className="text-red-500">*</span></label>
              <select value={form.case_type} onChange={e => update('case_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
              <select value={form.district_id} onChange={e => update('district_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                <option value="">Select District</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Source <span className="text-red-500">*</span></label>
              <select value={form.data_source} onChange={e => update('data_source', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                {dataSources.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of FIR <span className="text-red-500">*</span></label>
              <input type="date" value={form.date_of_fir} onChange={e => update('date_of_fir', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700">Victim Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Victim Age</label>
              <input type="number" value={form.victim_age} onChange={e => update('victim_age', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                min="0" max="120" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Victim Gender</label>
              <select value={form.victim_gender} onChange={e => update('victim_gender', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700">Compensation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Compensation Type</label>
              <select value={form.comp_type} onChange={e => update('comp_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                {compTypes.map(t => <option key={t} value={t}>{t || 'Select type'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount Approved (&#8377;)</label>
              <input type="number" value={form.comp_amount_approved} onChange={e => update('comp_amount_approved', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                min="0" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700">Assignment</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Responsible Officer</label>
            <input value={form.responsible_officer} onChange={e => update('responsible_officer', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700">Notes & Eligibility</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <input type="checkbox" checked={form.eligible_for_compensation} onChange={e => update('eligible_for_compensation', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
              <span>Eligible for Compensation</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                rows={3} placeholder="Any additional notes about this case..." />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" disabled={loading}
            className="btn btn-primary">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Creating...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Create Case</>
            )}
          </button>
          <button type="button" onClick={() => nav('/cases')}
            className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
