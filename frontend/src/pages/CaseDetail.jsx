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
  const [stepNotes, setStepNotes] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

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

  const handleCompleteStep = async (stepNum) => {
    if (!window.confirm(`Mark Step ${stepNum} as complete?`)) return;
    setCompleting(stepNum);
    try {
      await api.completeStep(id, stepNum, { notes: stepNotes });
      setAlertMsg(`Step ${stepNum} completed!`);
      setStepNotes('');
      await fetchCase();
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`);
    } finally {
      setCompleting(null);
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
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
                        isDone ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-amber-500 border-amber-500 text-white animate-pulse' :
                        'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {isDone ? '\u2713' : step.step_number}
                      </div>
                      {idx < steps.length - 1 && <div className={`w-0.5 h-8 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </div>
                    <div className={`pb-6 flex-1 ${!isDone && !isCurrent ? 'opacity-50' : ''}`}>
                      <div className="font-medium text-sm text-slate-700">{step.step_name}</div>
                      <div className="text-xs text-slate-400">{step.responsible_actor}</div>
                      {isDone && step.completed_at && (
                        <div className="text-xs text-green-600 mt-1">
                          Completed: {new Date(step.completed_at).toLocaleDateString()}
                        </div>
                      )}
                      {step.required_documents && step.required_documents.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          Docs: {step.required_documents.join(', ')}
                        </div>
                      )}
                      {step.delay_reason && (
                        <div className="text-xs text-red-500 mt-1">Delay: {step.delay_reason}</div>
                      )}
                      {isCurrent && !isDone && (
                        <div className="mt-3 space-y-2">
                          <textarea value={stepNotes} onChange={e => setStepNotes(e.target.value)}
                            placeholder="Add notes (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                          <button onClick={() => handleCompleteStep(step.step_number)} disabled={completing === step.step_number}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                            {completing === step.step_number ? 'Processing...' : 'Mark Complete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Case Info + Alerts */}
        <div className="space-y-4">
          {/* Case Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-3">Case Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Victim Age</dt><dd className="font-medium">{c.victim_age || '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Data Source</dt><dd className="font-medium">{c.data_source}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Comp Type</dt><dd className="font-medium">{compTypeLabels[c.comp_type] || '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Approved Amount</dt><dd className="font-medium text-green-700">{formatCurrency(c.comp_amount_approved)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Disbursed</dt><dd className="font-medium">{formatCurrency(c.comp_amount_disbursed)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Current Step</dt><dd className="font-medium">{c.current_step}/9</dd></div>
              {c.responsible_officer && <div className="flex justify-between"><dt className="text-slate-500">Officer</dt><dd className="font-medium">{c.responsible_officer}</dd></div>}
            </dl>
          </div>

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

      {/* Audit Log */}
      {data.auditLog?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Activity Log</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.auditLog.map(log => (
              <div key={log.id} className="flex items-start gap-2 text-xs text-slate-500 border-b border-gray-100 pb-2">
                <span className="font-mono whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</span>
                <span className="font-medium text-slate-700">{log.action}</span>
                <span>by {log.performed_by}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
