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
    responsible_officer: '', responsible_agency: '', notes: ''
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
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">New Case</h1>
        <button onClick={() => nav('/cases')} className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition">&larr; Back</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">FIR Number *</label>
            <input value={form.fir_number} onChange={e => update('fir_number', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., FIR-2025-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CC Number</label>
            <input value={form.cc_number} onChange={e => update('cc_number', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., CC-2025-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Case Type *</label>
            <select value={form.case_type} onChange={e => update('case_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <select value={form.district_id} onChange={e => update('district_id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              <option value="">Select District</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Source *</label>
            <select value={form.data_source} onChange={e => update('data_source', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              {dataSources.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of FIR *</label>
            <input type="date" value={form.date_of_fir} onChange={e => update('date_of_fir', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Victim Age</label>
            <input type="number" value={form.victim_age} onChange={e => update('victim_age', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" min="0" max="120" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Victim Gender</label>
            <select value={form.victim_gender} onChange={e => update('victim_gender', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Compensation Type</label>
            <select value={form.comp_type} onChange={e => update('comp_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none">
              {compTypes.map(t => <option key={t} value={t}>{t || 'Select type'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Approved (&#8377;)</label>
            <input type="number" value={form.comp_amount_approved} onChange={e => update('comp_amount_approved', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Responsible Officer</label>
            <input value={form.responsible_officer} onChange={e => update('responsible_officer', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Responsible Agency</label>
            <input value={form.responsible_agency} onChange={e => update('responsible_agency', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.eligible_for_compensation} onChange={e => update('eligible_for_compensation', e.target.checked)}
              className="rounded border-gray-300" />
            Eligible for Compensation
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Case'}
          </button>
          <button type="button" onClick={() => nav('/cases')}
            className="px-6 py-2.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition">Cancel</button>
        </div>
      </form>
    </div>
  );
}
