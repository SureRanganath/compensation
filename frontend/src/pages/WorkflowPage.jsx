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

  if (loading) return <div className="text-center py-8 text-slate-400">Loading workflow...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Compensation Workflow</h1>
      <p className="text-sm text-slate-500 mb-6">The 9-step process for victim compensation under Telangana WSW guidelines</p>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.step_number} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {step.step_number}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-slate-800">{step.step_name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{step.responsible_actor}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{step.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {step.expected_days_from_fir !== null && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Expected Timeline</span>
                      <div className="font-medium text-slate-700 mt-0.5">{step.expected_days_from_fir} days from FIR</div>
                    </div>
                  )}
                  {step.required_documents?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Required Documents</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {step.required_documents.map(d => (
                          <li key={d} className="text-slate-600 flex items-center gap-1.5">
                            <span className="text-blue-500">&bull;</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.document_sources?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Document Sources</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {step.document_sources.map(s => (
                          <li key={s} className="text-slate-600 flex items-center gap-1.5">
                            <span className="text-green-500">&bull;</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {idx < steps.length - 1 && step.expected_days_from_fir !== null && steps[idx + 1].expected_days_from_fir !== null && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Gap to Next Step</span>
                      <div className="font-medium text-slate-700 mt-0.5">
                        {steps[idx + 1].expected_days_from_fir - step.expected_days_from_fir} days
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
