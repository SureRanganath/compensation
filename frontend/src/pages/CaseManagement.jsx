import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import caseService from '../utils/caseService';
import api from '../utils/api';
import { maskName } from '../utils/privacy';
import AddCaseModal from '../components/AddCaseModal';

export default function CaseManagement() {
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getCases({ q: query, status });
      setCases(res.items || []);
    } catch (e) {
      console.error('Failed to fetch cases:', e);
      setError('Failed to load cases. Using local data.');
      setCases(caseService.listCases());
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [showAdd, setShowAdd] = useState(false);

  async function handleCreate(payload, files) {
    try {
      const res = await api.createCase(payload);
      const id = res.id;
      if (files && files.length) {
        for (const f of files) {
          try {
            await api.uploadDocument(id, f);
          } catch (err) {
            console.error('Failed to upload file:', err);
            setError('Case created but some files failed to upload');
          }
        }
      }
      setShowAdd(false);
      refresh();
    } catch (e) {
      console.error('Failed to create case:', e);
      setError(`Failed to create case: ${e.message}`);
    }
  }

  async function applySearch() {
    await refresh();
  }

  const handleStatusUpdate = async (caseId, newStatus) => {
    try {
      await api.updateCaseStatus(caseId, newStatus);
      refresh();
    } catch (e) {
      setError(`Failed to update status: ${e.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Case Management</h2>
        <button 
          onClick={() => setShowAdd(true)} 
          style={{ background: '#1e40af', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add Case
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#991b1b', 
          padding: 12, 
          borderRadius: 6, 
          marginBottom: 16,
          border: '1px solid #fecaca'
        }}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input 
          placeholder="Search by Case ID, FIR, Victim" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          style={{ padding: 8, flex: 1, minWidth: 200, borderRadius: 6, border: '1px solid #cbd5e1' }}
          disabled={loading}
        />
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)} 
          style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
          disabled={loading}
        >
          <option value="">All Status</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Closed</option>
          <option>Archived</option>
        </select>
        <button 
          onClick={applySearch} 
          disabled={loading}
          style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Search
        </button>
        <button 
          onClick={() => { setQuery(''); setStatus(''); refresh(); }}
          disabled={loading}
          style={{ padding: '8px 16px', background: '#64748b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Reset
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
          Loading cases...
        </div>
      )}

      {!loading && cases.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
          No cases found
        </div>
      )}

      {!loading && cases.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ textAlign: 'left', borderBottom: '2px solid #cbd5e1', background: '#f1f5f9' }}>
              <tr>
                <th style={{ padding: 12 }}>Case ID</th>
                <th style={{ padding: 12 }}>FIR Number</th>
                <th style={{ padding: 12 }}>Victim Name</th>
                <th style={{ padding: 12 }}>Case Type</th>
                <th style={{ padding: 12 }}>Stage</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Date Added</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#fbfdff' }}>
                  <td style={{ padding: 12 }}>{c.id}</td>
                  <td style={{ padding: 12 }}>{c.fir_number}</td>
                  <td style={{ padding: 12 }}>{maskName(c.victim_name)}</td>
                  <td style={{ padding: 12 }}>{c.case_type || '-'}</td>
                  <td style={{ padding: 12 }}>{c.current_stage || '-'}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      fontSize: 12, 
                      fontWeight: 600,
                      background: c.status === 'Active' ? '#dcfce7' : '#fef2f2',
                      color: c.status === 'Active' ? '#166534' : '#991b1b'
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 12 }}>
                    {c.date_added ? new Date(c.date_added).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: 12 }}>
                    <button 
                      onClick={() => nav(`/cases/${c.id}`)} 
                      style={{ marginRight: 6, padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => {
                        const newStatus = prompt('Enter new status (Active/Pending/Closed/Archived):', c.status);
                        if (newStatus && ['Active', 'Pending', 'Closed', 'Archived'].includes(newStatus)) {
                          handleStatusUpdate(c.id, newStatus);
                        }
                      }}
                      style={{ padding: '4px 8px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddCaseModal onClose={() => setShowAdd(false)} onCreate={handleCreate} />}
    </div>
  );
}
