const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => { if (!origin || allowedOrigins.includes(origin)) return cb(null, true); cb(new Error('CORS not allowed')); },
  credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization']
}));

app.use(rateLimit({ windowMs: 15*60*1000, max: 100, message: 'Too many requests' }));
app.use(express.json({ limit: '5mb' }));

const cs = process.env.DATABASE_URL;
if (!cs) { console.error('DATABASE_URL not set'); process.exit(1); }
const pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false }, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 });
pool.connect().then(c => { c.release(); console.log('Connected to Postgres'); }).catch(e => { console.error('DB err (server will retry):', e.message); });

// Retry connection every 10s if initial connection failed
setTimeout(() => {
  pool.connect().then(c => { c.release(); console.log('Reconnected to Postgres'); }).catch(() => {});
}, 10000);

// Dev auth placeholder
const authMw = (req, res, next) => {
  const h = req.headers['authorization'];
  const t = h && h.split(' ')[1];
  if (!t && process.env.NODE_ENV === 'production') return res.status(401).json({ error: 'Token required' });
  next();
};

// Audit helper
async function audit(caseId, action, by, oldV, newV) {
  try { await pool.query('INSERT INTO audit_log (case_id,action,performed_by,old_values,new_values) VALUES($1,$2,$3,$4,$5)', [caseId, action, by||'system', oldV?JSON.stringify(oldV):null, JSON.stringify(newV)]); }
  catch(e) { console.error('audit err:', e.message); }
}

// Alert generator
async function genAlert(caseId) {
  try {
    const {rows} = await pool.query(`SELECT c.fir_number,c.current_step,c.updated_at,ws.expected_days_from_fir FROM cases c LEFT JOIN workflow_steps ws ON ws.step_number=c.current_step WHERE c.id=$1`, [caseId]);
    if (!rows.length||!rows[0].expected_days_from_fir) return;
    const r = rows[0];
    const days = Math.floor((Date.now()-new Date(r.updated_at))/86400000);
    if (days > r.expected_days_from_fir*1.5) {
      const ex = await pool.query('SELECT id FROM alerts WHERE case_id=$1 AND alert_type=$2 AND is_resolved=FALSE', [caseId, 'OVERDUE']);
      if (!ex.rows.length) await pool.query('INSERT INTO alerts(case_id,alert_type,message) VALUES($1,$2,$3)', [caseId, 'OVERDUE', `Case ${r.fir_number} overdue at step ${r.current_step} (${days}d)`]);
    }
  } catch(e) { console.error('alert gen err:', e.message); }
}

// ======== CASES ========

app.get('/api/cases', authMw, async (req, res) => {
  try {
    let {search,type,status,district,page=1,limit=20} = req.query;
    page = Math.max(1, Math.min(100, parseInt(page)||1));
    limit = Math.max(5, Math.min(100, parseInt(limit)||20));
    const off = (page-1)*limit;
    const w=[]; const p=[]; let i=1;
    if (search) { w.push(`(c.fir_number ILIKE $${i} OR c.cc_number ILIKE $${i})`); p.push(`%${search}%`); i++; }
    if (type) { w.push(`c.case_type::text=$${i}`); p.push(type); i++; }
    if (status) { w.push(`c.status::text=$${i}`); p.push(status); i++; }
    if (district) { w.push(`c.district_id=$${i}`); p.push(parseInt(district)); i++; }
    const ws = w.length ? 'WHERE '+w.join(' AND ') : '';
    const cnt = await pool.query(`SELECT COUNT(*) FROM cases c ${ws}`, p);
    const total = parseInt(cnt.rows[0].count);
    const sql = `SELECT c.id,c.fir_number,c.cc_number,c.case_type,c.status,c.current_step,c.victim_age,c.comp_type,c.comp_amount_approved,c.comp_amount_disbursed,c.date_of_fir,c.data_source,c.created_at,c.updated_at,d.name district_name FROM cases c LEFT JOIN districts d ON d.id=c.district_id ${ws} ORDER BY c.created_at DESC LIMIT $${i} OFFSET $${i+1}`;
    const r = await pool.query(sql, [...p, limit, off]);
    res.json({items:r.rows, page, limit, total});
  } catch(e) { console.error('GET /api/cases err:', e); res.status(500).json({error:'Failed'}); }
});

app.get('/api/cases/:id', authMw, async (req, res) => {
  try {
    const {id}=req.params;
    const c = await pool.query(`SELECT c.*, d.name district_name FROM cases c LEFT JOIN districts d ON d.id=c.district_id WHERE c.id=$1`, [id]);
    if (!c.rows.length) return res.status(404).json({error:'Not found'});
    const steps = await pool.query(`SELECT ws.*,csh.completed,csh.completed_at,csh.completed_by,csh.notes step_notes,csh.delay_reason,csh.documents_received FROM workflow_steps ws LEFT JOIN case_step_history csh ON csh.case_id=$1 AND csh.step_number=ws.step_number ORDER BY ws.step_number`, [id]);
    const alerts = await pool.query(`SELECT * FROM alerts WHERE case_id=$1 AND is_resolved=FALSE ORDER BY created_at DESC`, [id]);
    const auditLog = await pool.query(`SELECT * FROM audit_log WHERE case_id=$1 ORDER BY created_at DESC LIMIT 20`, [id]);
    res.json({case:c.rows[0], steps:steps.rows, alerts:alerts.rows, auditLog:auditLog.rows});
  } catch(e) { console.error('GET /api/cases/:id err:', e); res.status(500).json({error:'Failed'}); }
});

app.post('/api/cases', authMw, async (req, res) => {
  try {
    const {fir_number,cc_number,case_type,district_id,data_source,date_of_fir,victim_age,victim_gender,eligible_for_compensation,comp_type,comp_amount_approved,responsible_officer,responsible_agency,notes} = req.body;
    if (!fir_number||!case_type||!data_source||!date_of_fir) return res.status(400).json({error:'Missing required fields'});
    const r = await pool.query(`INSERT INTO cases(fir_number,cc_number,case_type,district_id,data_source,date_of_fir,victim_age,victim_gender,eligible_for_compensation,comp_type,comp_amount_approved,responsible_officer,responsible_agency,notes,current_step,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,1,'ACTIVE') RETURNING *`,
      [fir_number, cc_number||null, case_type, district_id||null, data_source, date_of_fir, victim_age||null, victim_gender||'Female', eligible_for_compensation!==false, comp_type||null, comp_amount_approved||null, responsible_officer||null, responsible_agency||null, notes||null]);
    await pool.query(`INSERT INTO case_step_history(case_id,step_number,completed,completed_at,completed_by,notes) VALUES($1,1,TRUE,NOW(),$2,'FIR Registered')`, [r.rows[0].id, responsible_officer||'System']);
    await audit(r.rows[0].id, 'CASE_CREATED', 'system', null, {fir_number,case_type});
    res.status(201).json({message:'Case created', case:r.rows[0]});
  } catch(e) { console.error('POST /api/cases err:', e); if (e.code==='23505') return res.status(409).json({error:'FIR exists'}); res.status(500).json({error:'Failed'}); }
});

app.put('/api/cases/:id', authMw, async (req, res) => {
  try {
    const {id}=req.params;
    const ALLOW = ['fir_number','cc_number','case_type','district_id','data_source','date_of_fir','victim_age','victim_gender','eligible_for_compensation','comp_type','comp_amount_approved','comp_amount_disbursed','current_step','status','responsible_officer','responsible_agency','notes'];
    const oldR = await pool.query('SELECT * FROM cases WHERE id=$1', [id]);
    if (!oldR.rows.length) return res.status(404).json({error:'Not found'});
    const f=[]; const p=[]; let i=1;
    for (const k of ALLOW) { if (req.body[k]!==undefined) { f.push(`${k}=$${i}`); p.push(req.body[k]); i++; } }
    if (!f.length) return res.status(400).json({error:'No fields'});
    p.push(id);
    const r = await pool.query(`UPDATE cases SET ${f.join(',')}, updated_at=NOW() WHERE id=$${i} RETURNING *`, p);
    await audit(id, 'CASE_UPDATED', 'system', oldR.rows[0], r.rows[0]);
    await genAlert(id);
    res.json({message:'Updated', case:r.rows[0]});
  } catch(e) { console.error('PUT err:', e); res.status(500).json({error:'Failed'}); }
});

app.delete('/api/cases/:id', authMw, async (req, res) => {
  try {
    const {id}=req.params;
    const r = await pool.query(`UPDATE cases SET status='CLOSED',updated_at=NOW() WHERE id=$1 RETURNING id`, [id]);
    if (!r.rows.length) return res.status(404).json({error:'Not found'});
    await audit(id, 'CASE_CLOSED', 'system', null, {status:'CLOSED'});
    res.json({message:'Closed'});
  } catch(e) { console.error('DELETE err:', e); res.status(500).json({error:'Failed'}); }
});

// ======== STEPS ========

app.get('/api/cases/:id/steps', authMw, async (req, res) => {
  try {
    const {id}=req.params;
    const r = await pool.query(`SELECT ws.*,csh.completed,csh.completed_at,csh.completed_by,csh.notes step_notes,csh.delay_reason,csh.documents_received FROM workflow_steps ws LEFT JOIN case_step_history csh ON csh.case_id=$1 AND csh.step_number=ws.step_number ORDER BY ws.step_number`, [id]);
    res.json(r.rows);
  } catch(e) { console.error('GET steps err:', e); res.status(500).json({error:'Failed'}); }
});

app.post('/api/cases/:id/steps/:stepNumber/complete', authMw, async (req, res) => {
  try {
    const {id,stepNumber}=req.params; const {notes,completed_by,documents_received}=req.body;
    const sn = parseInt(stepNumber);
    const ex = await pool.query('SELECT * FROM case_step_history WHERE case_id=$1 AND step_number=$2', [id, sn]);
    if (ex.rows.length>0 && ex.rows[0].completed) return res.status(409).json({error:'Already completed'});
    if (ex.rows.length>0) {
      await pool.query('UPDATE case_step_history SET completed=TRUE,completed_at=NOW(),completed_by=$2,notes=$3,documents_received=$4 WHERE id=$1', [ex.rows[0].id, completed_by||'system', notes||null, documents_received||null]);
    } else {
      await pool.query('INSERT INTO case_step_history(case_id,step_number,completed,completed_at,completed_by,notes,documents_received) VALUES($1,$2,TRUE,NOW(),$3,$4,$5)', [id, sn, completed_by||'system', notes||null, documents_received||null]);
    }
    const next = Math.min(sn+1, 9);
    await pool.query('UPDATE cases SET current_step=$1,updated_at=NOW() WHERE id=$2', [next, id]);
    await audit(id, `STEP_${sn}_COMPLETED`, completed_by||'system', null, {step:sn});
    await genAlert(id);
    res.json({message:`Step ${sn} complete`, current_step:next});
  } catch(e) { console.error('POST step complete err:', e); res.status(500).json({error:'Failed'}); }
});

app.put('/api/cases/:id/steps/:stepNumber', authMw, async (req, res) => {
  try {
    const {id,stepNumber}=req.params; const {notes,delay_reason,documents_received}=req.body;
    const ex = await pool.query('SELECT * FROM case_step_history WHERE case_id=$1 AND step_number=$2', [id, parseInt(stepNumber)]);
    if (!ex.rows.length) {
      await pool.query('INSERT INTO case_step_history(case_id,step_number,notes,delay_reason,documents_received) VALUES($1,$2,$3,$4,$5)', [id, parseInt(stepNumber), notes||null, delay_reason||null, documents_received||null]);
    } else {
      await pool.query('UPDATE case_step_history SET notes=$2,delay_reason=$3,documents_received=$4 WHERE id=$1', [ex.rows[0].id, notes||ex.rows[0].notes, delay_reason||null, documents_received||null]);
    }
    await audit(id, `STEP_${stepNumber}_UPDATED`, 'system', null, {notes});
    res.json({message:`Step ${stepNumber} updated`});
  } catch(e) { console.error('PUT step err:', e); res.status(500).json({error:'Failed'}); }
});

// ======== DASHBOARD ========

app.get('/api/dashboard/stats', authMw, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM cases');
    const byStatus = await pool.query("SELECT status::text, COUNT(*) count FROM cases GROUP BY status");
    const byType = await pool.query("SELECT case_type::text, COUNT(*) count FROM cases GROUP BY case_type");
    const byDistrict = await pool.query("SELECT d.name, COUNT(c.id) count FROM districts d LEFT JOIN cases c ON c.district_id=d.id GROUP BY d.name ORDER BY count DESC");
    const stalled = await pool.query("SELECT COUNT(*) FROM cases WHERE status='STALLED'");
    const avgDays = await pool.query("SELECT AVG(EXTRACT(DAY FROM (csh.completed_at-c.date_of_fir))) avg_days FROM case_step_history csh JOIN cases c ON c.id=csh.case_id WHERE csh.step_number=9 AND csh.completed=TRUE");
    const stalledCases = await pool.query("SELECT c.id,c.fir_number,c.case_type,c.current_step,c.updated_at,d.name district_name FROM cases c LEFT JOIN districts d ON d.id=c.district_id WHERE c.status='STALLED' OR c.status='ACTIVE' ORDER BY c.updated_at ASC LIMIT 5");
    res.json({
      total: parseInt(total.rows[0].count),
      byStatus: byStatus.rows, byType: byType.rows, byDistrict: byDistrict.rows,
      stalledCount: parseInt(stalled.rows[0].count),
      avgDaysToPayment: avgDays.rows[0]?.avg_days ? Math.round(parseFloat(avgDays.rows[0].avg_days)) : null,
      stalledCases: stalledCases.rows
    });
  } catch(e) { console.error('GET stats err:', e); res.status(500).json({error:'Failed'}); }
});

// ======== ALERTS ========

app.get('/api/alerts', authMw, async (req, res) => {
  try {
    const {type,resolved}=req.query; const w=[]; const p=[];
    if (type) { w.push('alert_type=$'+(p.length+1)); p.push(type); }
    if (resolved==='true') w.push('is_resolved=TRUE');
    else if (!resolved||resolved==='false') w.push('is_resolved=FALSE');
    const ws = w.length ? 'WHERE '+w.join(' AND ') : '';
    const r = await pool.query(`SELECT a.*,c.fir_number FROM alerts a JOIN cases c ON c.id=a.case_id ${ws} ORDER BY a.created_at DESC LIMIT 50`, p);
    res.json(r.rows);
  } catch(e) { console.error('GET alerts err:', e); res.status(500).json({error:'Failed'}); }
});

app.post('/api/alerts/:id/resolve', authMw, async (req, res) => {
  try {
    const {id}=req.params;
    await pool.query('UPDATE alerts SET is_resolved=TRUE,resolved_at=NOW(),resolved_by=$2 WHERE id=$1', [id, req.body.resolved_by||'system']);
    res.json({message:'Alert resolved'});
  } catch(e) { console.error('POST resolve err:', e); res.status(500).json({error:'Failed'}); }
});

// ======== WORKFLOW ========

app.get('/api/workflow/steps', authMw, async (req, res) => {
  try { const r = await pool.query('SELECT * FROM workflow_steps ORDER BY step_number'); res.json(r.rows); }
  catch(e) { console.error('GET workflow err:', e); res.status(500).json({error:'Failed'}); }
});

// ======== SEARCH ========

app.get('/api/search', authMw, async (req, res) => {
  try {
    const {q}=req.query;
    if (!q) return res.json([]);
    const r = await pool.query("SELECT c.id,c.fir_number,c.cc_number,c.case_type,c.status,d.name district_name FROM cases c LEFT JOIN districts d ON d.id=c.district_id WHERE c.fir_number ILIKE $1 OR c.cc_number ILIKE $1 OR d.name ILIKE $1 LIMIT 20", [`%${q}%`]);
    res.json(r.rows);
  } catch(e) { console.error('GET search err:', e); res.status(500).json({error:'Failed'}); }
});

// ======== DISTRICTS ========

app.get('/api/districts', authMw, async (req, res) => {
  try { const r = await pool.query('SELECT id,name FROM districts ORDER BY name'); res.json(r.rows); }
  catch(e) { console.error('GET districts err:', e); res.status(500).json({error:'Failed'}); }
});

// Error handler
app.use((err, req, res, next) => { console.error('Err:', err); res.status(500).json({error:'Internal error'}); });

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';
const server = app.listen(PORT, () => console.log(`Backend on port ${PORT} (${ENV})`));

process.on('SIGTERM', ()=>{ server.close(()=>{ pool.end(); process.exit(0); }); });
process.on('SIGINT', ()=>{ server.close(()=>{ pool.end(); process.exit(0); }); });
