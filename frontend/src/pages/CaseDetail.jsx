import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const typeColors = { POCSO: 'bg-blue-100 text-blue-800', RAPE: 'bg-orange-100 text-orange-800', ITPA: 'bg-red-100 text-red-800', OTHER_CAW: 'bg-gray-100 text-gray-700', CHILD_VICTIM: 'bg-purple-100 text-purple-800' };
const statusColors = { ACTIVE: 'bg-amber-100 text-amber-800', STALLED: 'bg-red-100 text-red-800', PAID: 'bg-green-100 text-green-800', CLOSED: 'bg-gray-100 text-gray-600', UNDER_REVIEW: 'bg-purple-100 text-purple-800' };
const compTypeLabels = { INTERIM: 'Interim', FINAL: 'Final', SPECIAL: 'Special', INTERIM_AND_FINAL: 'Interim & Final' };

function formatCurrency(n) {
  if (!n) return '-';
  return '₹ ' + Number(n).toLocaleString('en-IN');
}

export default function CaseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(null);
  const [reverting, setReverting] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [stepNotes, setStepNotes] = useState('');
  const [stepAmount, setStepAmount] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const role = sessionStorage.getItem('auth_role') || 'viewer';
  const isAdmin = role === 'admin';
  const caseTypes = ['POCSO', 'RAPE', 'ITPA', 'OTHER_CAW', 'CHILD_VICTIM'];
  const dataSources = ['BHAROSA', 'AHTU_PMU', 'ACP_LAW_ORDER', 'DLSA', 'OTHER'];
  const compTypes = ['', 'INTERIM', 'FINAL', 'SPECIAL', 'INTERIM_AND_FINAL'];
  const statusOptions = ['ACTIVE', 'STALLED', 'PAID', 'CLOSED', 'UNDER_REVIEW'];
  const genderOptions = ['Female', 'Male', 'Other'];

  const fetchCase = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.getCase(id);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCase(); }, [id]);

  useEffect(() => {
    (async () => { try { const d = await api.getDistricts(); setDistricts(d); } catch (e) {} })();
  }, []);

  const initEditForm = (c) => {
    setEditForm({
      fir_number: c.fir_number || '',
      cc_number: c.cc_number || '',
      case_type: c.case_type || 'POCSO',
      district_id: c.district_id || '',
      data_source: c.data_source || 'BHAROSA',
      date_of_fir: c.date_of_fir ? c.date_of_fir.slice(0,10) : '',
      victim_age: c.victim_age || '',
      victim_gender: c.victim_gender || 'Female',
      eligible_for_compensation: c.eligible_for_compensation ?? true,
      comp_type: c.comp_type || '',
      comp_amount_approved: c.comp_amount_approved || '',
      comp_amount_disbursed: c.comp_amount_disbursed || '',
      status: c.status || 'ACTIVE',
      responsible_officer: c.responsible_officer || '',
      responsible_agency: c.responsible_agency || '',
      notes: c.notes || ''
    });
  };

  const handleEdit = () => {
    initEditForm(c);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditForm({});
  };

  const handleEditField = (field, value) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        district_id: editForm.district_id ? parseInt(editForm.district_id) : null,
        victim_age: editForm.victim_age ? parseInt(editForm.victim_age) : null,
        comp_amount_approved: editForm.comp_amount_approved ? parseFloat(editForm.comp_amount_approved) : null,
        comp_amount_disbursed: editForm.comp_amount_disbursed ? parseFloat(editForm.comp_amount_disbursed) : null,
        eligible_for_compensation: editForm.eligible_for_compensation === true || editForm.eligible_for_compensation === 'true'
      };
      await api.updateCase(id, payload);
      setAlertMsg('Case details updated successfully!');
      setEditing(false);
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteStep = async (stepNum) => {
    if (!window.confirm(`Mark Step ${stepNum} as complete?`)) return;
    setCompleting(stepNum);
    try {
      const payload = { notes: stepNotes };
      // Include amount for steps 5, 6, 7 if provided
      if ([5,6,7].includes(stepNum) && stepAmount !== '') {
        payload.comp_amount_approved = parseFloat(stepAmount);
      }
      await api.completeStep(id, stepNum, payload);
      setAlertMsg(`Step ${stepNum} completed!`);
      setStepNotes('');
      setStepAmount('');
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`);
    } finally {
      setCompleting(null);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!window.confirm('Mark this case as PAID? All 9 steps are complete. This will update the case status in the dashboard.')) return;
    setMarkingPaid(true);
    try {
      await api.markCaseAsPaid(id);
      setAlertMsg('Case marked as PAID! It now shows in the paid cases list on the dashboard.');
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`);
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleRevertStep = async (stepNum) => {
    if (!window.confirm(`Revert Step ${stepNum}? This will also mark all subsequent steps as incomplete. Are you sure?`)) return;
    setReverting(stepNum);
    try {
      await api.revertStep(id, stepNum);
      setAlertMsg(`Step ${stepNum} reverted. Case progress has been rolled back.`);
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`);
    } finally {
      setReverting(null);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      setAlertMsg('Alert resolved');
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading case...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>;
  if (!data?.case) return <div className="text-slate-400">Case not found</div>;

  const c = data.case;
  const steps = data.steps || [];

  return (
    <div>
      {alertMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${alertMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {alertMsg}
          <button onClick={() => setAlertMsg('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">{c.fir_number}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColors[c.case_type] || 'bg-gray-100'}`}>{c.case_type}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[c.status] || 'bg-gray-100'}`}>{c.status}</span>
          </div>
          <div className="text-sm text-slate-500">
            {c.cc_number && <span className="mr-4">CC: {c.cc_number}</span>}
            {c.district_name && <span className="mr-4">District: {c.district_name}</span>}
            <span>DOF: {c.date_of_fir ? new Date(c.date_of_fir).toLocaleDateString() : '-'}</span>
          </div>
        </div>
        <button onClick={() => nav('/cases')} className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition">
          &larr; Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: 9-Step Progress Tracker */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4">Progress Tracker</h3>
            <div className="space-y-0">
              {steps.map((step, idx) => {
                const isDone = step.completed === true;
                const prevStepsComplete = steps.filter(s => s.step_number < step.step_number).every(s => s.completed);
                const isCurrent = !isDone && prevStepsComplete;
                return (
                  <div key={step.step_number} className="flex gap-4">
                    <div className="flex flex-col items-center self-stretch">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
                        isDone ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-amber-500 border-amber-500 text-white animate-pulse' :
                        'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {isDone ? '\u2713' : step.step_number}
                      </div>
                      {idx < steps.length - 1 && <div className={`w-0.5 flex-1 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </div>
                    <div className={`pb-6 flex-1 ${!isDone && !isCurrent ? 'opacity-50' : ''}`}>
                      <div className="font-medium text-sm text-slate-700">{step.step_name}</div>
                      <div className="text-xs text-slate-400">{step.responsible_actor}</div>
                      {isDone && step.completed_at && (
                        <div className="text-xs text-green-600 mt-1">
                          Completed: {new Date(step.completed_at).toLocaleDateString()}
                        </div>
                      )}
                      {isDone && isAdmin && (
                        <button onClick={() => handleRevertStep(step.step_number)} disabled={reverting === step.step_number}
                          className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-800 underline transition disabled:opacity-40">
                          {reverting === step.step_number ? 'Reverting...' : 'Revert Step'}
                        </button>
                      )}
                      {step.required_documents && step.required_documents.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          Docs: {step.required_documents.join(', ')}
                        </div>
                      )}
                      {step.delay_reason && (
                        <div className="text-xs text-red-500 mt-1">Delay: {step.delay_reason}</div>
                      )}
                      {isCurrent && !isDone && isAdmin && (
                        <div className="mt-3 space-y-2">
                          {[5,6,7].includes(step.step_number) && (
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Approved Amount (&#8377;) — set or adjust the compensation amount
                              </label>
                              <input type="number" value={stepAmount} onChange={e => setStepAmount(e.target.value)}
                                placeholder={c.comp_amount_approved ? `Current: ${c.comp_amount_approved}` : 'e.g. 500000'} min="0"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                              {c.comp_amount_approved && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                  Current approved amount: &#8377;{Number(c.comp_amount_approved).toLocaleString('en-IN')}. Enter a new value to update.
                                </div>
                              )}
                            </div>
                          )}
                          <textarea value={stepNotes} onChange={e => setStepNotes(e.target.value)}
                            placeholder="Add notes (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                          <button onClick={() => handleCompleteStep(step.step_number)} disabled={completing === step.step_number}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                            {completing === step.step_number ? 'Processing...' : 'Mark Complete'}
                          </button>
                        </div>
                      )}
                      {isCurrent && !isDone && !isAdmin && (
                        <div className="mt-2 text-xs text-slate-400 italic">
                          Waiting for admin to mark this step as complete.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mark as Paid banner when all steps are done */}
            {steps.length > 0 && steps.every(s => s.completed === true) && isAdmin && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {c.status === 'PAID' ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">&#x2714;&#xFE0F;</div>
                    <div className="font-semibold text-green-800">All 9 steps completed &mdash; Case is PAID</div>
                    <div className="text-sm text-green-600 mt-1">This case appears in the paid cases list on the dashboard.</div>
                  </div>
                ) : c.status === 'CLOSED' ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <div className="font-semibold text-slate-700">All 9 steps completed &mdash; Case is CLOSED</div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">&#x2705;</div>
                    <div className="font-semibold text-amber-800 mb-2">All 9 steps completed!</div>
                    <div className="text-sm text-amber-700 mb-3">Mark this case as PAID to update its status in the dashboard.</div>
                    <button onClick={handleMarkAsPaid} disabled={markingPaid}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                      {markingPaid ? 'Processing...' : 'Mark as Paid'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Case Info + Alerts */}
        <div className="space-y-4">
          {/* Case Info — Edit toggle */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">Case Details</h3>
              {!editing && isAdmin && (
                <button onClick={handleEdit} className="text-xs font-medium text-blue-600 hover:text-blue-800 underline transition">
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">FIR Number</label>
                  <input value={editForm.fir_number} onChange={e => handleEditField('fir_number', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">CC Number</label>
                  <input value={editForm.cc_number} onChange={e => handleEditField('cc_number', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Case Type</label>
                    <select value={editForm.case_type} onChange={e => handleEditField('case_type', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none">
                      {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Status</label>
                    <select value={editForm.status} onChange={e => handleEditField('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none">
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">District</label>
                  <select value={editForm.district_id} onChange={e => handleEditField('district_id', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none">
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Data Source</label>
                  <select value={editForm.data_source} onChange={e => handleEditField('data_source', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none">
                    {dataSources.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Date of FIR</label>
                  <input type="date" value={editForm.date_of_fir} onChange={e => handleEditField('date_of_fir', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Victim Age</label>
                    <input type="number" value={editForm.victim_age} onChange={e => handleEditField('victim_age', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Victim Gender</label>
                    <select value={editForm.victim_gender} onChange={e => handleEditField('victim_gender', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none">
                      {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Compensation Type</label>
                  <select value={editForm.comp_type} onChange={e => handleEditField('comp_type', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none">
                    {compTypes.map(t => <option key={t} value={t}>{t || 'Select type'}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Amount Approved (&#8377;)</label>
                    <input type="number" value={editForm.comp_amount_approved} onChange={e => handleEditField('comp_amount_approved', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Amount Disbursed (&#8377;)</label>
                    <input type="number" value={editForm.comp_amount_disbursed} onChange={e => handleEditField('comp_amount_disbursed', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none" min="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Responsible Officer</label>
                    <input value={editForm.responsible_officer} onChange={e => handleEditField('responsible_officer', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Responsible Agency</label>
                    <input value={editForm.responsible_agency} onChange={e => handleEditField('responsible_agency', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.eligible_for_compensation === true || editForm.eligible_for_compensation === 'true'}
                    onChange={e => handleEditField('eligible_for_compensation', e.target.checked)}
                    className="rounded border-gray-300" />
                  <span className="text-xs text-slate-500">Eligible for Compensation</span>
                </label>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5">Notes</label>
                  <textarea value={editForm.notes} onChange={e => handleEditField('notes', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-sm outline-none" rows={2} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={handleCancelEdit} disabled={saving}
                    className="px-4 py-1.5 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition">Cancel</button>
                </div>
              </div>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Victim Age</dt><dd className="font-medium">{c.victim_age || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Data Source</dt><dd className="font-medium">{c.data_source}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Comp Type</dt><dd className="font-medium">{compTypeLabels[c.comp_type] || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Approved Amount</dt><dd className="font-medium text-green-700">{formatCurrency(c.comp_amount_approved)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Disbursed</dt><dd className="font-medium">{formatCurrency(c.comp_amount_disbursed)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Current Step</dt><dd className="font-medium">{c.current_step}/9</dd></div>
                {c.responsible_officer && <div className="flex justify-between"><dt className="text-slate-500">Officer</dt><dd className="font-medium">{c.responsible_officer}</dd></div>}
                {c.responsible_agency && <div className="flex justify-between"><dt className="text-slate-500">Agency</dt><dd className="font-medium">{c.responsible_agency}</dd></div>}
              </dl>
            )}
          </div>

          {/* Step Notes — consolidated view of all notes from every step */}
          {steps.some(s => s.step_notes) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-700 mb-3">Step Notes</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {steps.filter(s => s.step_notes).map(step => (
                  <div key={step.step_number} className="text-sm border-l-2 border-blue-400 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Step {step.step_number}: {step.step_name}</span>
                      {step.completed && step.completed_at && (
                        <span className="text-xs text-green-600">{new Date(step.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="text-slate-600 mt-0.5 whitespace-pre-wrap">{step.step_notes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          {data.auditLog?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-700 mb-3">Activity Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.auditLog.map(log => (
                  <div key={log.id} className="flex items-start gap-2 text-xs text-slate-500 border-b border-gray-100 pb-2 last:border-0">
                    <span className="font-mono whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</span>
                    <span className="font-medium text-slate-700">{log.action}</span>
                    <span>by {log.performed_by}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {data.alerts?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-700 mb-3">Alerts ({data.alerts.length})</h3>
              <div className="space-y-2">
                {data.alerts.map(a => (
                  <div key={a.id} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <div className="font-medium text-red-800">{a.alert_type}</div>
                    <div className="text-red-600 text-xs mt-0.5">{a.message}</div>
                    <button onClick={() => handleResolveAlert(a.id)}
                      className="mt-2 text-xs font-medium text-red-700 hover:text-red-900 underline">Resolve</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eligible */}
          <div className={`p-3 rounded-lg text-sm text-center font-medium ${c.eligible_for_compensation ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
            {c.eligible_for_compensation ? 'Eligible for Compensation' : 'Not Eligible'}
          </div>
        </div>
      </div>
    </div>
  );
}

