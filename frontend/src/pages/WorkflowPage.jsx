import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function WorkflowPage() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getWorkflowSteps();
        setSteps(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div>
      <div className="skeleton h-8 w-64 mb-2" />
      <div className="skeleton h-4 w-96 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="card p-5"><div className="skeleton h-20 w-full" /></div>)}
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Compensation Workflow</h1>
        <p className="text-sm text-slate-500 mt-1">The 9-step process for victim compensation under Telangana WSW guidelines</p>
      </div>

      {/* Progress bar showing steps count */}
      <div className="card p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-700">{steps.length} Steps in Workflow</div>
            <div className="text-xs text-slate-400">Standard compensation process timeline</div>
          </div>
        </div>
        <div className="flex gap-1">
          {steps.map(s => (
            <div key={s.step_number} className="w-3 h-3 rounded-full bg-blue-500" title={`Step ${s.step_number}`} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.step_number} className="card p-5 card-hover animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                {step.step_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <h3 className="font-semibold text-slate-800">{step.step_name}</h3>
                  <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
                    {step.responsible_actor}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{step.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {step.expected_days_from_fir !== null && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Timeline</span>
                      </div>
                      <div className="font-medium text-blue-800">{step.expected_days_from_fir} days from FIR</div>
                    </div>
                  )}
                  {step.required_documents?.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Documents</span>
                      </div>
                      <ul className="space-y-0.5">
                        {step.required_documents.map(d => (
                          <li key={d} className="text-amber-800 flex items-center gap-1.5 text-xs">
                            <span className="text-amber-400">&bull;</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.document_sources?.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Sources</span>
                      </div>
                      <ul className="space-y-0.5">
                        {step.document_sources.map(s => (
                          <li key={s} className="text-green-800 flex items-center gap-1.5 text-xs">
                            <span className="text-green-400">&bull;</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {idx < steps.length - 1 && step.expected_days_from_fir !== null && steps[idx + 1].expected_days_from_fir !== null && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-400">
                      Gap to next step: <span className="font-medium text-slate-600">{steps[idx + 1].expected_days_from_fir - step.expected_days_from_fir} days</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
