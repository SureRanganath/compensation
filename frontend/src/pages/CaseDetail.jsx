import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const typeColors = {
  POCSO: 'bg-blue-100 text-blue-800 border-blue-200',
  RAPE: 'bg-orange-100 text-orange-800 border-orange-200',
  ITPA: 'bg-red-100 text-red-800 border-red-200',
  OTHER_CAW: 'bg-slate-100 text-slate-700 border-slate-200',
  CHILD_VICTIM: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusColors = {
  ACTIVE: 'bg-amber-100 text-amber-800 border-amber-200',
  STALLED: 'bg-red-100 text-red-800 border-red-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800 border-purple-200',
};

const compTypeLabels = { INTERIM: 'Interim', FINAL: 'Final', SPECIAL: 'Special', INTERIM_AND_FINAL: 'Interim & Final' };

function formatCurrency(n) {
  if (!n) return '-';
  return '₹ ' + Number(n).toLocaleString('en-IN');
}

function StepCircle({ number, isDone, isCurrent, label, actor }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div className="relative">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all duration-300 ${
          isDone ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' :
          isCurrent ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30 animate-pulse' :
          'bg-white border-slate-300 text-slate-400'
        }`}>
          {isDone ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            number
          )}
        </div>
      </div>
      <div className={`text-center w-full px-0.5 ${isDone || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
        <div className="text-[10px] font-semibold text-slate-600 leading-tight leading-snug">{label}</div>
        <div className="text-[9px] text-slate-400 mt-0.5">{actor}</div>
      </div>
    </div>
  );
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
  const [supervisorNoteInput, setSupervisorNoteInput] = useState('');
  const [savingSupervisorNote, setSavingSupervisorNote] = useState(null);
  const [deletingSupervisorNote, setDeletingSupervisorNote] = useState(null);

  const role = sessionStorage.getItem('auth_role') || 'viewer';
  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
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
      notes: c.notes || ''
    });
  };

  const handleEdit = () => {
    initEditForm(data.case);
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

  const handleSaveSupervisorNotes = async (stepNum) => {
    if (!supervisorNoteInput.trim()) return setAlertMsg('Please enter some notes before saving.');
    setSavingSupervisorNote(stepNum);
    try {
      await api.updateSupervisorNotes(id, stepNum, supervisorNoteInput.trim());
      setAlertMsg('Observation notes saved for Step ' + stepNum);
      setSupervisorNoteInput('');
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error saving notes: ${e.message}`);
    } finally {
      setSavingSupervisorNote(null);
    }
  };

  const handleDeleteSupervisorNotes = async (stepNum) => {
    if (!window.confirm(`Delete the supervisor notes for Step ${stepNum}? This cannot be undone.`)) return;
    setDeletingSupervisorNote(stepNum);
    try {
      await api.deleteSupervisorNotes(id, stepNum);
      setAlertMsg('Supervisor notes deleted for Step ' + stepNum);
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error deleting notes: ${e.message}`);
    } finally {
      setDeletingSupervisorNote(null);
    }
  };

  const handleCompleteStep = async (stepNum) => {
    if (!window.confirm(`Mark Step ${stepNum} as complete?`)) return;
    setCompleting(stepNum);
    try {
      const payload = { notes: stepNotes };
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

  if (loading) return (
    <div>
      <div className="skeleton h-8 w-64 mb-4" />
      <div className="skeleton h-4 w-96 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><div className="card p-5"><div className="skeleton h-64 w-full" /></div></div>
        <div><div className="card p-5"><div className="skeleton h-48 w-full" /></div></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      {error}
    </div>
  );

  if (!data?.case) return (
    <div className="text-center py-12">
      <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
      <p className="text-slate-500 font-medium">Case not found</p>
    </div>
  );

  const c = data.case;
  const steps = data.steps || [];

  return (
    <div>
      {/* Alert Banner */}
      {alertMsg && (
        <div className={`mb-4 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5 shadow-sm ${
          alertMsg.startsWith('Error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {alertMsg.startsWith('Error') ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <span className="flex-1">{alertMsg}</span>
          <button onClick={() => setAlertMsg('')} className="font-bold opacity-70 hover:opacity-100 transition">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{c.fir_number}</h1>
            <span className={`badge border ${typeColors[c.case_type] || 'bg-slate-100'}`}>{c.case_type}</span>
            <span className={`badge border ${statusColors[c.status] || 'bg-slate-100'}`}>{c.status}</span>
          </div>
          <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
            {c.cc_number && <span className="flex items-center gap-1"><span className="text-slate-300">CC:</span> {c.cc_number}</span>}
            {c.district_name && <span className="flex items-center gap-1"><span className="text-slate-300">District:</span> {c.district_name}</span>}
            <span className="flex items-center gap-1"><span className="text-slate-300">DOF:</span> {c.date_of_fir ? new Date(c.date_of_fir).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
          </div>
        </div>
        <button onClick={() => nav('/cases')} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: 9-Step Progress Tracker */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-700">Progress Tracker</h3>
            </div>

            {/* Horizontal steps visualization */}
            <div className="hidden md:flex items-start justify-between mb-8 px-0 relative">
              {/* Background connector line behind all steps */}
              <div className="absolute top-[22px] left-[5.5%] right-[5.5%] h-0.5 bg-slate-200 z-0" />
              
              {steps.map((step, idx) => {
                const isDone = step.completed === true;
                const prevStepsComplete = steps.filter(s => s.step_number < step.step_number).every(s => s.completed);
                const isCurrent = !isDone && prevStepsComplete;
                const stepNames = ['FIR Registration', 'Initial Assessment', 'Notice Issuance', 'Document Collection', 'Amount Assessment', 'Approval Process', 'Disbursement Initiation', 'Payment Confirmation', 'Case Closure'];
                const stepActors = ['Officer', 'Officer', 'Officer', 'Officer', 'Supervisor', 'Supervisor', 'Admin', 'Admin', 'Admin'];
                return (
                  <div key={step.step_number} className="flex flex-col items-center relative z-10" style={{ width: `${100 / 9}%` }}>
                    <StepCircle
                      number={step.step_number}
                      isDone={isDone}
                      isCurrent={isCurrent}
                      label={step.step_name?.length > 16 ? step.step_name.slice(0, 16) + '...' : step.step_name || stepNames[idx]}
                      actor={step.responsible_actor || stepActors[idx]}
                    />
                    {/* Completed connector segment overlays the background */}
                    {idx < steps.length - 1 && isDone && (
                      <div className="absolute top-[22px] left-[50%] w-full h-0.5 bg-green-400 z-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vertical steps (mobile + detailed) */}
            <div className="space-y-0 md:hidden">
              {steps.map((step, idx) => {
                const isDone = step.completed === true;
                const prevStepsComplete = steps.filter(s => s.step_number < step.step_number).every(s => s.completed);
                const isCurrent = !isDone && prevStepsComplete;
                return (
                  <div key={step.step_number} className="flex gap-4">
                    <div className="flex flex-col items-center self-stretch">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all duration-300 ${
                        isDone ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-amber-500 border-amber-500 text-white animate-pulse' :
                        'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isDone ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : step.step_number}
                      </div>
                      {idx < steps.length - 1 && <div className={`w-0.5 flex-1 ${isDone ? 'bg-green-400' : 'bg-slate-200'}`} />}
                    </div>
                    <div className={`pb-6 flex-1 ${!isDone && !isCurrent ? 'opacity-50' : ''}`}>
                      <div className="font-medium text-sm text-slate-700">{step.step_name}</div>
                      <div className="text-xs text-slate-400">{step.responsible_actor}</div>
                      {isDone && step.completed_at && (
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
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
                        <div className="text-xs text-slate-400 mt-1">Docs: {step.required_documents.join(', ')}</div>
                      )}
                      {step.delay_reason && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          Delay: {step.delay_reason}
                        </div>
                      )}
                      {isCurrent && !isDone && isAdmin && (
                        <div className="mt-3 space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          {[5,6,7].includes(step.step_number) && (
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Approved Amount (&#8377;)</label>
                              <input type="number" value={stepAmount} onChange={e => setStepAmount(e.target.value)}
                                placeholder={c.comp_amount_approved ? `Current: ${c.comp_amount_approved}` : 'e.g. 500000'} min="0"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                          )}
                          <textarea value={stepNotes} onChange={e => setStepNotes(e.target.value)}
                            placeholder="Add notes (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" rows={2} />
                          <div className="flex gap-2">
                            <button onClick={() => handleCompleteStep(step.step_number)} disabled={completing === step.step_number}
                              className="btn-outline-primary text-xs flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50">
                              {completing === step.step_number ? (
                                <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Processing...</>
                              ) : (
                                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Mark Complete</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {isCurrent && !isDone && isSupervisor && (
                        <div className="mt-3 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Observation Notes</label>
                          <textarea value={supervisorNoteInput} onChange={e => setSupervisorNoteInput(e.target.value)}
                            placeholder="Enter observations or recommendations..."
                            className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" rows={2} />
                          <button onClick={() => handleSaveSupervisorNotes(step.step_number)} disabled={savingSupervisorNote === step.step_number}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1.5">
                            {savingSupervisorNote === step.step_number ? (
                              <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Saving...</>
                            ) : (
                              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25h.75" /></svg>Save Notes</>
                            )}
                          </button>
                        </div>
                      )}

                      {isCurrent && !isDone && !isAdmin && !isSupervisor && (
                        <div className="mt-2 text-xs text-slate-400 italic flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Waiting for admin to mark this step as complete.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop detailed step list */}
            <div className="hidden md:block space-y-0 mt-4 border-t border-slate-100 pt-4">
              {steps.map((step, idx) => {
                const isDone = step.completed === true;
                const prevStepsComplete = steps.filter(s => s.step_number < step.step_number).every(s => s.completed);
                const isCurrent = !isDone && prevStepsComplete;
                return (
                  <div key={step.step_number} className="flex gap-3 py-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 mt-0.5 transition-all ${
                      isDone ? 'bg-green-500 border-green-500 text-white' :
                      isCurrent ? 'bg-amber-500 border-amber-500 text-white' :
                      'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : step.step_number}
                    </div>
                    <div className={`flex-1 ${!isDone && !isCurrent ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{step.step_name}</span>
                        <span className="text-xs text-slate-400">— {step.responsible_actor}</span>
                      </div>
                      {isDone && step.completed_at && (
                        <div className="text-xs text-green-600">Completed: {new Date(step.completed_at).toLocaleDateString()}</div>
                      )}
                      {isDone && isAdmin && (
                        <button onClick={() => handleRevertStep(step.step_number)} disabled={reverting === step.step_number}
                          className="text-xs font-medium text-amber-600 hover:text-amber-800 underline transition disabled:opacity-40 mt-0.5">
                          {reverting === step.step_number ? 'Reverting...' : 'Revert'}
                        </button>
                      )}
                      {step.required_documents?.length > 0 && (
                        <div className="text-xs text-slate-400">Docs: {step.required_documents.join(', ')}</div>
                      )}
                      {step.delay_reason && (
                        <div className="text-xs text-red-500">Delay: {step.delay_reason}</div>
                      )}
                      {isCurrent && !isDone && isAdmin && (
                        <div className="mt-2 space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          {[5,6,7].includes(step.step_number) && (
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Approved Amount (&#8377;)</label>
                              <input type="number" value={stepAmount} onChange={e => setStepAmount(e.target.value)}
                                placeholder={c.comp_amount_approved ? `Current: ${c.comp_amount_approved}` : 'e.g. 500000'} min="0"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                          )}
                          <textarea value={stepNotes} onChange={e => setStepNotes(e.target.value)}
                            placeholder="Add notes (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" rows={2} />
                          <button onClick={() => handleCompleteStep(step.step_number)} disabled={completing === step.step_number}
                            className="btn-outline-primary text-xs px-4 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50">
                            {completing === step.step_number ? 'Processing...' : 'Mark Complete'}
                          </button>
                        </div>
                      )}
                      {isCurrent && !isDone && isSupervisor && (
                        <div className="mt-2 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <textarea value={supervisorNoteInput} onChange={e => setSupervisorNoteInput(e.target.value)}
                            placeholder="Enter observations..."
                            className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" rows={2} />
                          <button onClick={() => handleSaveSupervisorNotes(step.step_number)} disabled={savingSupervisorNote === step.step_number}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50">
                            {savingSupervisorNote === step.step_number ? 'Saving...' : 'Save Notes'}
                          </button>
                        </div>
                      )}
                      {isCurrent && !isDone && !isAdmin && !isSupervisor && (
                        <div className="text-xs text-slate-400 italic mt-1">Waiting for admin...</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mark as Paid / Complete Case Section */}
            {steps.length > 0 && steps.every(s => s.completed === true) && isAdmin && (
              <div className="mt-6 pt-6 border-t-2 border-slate-200">
                {c.status === 'PAID' ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center shadow-sm">
                    <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-green-800 mb-1">Case Complete — PAID</h4>
                    <p className="text-sm text-green-600">All 9 steps completed. Case marked as paid and appears on the dashboard.</p>
                  </div>
                ) : c.status === 'CLOSED' ? (
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                    <div className="w-14 h-14 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-slate-700 mb-1">Case Complete — CLOSED</h4>
                    <p className="text-sm text-slate-500">All 9 steps completed and case has been closed.</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shadow-inner shrink-0 animate-pulse">
                        <svg className="w-9 h-9 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-lg font-bold text-amber-800 mb-1">All 9 Steps Completed!</h4>
                        <p className="text-sm text-amber-700">
                          All steps in the compensation workflow are complete. 
                          Mark this case as <strong>PAID</strong> to update its status on the dashboard.
                        </p>
                      </div>
                      <button onClick={handleMarkAsPaid} disabled={markingPaid}
                        className="btn-outline-success text-sm px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap shrink-0">
                        {markingPaid ? (
                          <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Processing...</>
                        ) : (
                          <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Mark as Paid</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Case Info + Alerts */}
        <div className="space-y-4">
          {/* Case Info */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-700">Case Details</h3>
              </div>
              {!editing && isAdmin && (
                <button onClick={handleEdit} className="btn btn-secondary text-xs py-1 px-2.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.155.766l-1.878.441.441-1.878a4.5 4.5 0 01.766-1.155l10.49-10.49a1.125 1.125 0 112.114 0z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">FIR Number</label>
                  <input value={editForm.fir_number} onChange={e => handleEditField('fir_number', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">CC Number</label>
                  <input value={editForm.cc_number} onChange={e => handleEditField('cc_number', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5 font-medium">Case Type</label>
                    <select value={editForm.case_type} onChange={e => handleEditField('case_type', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                      {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5 font-medium">Status</label>
                    <select value={editForm.status} onChange={e => handleEditField('status', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">District</label>
                  <select value={editForm.district_id} onChange={e => handleEditField('district_id', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">Data Source</label>
                  <select value={editForm.data_source} onChange={e => handleEditField('data_source', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                    {dataSources.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">Date of FIR</label>
                  <input type="date" value={editForm.date_of_fir} onChange={e => handleEditField('date_of_fir', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5 font-medium">Victim Age</label>
                    <input type="number" value={editForm.victim_age} onChange={e => handleEditField('victim_age', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5 font-medium">Victim Gender</label>
                    <select value={editForm.victim_gender} onChange={e => handleEditField('victim_gender', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none bg-white">
                      {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">Compensation Type</label>
                  <select value={editForm.comp_type} onChange={e => handleEditField('comp_type', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none bg-white">
                    {compTypes.map(t => <option key={t} value={t}>{t || 'Select type'}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5 font-medium">Amount Approved (&#8377;)</label>
                    <input type="number" value={editForm.comp_amount_approved} onChange={e => handleEditField('comp_amount_approved', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5 font-medium">Amount Disbursed (&#8377;)</label>
                    <input type="number" value={editForm.comp_amount_disbursed} onChange={e => handleEditField('comp_amount_disbursed', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none" min="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">Responsible Officer</label>
                  <input value={editForm.responsible_officer} onChange={e => handleEditField('responsible_officer', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.eligible_for_compensation === true || editForm.eligible_for_compensation === 'true'}
                    onChange={e => handleEditField('eligible_for_compensation', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs text-slate-500">Eligible for Compensation</span>
                </label>
                <div>
                  <label className="block text-xs text-slate-500 mb-0.5 font-medium">Notes</label>
                  <textarea value={editForm.notes} onChange={e => handleEditField('notes', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" rows={2} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="btn btn-primary text-xs">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={handleCancelEdit} disabled={saving}
                    className="btn btn-secondary text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <dt className="text-slate-500">Victim Age</dt>
                  <dd className="font-medium text-slate-800">{c.victim_age || '-'}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <dt className="text-slate-500">Data Source</dt>
                  <dd className="font-medium text-slate-800">{c.data_source}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <dt className="text-slate-500">Comp Type</dt>
                  <dd className="font-medium text-slate-800">{compTypeLabels[c.comp_type] || '-'}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <dt className="text-slate-500">Approved Amount</dt>
                  <dd className="font-medium text-green-700">{formatCurrency(c.comp_amount_approved)}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <dt className="text-slate-500">Disbursed</dt>
                  <dd className="font-medium text-slate-800">{formatCurrency(c.comp_amount_disbursed)}</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <dt className="text-slate-500">Current Step</dt>
                  <dd className="font-medium text-slate-800">{c.current_step}/9</dd>
                </div>
                {c.responsible_officer && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Officer</dt>
                    <dd className="font-medium text-slate-800">{c.responsible_officer}</dd>
                  </div>
                )}

              </dl>
            )}
          </div>

          {/* Step Notes */}
          {(steps.some(s => s.step_notes) || steps.some(s => s.supervisor_notes)) && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-700">Step Notes</h3>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
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
                {steps.filter(s => s.supervisor_notes).map(step => (
                  <div key={`sup-${step.step_number}`} className="text-sm border-l-2 border-purple-400 pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">Step {step.step_number}: {step.step_name}</span>
                        <span className="badge bg-purple-100 text-purple-700 border-purple-200 text-[10px]">Supervisor</span>
                        {step.supervisor_notes_by && (
                          <span className="text-xs text-purple-500">by {step.supervisor_notes_by}</span>
                        )}
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeleteSupervisorNotes(step.step_number)}
                          disabled={deletingSupervisorNote === step.step_number}
                          className="text-xs font-medium text-red-500 hover:text-red-700 underline transition shrink-0 disabled:opacity-40">
                          {deletingSupervisorNote === step.step_number ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                    <div className="text-slate-600 mt-0.5 whitespace-pre-wrap">{step.supervisor_notes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          {data.auditLog?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-700">Activity Log</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.auditLog.map(log => (
                  <div key={log.id} className="flex items-start gap-3 text-xs text-slate-500 border-b border-slate-50 pb-2 last:border-0">
                    <span className="font-mono whitespace-nowrap text-slate-400 tabular-nums">{new Date(log.created_at).toLocaleDateString()}</span>
                    <span className="font-medium text-slate-700">{log.action}</span>
                    <span className="text-slate-400">by {log.performed_by}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {data.alerts?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-700">Alerts ({data.alerts.length})</h3>
              </div>
              <div className="space-y-2">
                {data.alerts.map(a => (
                  <div key={a.id} className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm">
                    <div className="font-medium text-red-800">{a.alert_type}</div>
                    <div className="text-red-600 text-xs mt-0.5">{a.message}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => handleResolveAlert(a.id)}
                        className="text-xs font-medium text-red-700 hover:text-red-900 underline">Resolve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eligible badge */}
          <div className={`p-3.5 rounded-xl text-sm text-center font-medium flex items-center justify-center gap-2 ${
            c.eligible_for_compensation
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-slate-50 text-slate-500 border border-slate-200'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {c.eligible_for_compensation ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              )}
            </svg>
            {c.eligible_for_compensation ? 'Eligible for Compensation' : 'Not Eligible'}
          </div>
        </div>
      </div>
    </div>
  );
}
