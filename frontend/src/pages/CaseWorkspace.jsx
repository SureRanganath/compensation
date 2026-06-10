import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import caseService from '../utils/caseService';
import api from '../utils/api';
import { maskName } from '../utils/privacy';
import UserContext from '../context/UserContext';

export default function CaseWorkspace(){
  const { id } = useParams(); const nav = useNavigate();
  const [record, setRecord] = useState(null);
  const [reveal, setReveal] = useState(false);
  const { role } = useContext(UserContext);

  useEffect(()=>{ (async ()=>{ try{ const res = await api.getCase(id); setRecord(res.case); }catch(e){ setRecord(caseService.getCase(id)); } })(); },[id]);

  if (!record) return (
    <div>
      <h3>Case not found</h3>
      <button onClick={()=>nav('/cases')}>Back to Cases</button>
    </div>
  );

  return (
    <div>
      <h2>Case Workspace — {record.id}</h2>
      <div style={{ display:'flex', gap:20 }}>
        <section style={{ flex:1 }}>
          <h3>Overview</h3>
          <table>
            <tbody>
              <tr>
                <td>Victim</td>
                <td>
                  {reveal ? record.victim_name : maskName(record.victim_name)}
                  <button onClick={()=>{
                    const allowed = ['admin','supervisor'];
                    if (!allowed.includes(role)) return alert('Insufficient privileges to reveal victim identity');
                    setReveal(r=>!r);
                  }} style={{marginLeft:8}}>{reveal ? 'Hide' : 'Reveal'}</button>
                </td>
              </tr>
              <tr><td>FIR</td><td>{record.fir_number} ({record.fir_date})</td></tr>
              <tr><td>Case Type</td><td>{record.case_type}</td></tr>
              <tr><td>Status</td><td>{record.status}</td></tr>
              <tr><td>Assigned Officer</td><td>{record.assigned_officer}</td></tr>
            </tbody>
          </table>

          <h4>Documents</h4>
          <div>{(record.documents||[]).map(d=>(
            <div key={d.id} style={{marginBottom:8}}>
              <a href={d.data} download={d.name} target="_blank" rel="noreferrer">{d.name}</a>
            </div>
          ))}</div>
        </section>

        <aside style={{ width:340 }}>
          <h4>Activity Timeline</h4>
          <div>{(record.activity||[]).map(a=>(<div key={a.date}><strong>{a.date}</strong>: {a.activity}</div>))}</div>
          <h4 style={{marginTop:12}}>Notes</h4>
          <div>{record.notes}</div>
        </aside>
      </div>
    </div>
  );
}
