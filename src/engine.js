'use strict';
/* WunderOS Console — deterministic agent OS simulator (engine). */
const APP_VERSION = '1.0.0';
const STORE_KEY = 'wos.v1';
const OPERATOR_PIN = '1234';

/* ---------- hashing ---------- */
function sha256raw(ascii) {
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  const maxWord = 4294967296; let i, j, result = '';
  const words = []; const bitLen = ascii.length * 8;
  let hash = sha256raw.h = sha256raw.h || []; const k = sha256raw.k = sha256raw.k || [];
  let pc = k.length; const comp = {};
  for (let c = 2; pc < 64; c++) {
    if (!comp[c]) {
      for (i = 0; i < 313; i += c) comp[i] = c;
      hash[pc] = (Math.pow(c, .5) * maxWord) | 0;
      k[pc++] = (Math.pow(c, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
  words[words.length] = ((bitLen / maxWord) | 0);
  words[words.length] = bitLen;
  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16); const old = hash; hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2]; const a = hash[0], e = hash[4];
      const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
        (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }
  for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? '0' : '') + b.toString(16); }
  return result;
}
const sha256 = s => sha256raw(unescape(encodeURIComponent(s)));
function canon(o) {
  if (o === null || typeof o !== 'object') return JSON.stringify(o === undefined ? null : o);
  if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
  return '{' + Object.keys(o).sort().filter(k => o[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}';
}
const H = o => sha256(typeof o === 'string' ? o : canon(o));
const hnum = s => parseInt(sha256(s).slice(0, 8), 16) / 4294967296;
const clone = o => o === undefined ? undefined : JSON.parse(JSON.stringify(o));
const round2 = n => Math.round(n * 100) / 100;

/* ---------- static catalog ---------- */
const MODELS = {
  'atlas-7@2026-06': { provider: 'Atlas (external)', price: 0.012 },
  'atlas-8@2026-10': { provider: 'Atlas (external)', price: 0.009 },
  'orion-3@2026-08': { provider: 'Orion (in-VPC)', price: 0.020 },
};
const LABEL_RANK = { shareable: 0, internal: 1, protected: 2 };

const AGENTS_SEED = [
  { id: 'refund-resolver', name: 'Refund Resolver', ring: 1, kind: 'customer', vendor: 'Fennec AI · inherited',
    runtime: 'Python harness · microVM guest', budget: 40, status: 'active',
    blurb: 'Built by a vendor’s forward-deployed engineers, left behind when they did. Now runs unchanged under your runtime.' },
  { id: 'ledger-sentinel', name: 'Ledger Sentinel', ring: 0, kind: 'native', vendor: 'Northwind · in-house',
    runtime: 'TypeScript · native on the node', budget: 25, status: 'active',
    blurb: 'Your own compliance agent. Watches the payments ledger and alerts finance controls.' },
  { id: 'meridian-forecaster', name: 'Meridian Forecaster', ring: 1, kind: 'guest', vendor: 'Meridian Logistics · partner',
    runtime: 'Enclave guest · microVM', budget: 30, status: 'active',
    blurb: 'A partner’s agent admitted to the Agentic Data Enclave to plan Q4 capacity against your demand forecast.' },
];

const DATA_SEED = {
  tickets: { label: 'internal', owner: 'Northwind', desc: 'Support tickets', rows: {
    'T-1001': { order: 'O-5512', customer: 'C-201', reason: 'Mug arrived cracked', ask: 42 },
    'T-1002': { order: 'O-5530', customer: 'C-202', reason: 'Espresso machine defective', ask: 780 },
    'T-1003': { order: 'O-5541', customer: 'C-203', reason: 'Wrong jacket size', ask: 129 },
    'T-1004': { order: 'O-5560', customer: 'C-204', reason: 'Docking station dead on arrival', ask: 1240 },
    'T-1005': { order: 'O-5575', customer: 'C-205', reason: 'Late delivery', ask: 20 },
    'T-1006': { order: 'O-5588', customer: 'C-206', reason: 'Monitor has dead pixels', ask: 560 },
    'T-1007': { order: 'O-5591', customer: 'C-207', reason: 'Changed mind', ask: 89 },
  } },
  orders: { label: 'internal', owner: 'Northwind', desc: 'Order book', rows: {
    'O-5512': { sku: 'MUG-11', amount: 42, days: 3 },
    'O-5530': { sku: 'ESP-900', amount: 780, days: 12 },
    'O-5541': { sku: 'JKT-M', amount: 129, days: 45 },
    'O-5560': { sku: 'DOCK-X2', amount: 1240, days: 5 },
    'O-5575': { sku: 'BKS-3', amount: 64, days: 2 },
    'O-5588': { sku: 'MON-27', amount: 560, days: 9 },
    'O-5591': { sku: 'HDP-2', amount: 89, days: 33 },
  } },
  'customers.pii': { label: 'protected', owner: 'Northwind', desc: 'Customer identity & card data', rows: {
    'C-201': { name: 'Ada Park', email: 'ada@example.com', card: '•••• 4242' },
    'C-202': { name: 'Luis Ortega', email: 'luis@example.com', card: '•••• 1881' },
    'C-203': { name: 'Mei Chen', email: 'mei@example.com', card: '•••• 3007' },
    'C-204': { name: 'Siobhan O’Brien', email: 'siobhan@example.com', card: '•••• 9120' },
    'C-205': { name: 'Tom Reyes', email: 'tom@example.com', card: '•••• 5555' },
    'C-206': { name: 'Priya Nair', email: 'priya@example.com', card: '•••• 7431' },
    'C-207': { name: 'Jonas Berg', email: 'jonas@example.com', card: '•••• 6620' },
  } },
  'payments.ledger': { label: 'internal', owner: 'Northwind', desc: 'Refund ledger', rows: [
    { id: 'TX-0901', order: 'O-5402', amount: 310, by: 'manual' },
    { id: 'TX-0902', order: 'O-5418', amount: 55, by: 'manual' },
    { id: 'TX-0903', order: 'O-5402', amount: 310, by: 'manual' },
    { id: 'TX-0904', order: 'O-5431', amount: 72, by: 'manual' },
    { id: 'TX-0905', order: 'O-5440', amount: 18, by: 'manual' },
  ] },
  'forecasts.q4': { label: 'protected', owner: 'Northwind', desc: 'Q4 demand forecast (crown-jewel)', rows: {
    Northeast: { units: 5200, yoy: 18 }, Midwest: { units: 3100, yoy: -4 }, West: { units: 4100, yoy: 7 },
  } },
  'inventory.partner': { label: 'shareable', owner: 'Meridian', desc: 'Partner DC capacity (shared by Meridian)', rows: {
    'DC-East': { capacity: 5000, used: 3600 }, 'DC-Central': { capacity: 4200, used: 2400 }, 'DC-West': { capacity: 3800, used: 3300 },
  } },
};

const SPEC_V1 = [
  { id: 'R1', act: 'allow', kind: 'read', res: 'tickets,orders', who: 'native,customer', text: 'Your own agents may read tickets and orders.' },
  { id: 'R2', act: 'allow', kind: 'read', res: 'customers.pii', who: 'customer', text: 'Refund agents may look up customer identity to verify a claim.' },
  { id: 'R3', act: 'deny', kind: 'read', res: 'customers.pii', who: '*', text: 'Nobody else sees customer PII.' },
  { id: 'R4', act: 'allow', kind: 'read', res: 'payments.ledger', who: 'native', text: 'Only in-house agents read the payments ledger.' },
  { id: 'R5', act: 'allow', kind: 'read', res: 'forecasts.q4,inventory.partner', who: 'guest,native', text: 'Enclave guests may read the forecast and partner inventory inside the boundary.' },
  { id: 'R6', act: 'allow', kind: 'model', res: '*', who: '*', text: 'Model calls are allowed through governed egress.' },
  { id: 'R7', act: 'allow', kind: 'tool', res: '*', who: '*', text: 'Pure tools (no side effects) are allowed.' },
  { id: 'R8', act: 'deny', kind: 'effect', res: '*', who: 'guest', text: 'Enclave guests can never cause side effects or export data.' },
  { id: 'R9', act: 'hold', kind: 'effect', res: 'payments.refund', who: '*', when: { f: 'amount', op: '>', v: 1000 }, text: 'Refunds over $1,000 wait for a human approver.' },
  { id: 'R10', act: 'allow', kind: 'effect', res: 'payments.refund,notify.*', who: 'customer,native', text: 'Refunds and notifications are otherwise allowed.' },
];
function specV2() {
  const r = clone(SPEC_V1);
  r[1] = { id: 'R2', act: 'deny', kind: 'read', res: 'customers.pii', who: 'customer', text: 'Inherited agents no longer see PII; identity is verified upstream.' };
  r[8].when.v = 500; r[8].text = 'Refunds over $500 wait for a human approver.';
  return r;
}

/* ---------- state ---------- */
let S = null;
function blank() {
  return { app: APP_VERSION, seq: 0, clock: Date.parse('2026-06-30T13:00:00Z'), model: 'atlas-7@2026-06', operator: 'Drew (operator)',
    agents: clone(AGENTS_SEED), data: clone(DATA_SEED), spec: { versions: [], draft: null }, runs: [], visits: [], log: [], tamper: null };
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* quota */ } }
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { S = JSON.parse(raw); upgrade(); return; } } catch (e) { /* corrupt */ }
  seed();
}
function upgrade() { S.visits = S.visits || []; S.spec.draft = S.spec.draft || null; S.app = APP_VERSION; }
const agentById = id => S.agents.find(a => a.id === id);
const keyOf = id => H('signing-key:' + id);
const currentSpec = () => S.spec.versions[S.spec.versions.length - 1];
const specByV = v => S.spec.versions.find(s => s.v === v);
function tick() { S.clock += 1000 + Math.floor(hnum('t' + S.seq) * 4000); return S.clock; }
function syncClock() { S.clock = Math.max(S.clock, Date.now()); }

/* ---------- the record (Wunderlog) ---------- */
function logEvent(body) {
  const prev = S.log.length ? S.log[S.log.length - 1].hash : 'GENESIS';
  const ev = Object.assign({ seq: ++S.seq, t: tick() }, body, { prev });
  Object.keys(ev).forEach(k => ev[k] === undefined && delete ev[k]);
  ev.hash = H(ev);
  ev.sig = H(keyOf(ev.agent) + ev.hash).slice(0, 32);
  S.log.push(ev);
  return ev;
}
function verifyChain() {
  let prev = 'GENESIS';
  for (const e of S.log) {
    const body = Object.assign({}, e); delete body.hash; delete body.sig;
    if (e.prev !== prev) return { ok: false, at: e.seq, why: 'chain link broken (prev hash mismatch)' };
    if (H(body) !== e.hash) return { ok: false, at: e.seq, why: 'event content altered after it was written' };
    if (H(keyOf(e.agent) + e.hash).slice(0, 32) !== e.sig) return { ok: false, at: e.seq, why: 'signature does not match the agent key' };
    prev = e.hash;
  }
  return { ok: true, n: S.log.length, head: prev };
}

/* ---------- the specification ---------- */
function signSpec(rules, by, note) {
  const v = S.spec.versions.length + 1;
  const hash = H({ v, rules });
  const sv = { v, rules: clone(rules), hash, by, at: tick(), note };
  S.spec.versions.push(sv);
  logEvent({ agent: 'os', kind: 'spec.sign', res: 'spec/v' + v, dec: 'system', summary: `Spec v${v} signed by ${by}: ${note}`, spec: v, specHash: hash });
  return sv;
}
function splitList(p) { return String(p || '').split(',').map(s => s.trim()).filter(Boolean); }
function matchRes(p, v) { return splitList(p).some(x => x === '*' || x === v || (x.endsWith('*') && String(v).startsWith(x.slice(0, -1)))); }
function matchWho(p, a) { return splitList(p).some(x => x === '*' || x === a.id || x === a.kind || x === 'ring' + a.ring); }
function condOk(w, it) {
  if (!w || !w.f) return true;
  const x = w.f === 'label' ? (it.labels || []) : (it.args && it.args[w.f] !== undefined ? it.args[w.f] : it[w.f]);
  if (x === undefined) return false;
  switch (w.op) {
    case '>': return +x > +w.v; case '>=': return +x >= +w.v; case '<': return +x < +w.v; case '<=': return +x <= +w.v;
    case '==': return String(x) === String(w.v); case '!=': return String(x) !== String(w.v);
    case 'has': return Array.isArray(x) ? x.includes(w.v) : String(x).includes(w.v);
  }
  return false;
}
function evaluate(rules, agent, it) {
  for (const r of rules) {
    if ((r.kind === '*' || r.kind === it.kind) && matchRes(r.res, it.res) && matchWho(r.who, agent) && condOk(r.when, it)) return { act: r.act, rule: r.id };
  }
  return { act: 'deny', rule: 'DEFAULT' };
}
function ruleText(r) {
  const c = r.when && r.when.f ? ` when ${r.when.f} ${r.when.op} ${r.when.v}` : '';
  return `${r.act.toUpperCase()} ${r.kind} ${r.res} for ${r.who}${c}`;
}

/* ---------- economics ---------- */
const monthOf = t => new Date(t).toISOString().slice(0, 7);
function spendMTD(agentId, at) {
  const m = monthOf(at || S.clock);
  return round2(S.log.filter(e => e.agent === agentId && e.kind === 'model' && e.cost && monthOf(e.t) === m).reduce((s, e) => s + e.cost, 0));
}

/* ---------- the gate ---------- */
function gate(agent, it, spec) {
  if (agent.status === 'suspended') return { act: 'deny', rule: 'SUSPENDED' };
  if (it.kind === 'emit') return { act: 'allow', rule: 'MEMORY' };
  if (it.kind === 'model' && spendMTD(agent.id) + estimateCost(it) > agent.budget) return { act: 'deny', rule: 'BUDGET' };
  return evaluate(spec.rules, agent, it);
}
const OPERATIONAL_RULES = ['SUSPENDED', 'BUDGET', 'MEMORY'];

/* ---------- simulated model (called off the hot path; output recorded) ---------- */
function tokensFor(input) { return 220 + Math.floor(canon(input).length / 3); }
function estimateCost(it) { const m = MODELS[it.res] || { price: 0.01 }; return round2(tokensFor(it.input) / 1000 * m.price * 10); }
function infer(task, input, model) {
  const r = hnum(model + '|' + task + '|' + canon(input));
  const tokens = tokensFor(input);
  let out;
  if (task === 'refund.decide') {
    const inPolicy = input.days <= 30 && input.ask <= input.amount;
    if (inPolicy) out = { decision: 'approve', amount: input.ask, confidence: round2(0.82 + r * 0.15), rationale: `Within 30-day window; ${input.reason.toLowerCase()}.` };
    else if (r < 0.35) out = { decision: 'approve', amount: input.amount, confidence: round2(0.51 + r * 0.2), rationale: 'Goodwill exception: refund full order value.' };
    else out = { decision: 'decline', amount: 0, confidence: round2(0.7 + r * 0.2), rationale: `Outside the 30-day window (${input.days} days).` };
    if (!input.verified) out.rationale += ' Identity not verified by agent.';
  } else if (task === 'ledger.classify') {
    const seen = {}; const anomalies = [];
    input.rows.forEach(x => { if (seen[x.order]) anomalies.push(x.id + ' duplicates ' + seen[x.order]); else seen[x.order] = x.id; if (x.amount > 500) anomalies.push(x.id + ' is a high-value refund ($' + x.amount + ')'); });
    if (r < 0.2 && input.rows.length) anomalies.push(input.rows[input.rows.length - 1].id + ' timing looks unusual');
    out = { anomalies, summary: anomalies.length ? `${anomalies.length} ledger anomal${anomalies.length > 1 ? 'ies' : 'y'}: ${anomalies.join('; ')}` : 'Ledger clean.' };
  } else if (task === 'forecast.combine') {
    const lanes = []; const facts = [];
    const ne = input.fc.Northeast, east = input.inv['DC-East'];
    const shipNE = Math.round((ne.units * (1 + ne.yoy / 100) - ne.units) / 10) * 10 + Math.round(r * 40) * 10;
    lanes.push({ from: 'DC-Central', to: 'DC-East', units: Math.min(shipNE, east.capacity - east.used) });
    facts.push(`Pre-position ${lanes[0].units} units from DC-Central to DC-East before week 46.`);
    facts.push(`Northeast Q4 demand runs +${ne.yoy}% YoY (${ne.units} units).`);
    facts.push(`Joint plan cuts projected stockouts by ${8 + Math.round(r * 6)}%.`);
    out = { lanes, facts };
  } else out = { text: 'ok' };
  return { out, tokens, cost: round2(tokens / 1000 * (MODELS[model] || { price: 0.01 }).price * 10) };
}

/* ---------- tools & effects ---------- */
function runTool(name, args) {
  if (name === 'stats.zscore') {
    const v = args.values; const n = v.length || 1; const mean = v.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n) || 1;
    return { mean: round2(mean), sd: round2(sd), outliers: v.map((x, i) => [i, (x - mean) / sd]).filter(p => Math.abs(p[1]) > 1.8).map(p => p[0]) };
  }
  if (name === 'optimize.routes') return { lanes: args.lanes.length, feasible: true, truckloads: args.lanes.reduce((s, l) => s + Math.ceil(l.units / 400), 0) };
  return { ok: true };
}
function performEffect(it, run) {
  if (it.res === 'payments.refund') {
    const L = S.data['payments.ledger'].rows;
    const id = 'TX-' + String(910 + L.length).padStart(4, '0');
    L.push({ id, order: it.args.order, amount: it.args.amount, by: run.agent });
    return { ok: true, txn: id };
  }
  return { ok: true, delivered: true };
}
function readData(res, key) {
  const d = S.data[res]; if (!d) return { missing: true };
  if (key === '*') return { rows: clone(Array.isArray(d.rows) ? d.rows.slice(-12) : d.rows) };
  const row = d.rows[key]; return row ? clone(row) : { missing: true };
}

/* ---------- scenarios (agent programs; generators yield intents to the gate) ---------- */
const SCENARIOS = {
  refund: {
    agent: 'refund-resolver', title: 'Resolve a refund ticket', param: 'ticket', options: () => Object.keys(S.data.tickets.rows),
    *run(p) {
      const t = yield { kind: 'read', res: 'tickets', key: p.ticket };
      if (t.missing || t.denied) return { status: 'failed', summary: 'Ticket unavailable.' };
      const o = yield { kind: 'read', res: 'orders', key: t.order };
      const c = yield { kind: 'read', res: 'customers.pii', key: t.customer };
      const d = yield { kind: 'model', task: 'refund.decide', input: { ask: t.ask, amount: o.amount, days: o.days, reason: t.reason, verified: !c.denied } };
      if (d.denied) return { status: 'blocked', summary: 'Model call refused by ' + d.rule };
      if (d.decision !== 'approve') {
        yield { kind: 'effect', res: 'notify.email', args: { to: t.customer, template: 'refund-declined' } };
        return { summary: 'Declined — ' + d.rationale };
      }
      const r = yield { kind: 'effect', res: 'payments.refund', args: { ticket: p.ticket, order: t.order, amount: d.amount } };
      if (r.denied) return { status: 'blocked', summary: `Refund of $${d.amount} blocked by ${r.rule}.` };
      yield { kind: 'effect', res: 'notify.email', args: { to: t.customer, template: 'refund-issued', amount: d.amount } };
      return { summary: `Refunded $${d.amount} (${r.txn}).` };
    },
  },
  sentinel: {
    agent: 'ledger-sentinel', title: 'Scan the refund ledger', param: null,
    *run() {
      const L = yield { kind: 'read', res: 'payments.ledger', key: '*' };
      if (L.denied) return { status: 'blocked', summary: 'Ledger read refused.' };
      const z = yield { kind: 'tool', res: 'stats.zscore', args: { values: L.rows.map(r => r.amount) } };
      const m = yield { kind: 'model', task: 'ledger.classify', input: { rows: L.rows, outliers: z.outliers } };
      if (m.denied) return { status: 'blocked', summary: 'Model call refused by ' + m.rule };
      if (m.anomalies.length) yield { kind: 'effect', res: 'notify.slack', args: { channel: '#fin-controls', count: m.anomalies.length } };
      return { summary: m.summary };
    },
  },
  forecast: {
    agent: 'meridian-forecaster', title: 'Enclave visit: Q4 capacity plan', param: null,
    *run() {
      const inv = yield { kind: 'read', res: 'inventory.partner', key: '*' };
      const rows = inv.rows || {}; const ks = Object.keys(rows);
      const util = ks.length ? Math.round(ks.reduce((s, k) => s + rows[k].used / rows[k].capacity, 0) / ks.length * 100) : 0;
      yield { kind: 'emit', text: `Meridian DC network runs at ${util}% average utilization.` };
      const fc = yield { kind: 'read', res: 'forecasts.q4', key: '*' };
      yield { kind: 'read', res: 'customers.pii', key: '*' };
      if (fc.denied) return { status: 'blocked', summary: 'Forecast read refused.' };
      const plan = yield { kind: 'model', task: 'forecast.combine', input: { inv: rows, fc: fc.rows } };
      if (plan.denied) return { status: 'blocked', summary: 'Model call refused.' };
      yield { kind: 'tool', res: 'optimize.routes', args: { lanes: plan.lanes } };
      for (const f of plan.facts) yield { kind: 'emit', text: f };
      yield { kind: 'effect', res: 'partner.export', args: { dest: 's3://meridian-ingest/q4-plan', rows: plan.facts.length } };
      return { summary: `Produced ${plan.facts.length + 1} findings for curation.` };
    },
  },
};

/* ---------- executor: deterministic control loop ---------- */
function newRunId() { return 'RUN-' + String(S.runs.length + 1).padStart(4, '0'); }
function startRun(scenario, params, extra) {
  const sc = SCENARIOS[scenario];
  const run = Object.assign({ id: newRunId(), scenario, agent: sc.agent, params: params || {}, spec: currentSpec().v, model: S.model,
    started: S.clock, journal: [], approvals: {}, facts: [], status: 'running' }, extra || {});
  S.runs.unshift(run);
  logEvent({ agent: run.agent, run: run.id, kind: 'run.start', res: scenario, dec: 'system', summary: `${sc.title}${params && params[sc.param] ? ' ' + params[sc.param] : ''} · spec v${run.spec} · ${run.model}`, spec: run.spec });
  drive(run);
  return run;
}
function absorb(st, j) {
  if (j.intent.kind === 'read' && !j.result.denied && !j.result.missing) {
    st.lineage.add(j.intent.res); st.labels.add((S.data[j.intent.res] || DATA_SEED[j.intent.res]).label);
  }
}
function augment(raw, run, st) {
  const it = clone(raw);
  if (it.kind === 'model') it.res = run.model;
  it.labels = [...st.labels].sort();
  it.lineage = [...st.lineage].sort();
  return it;
}
function summarize(it, res, dec) {
  const d = dec.act;
  switch (it.kind) {
    case 'read': return `read ${it.res}${it.key && it.key !== '*' ? '/' + it.key : ''}${d === 'deny' ? ' — refused' : ''}`;
    case 'model': return res && res.denied ? `model ${it.res} — refused` : `${it.task} → ${res.decision || (res.anomalies ? res.anomalies.length + ' anomalies' : (res.facts ? res.facts.length + ' facts' : 'ok'))}`;
    case 'tool': return `tool ${it.res}`;
    case 'effect': return `${it.res}${it.args && it.args.amount !== undefined ? ' $' + it.args.amount : ''}${d === 'deny' ? ' — refused' : d === 'hold' ? ' — held for approval' : ''}`;
    case 'emit': return `memory ← “${it.text.slice(0, 60)}${it.text.length > 60 ? '…' : ''}”`;
  }
  return it.kind;
}
function drive(run) {
  const sc = SCENARIOS[run.scenario]; const agent = agentById(run.agent); const spec = specByV(run.spec);
  const gen = sc.run(run.params); const st = { labels: new Set(), lineage: new Set() };
  let input, i = 0;
  for (;;) {
    const step = gen.next(input);
    if (step.done) return finish(run, step.value || {});
    const raw = clone(step.value); const j = run.journal[i];
    if (j) {
      if (canon(j.intent) !== canon(raw)) { run.status = 'diverged'; return run; }
      input = j.result; absorb(st, j); i++; continue;
    }
    const it = augment(raw, run, st);
    const dec = gate(agent, it, spec);
    let approval = null;
    if (dec.act === 'hold') {
      approval = run.approvals[i];
      if (!approval) {
        if (run.status !== 'awaiting') logEvent({ agent: agent.id, run: run.id, step: i, kind: it.kind, res: it.res, dec: 'hold', rule: dec.rule, spec: run.spec, summary: summarize(it, null, dec), ih: H(raw) });
        run.status = 'awaiting'; run.holdAt = i; return run;
      }
    }
    const allowed = dec.act === 'allow' || (dec.act === 'hold' && approval);
    let result, cost, tokens;
    if (!allowed) result = { denied: true, rule: dec.rule };
    else if (it.kind === 'read') result = readData(it.res, it.key);
    else if (it.kind === 'model') { const m = infer(it.task, it.input, run.model); result = m.out; cost = m.cost; tokens = m.tokens; }
    else if (it.kind === 'tool') result = runTool(it.res, it.args);
    else if (it.kind === 'effect') result = performEffect(it, run);
    else if (it.kind === 'emit') {
      const f = { id: run.id + '-F' + (run.facts.length + 1), text: it.text, labels: it.labels, lineage: it.lineage };
      run.facts.push(f); result = { stored: true, fact: f.id };
    }
    const ev = logEvent({ agent: agent.id, run: run.id, step: i, kind: it.kind, res: it.kind === 'emit' ? 'enclave.memory' : it.res,
      dec: allowed ? 'allow' : 'deny', rule: dec.rule + (approval ? ' ✓' + approval.by : ''), spec: run.spec, model: it.kind === 'model' ? run.model : undefined,
      cost, tokens, labels: it.labels.length ? it.labels : undefined, summary: summarize(it, result, allowed ? { act: 'allow' } : dec), ih: H(raw), rh: H(result) });
    run.journal.push({ i, intent: raw, dec, approval: approval || undefined, result, seq: ev.seq, t: ev.t, model: it.kind === 'model' ? run.model : undefined, labels: it.labels, lineage: it.lineage, cost });
    absorb(st, run.journal[i]); input = result; i++;
    if (run.status === 'awaiting') run.status = 'running';
  }
}
function finish(run, out) {
  run.status = out.status || 'done'; run.result = out; run.ended = S.clock; delete run.holdAt;
  run.cost = round2(run.journal.reduce((s, j) => s + (j.cost || 0), 0));
  logEvent({ agent: run.agent, run: run.id, kind: 'run.end', res: run.scenario, dec: 'system', summary: `${run.status}: ${out.summary || ''}`, spec: run.spec });
  if (run.visit) {
    const v = S.visits.find(x => x.id === run.visit);
    if (v) {
      v.facts = run.facts.map(f => Object.assign({}, f, { gate: f.labels.includes('protected') ? 'blocked' : 'pending' }));
      v.status = 'curating';
      logEvent({ agent: 'os', run: run.id, kind: 'curation.open', res: v.id, dec: 'system', summary: `Curation gate: ${v.facts.filter(f => f.gate === 'blocked').length} blocked by lineage, ${v.facts.filter(f => f.gate === 'pending').length} awaiting owner` });
    }
  }
  return run;
}
function approveHold(run, by) {
  const i = run.holdAt; if (i === undefined) return;
  run.approvals[i] = { by, at: S.clock };
  logEvent({ agent: 'operator', run: run.id, step: i, kind: 'approve', res: 'payments.refund', dec: 'system', summary: `${by} approved the held step ${i}`, spec: run.spec });
  drive(run);
}
function rejectHold(run, by) {
  logEvent({ agent: 'operator', run: run.id, step: run.holdAt, kind: 'reject', res: run.scenario, dec: 'system', summary: `${by} rejected the held step; run cancelled`, spec: run.spec });
  run.status = 'cancelled'; run.result = { summary: 'Held step rejected by ' + by }; delete run.holdAt;
}

/* ---------- replay (Lightstand) ---------- */
function replay(run, opt) {
  opt = opt || {};
  const sc = SCENARIOS[run.scenario]; const agent = agentById(run.agent);
  const spec = specByV(opt.spec || run.spec); const model = opt.model || null;
  const gen = sc.run(run.params); const rows = []; let input, i = 0, firstDiv = null, final = null;
  const logBySeq = {}; S.log.forEach(e => { logBySeq[e.seq] = e; });
  for (;;) {
    const s = gen.next(input);
    if (s.done) { final = s.value; break; }
    const raw = clone(s.value); const j = run.journal[i];
    if (!j) {
      if (run.status === 'awaiting' && i === run.holdAt) { rows.push({ i, status: 'held', intent: raw }); break; }
      rows.push({ i, status: 'new', intent: raw, note: 'The program now takes a step that was never recorded.' }); if (firstDiv === null) firstDiv = i; break;
    }
    if (canon(raw) !== canon(j.intent)) { rows.push({ i, status: 'diverged', intent: raw, rec: j.intent, note: 'The program asked for something different here.' }); if (firstDiv === null) firstDiv = i; break; }
    const ev = logBySeq[j.seq];
    const recordOk = !!ev && ev.ih === H(j.intent) && ev.rh === H(j.result);
    const it = Object.assign(clone(raw), { res: raw.kind === 'model' ? (model || j.model) : raw.res, labels: j.labels });
    const dec = OPERATIONAL_RULES.includes(j.dec.rule) ? j.dec : evaluate(spec.rules, agent, it);
    const decSame = dec.act === j.dec.act && dec.rule === j.dec.rule;
    let result = j.result, outSame = true;
    if (model && raw.kind === 'model' && !j.result.denied && model !== j.model) { result = infer(raw.task, raw.input, model).out; outSame = canon(result) === canon(j.result); }
    const ok = decSame && outSame && recordOk;
    rows.push({ i, status: ok ? 'match' : 'differs', intent: raw, rec: j.dec, now: dec, outSame, recordOk, result, recResult: j.result });
    if (!ok && firstDiv === null) firstDiv = i;
    input = result; i++;
  }
  if (final && run.journal.length > i && firstDiv === null) firstDiv = i;
  const sameEnd = final ? (run.result && canon(final) === canon(run.result)) : run.status === 'awaiting';
  return { rows, firstDiv, identical: firstDiv === null && rows.every(r => r.status === 'match' || r.status === 'held') && !!sameEnd, final, spec: spec.v, model: model || run.model };
}

/* ---------- enclave ---------- */
function openVisit(agentId, purpose) {
  const id = 'V-' + String(S.visits.length + 1).padStart(3, '0');
  const v = { id, agent: agentId, purpose, opened: S.clock, status: 'open', facts: [] };
  S.visits.unshift(v);
  logEvent({ agent: 'os', kind: 'enclave.admit', res: id, dec: 'system', summary: `Admitted ${agentById(agentId).name} to the enclave: ${purpose}` });
  const run = startRun('forecast', {}, { visit: id }); v.run = run.id;
  return v;
}
function curate(v, factId, action, by) {
  const f = v.facts.find(x => x.id === factId); if (!f || f.gate === 'blocked') return;
  f.gate = action === 'release' ? 'released' : 'rejected';
  logEvent({ agent: 'operator', kind: 'curate', res: v.id, dec: 'system', summary: `${by} ${f.gate} “${f.text.slice(0, 50)}”`, fh: H(f.text) });
}
function closeVisit(v, by) {
  if (v.facts.some(f => f.gate === 'pending')) return false;
  const released = v.facts.filter(f => f.gate === 'released');
  v.facts.forEach(f => { if (f.gate !== 'released') f.gate = f.gate === 'blocked' ? 'purged·blocked' : 'purged'; });
  v.status = 'closed'; v.closed = S.clock;
  logEvent({ agent: 'os', kind: 'enclave.exit', res: v.id, dec: 'system', summary: `Visit closed by ${by}. ${released.length} fact(s) left the enclave; ${v.facts.length - released.length} purged from memory.`, released: released.map(f => H(f.text)) });
  return true;
}

/* ---------- regulator questions ---------- */
const QUARTERS = { 'Q3 2026': ['2026-07-01', '2026-10-01'], 'Q4 2026': ['2026-10-01', '2027-01-01'], 'All time': ['2000-01-01', '2100-01-01'] };
function regulatorAnswer(agentId, period) {
  const [a, b] = QUARTERS[period].map(Date.parse); const agent = agentById(agentId);
  const specs = S.spec.versions.filter((s, idx) => { const next = S.spec.versions[idx + 1]; return s.at < b && (!next || next.at > a); });
  const allowed = specs.map(s => ({ v: s.v, hash: s.hash, by: s.by, at: s.at, rules: s.rules.filter(r => matchWho(r.who, agent)) }));
  const runs = S.runs.filter(r => r.agent === agentId && r.started >= a && r.started < b).reverse();
  const evs = S.log.filter(e => e.agent === agentId && e.t >= a && e.t < b && !['run.start', 'run.end'].includes(e.kind));
  const models = [...new Set(runs.map(r => r.model))];
  const seen = {}; runs.forEach(r => r.journal.forEach(j => { if (j.intent.kind === 'read' && !j.result.denied) { const k = j.intent.res + (j.intent.key && j.intent.key !== '*' ? '/' + j.intent.key : ''); seen[k] = (seen[k] || 0) + 1; } }));
  const tally = { allow: 0, deny: 0, hold: 0 }; evs.forEach(e => { if (tally[e.dec] !== undefined) tally[e.dec]++; });
  const replays = runs.map(r => ({ id: r.id, ok: replay(r).identical }));
  return { agent, period, specs: allowed, runs, evs, models, seen, tally, replays, chain: verifyChain(), spend: round2(runs.reduce((s, r) => s + (r.cost || r.journal.reduce((x, j) => x + (j.cost || 0), 0)), 0)) };
}

/* ---------- tamper drill ---------- */
function tamper() {
  const cands = S.log.filter(e => e.kind === 'effect' && e.dec === 'allow' && e.res === 'payments.refund');
  const e = cands[0] || S.log[Math.floor(S.log.length / 2)];
  S.tamper = { seq: e.seq, before: clone(e) };
  e.summary = e.summary.replace(/\$\d+/, '$0') + ' ';
  e.dec = 'deny';
  return e;
}
function untamper() {
  if (!S.tamper) return; const i = S.log.findIndex(e => e.seq === S.tamper.seq);
  if (i >= 0) S.log[i] = S.tamper.before; S.tamper = null;
}

/* ---------- seed ---------- */
function at(iso) { S.clock = Date.parse(iso); }
function seed() {
  S = blank();
  logEvent({ agent: 'os', kind: 'boot', res: 'node/vpc-us-east-1', dec: 'system', summary: 'WunderOS node commissioned inside the Northwind VPC' });
  signSpec(SPEC_V1, 'K. Ito · CISO', 'Initial agent policy');
  at('2026-07-08T14:10:00Z'); startRun('refund', { ticket: 'T-1001' });
  at('2026-07-22T16:40:00Z'); startRun('refund', { ticket: 'T-1002' });
  at('2026-08-05T10:05:00Z'); startRun('sentinel', {});
  at('2026-08-19T13:30:00Z'); startRun('refund', { ticket: 'T-1003' });
  at('2026-09-09T09:00:00Z');
  const v1 = openVisit('meridian-forecaster', 'Q4 capacity planning (pilot)');
  v1.facts.forEach(f => { if (f.gate === 'pending') curate(v1, f.id, 'release', 'M. Alvarez · Data owner'); });
  closeVisit(v1, 'M. Alvarez · Data owner');
  at('2026-09-24T15:20:00Z'); startRun('refund', { ticket: 'T-1007' });
  at('2026-10-01T12:00:00Z');
  signSpec(specV2(), 'K. Ito · CISO', 'Lower refund approval threshold to $500; revoke PII from inherited agents');
  S.model = 'atlas-8@2026-10';
  logEvent({ agent: 'os', kind: 'model.switch', res: 'atlas-8@2026-10', dec: 'system', summary: 'Default model changed atlas-7@2026-06 → atlas-8@2026-10 (vendor upgrade)' });
  at('2026-10-06T11:15:00Z'); startRun('refund', { ticket: 'T-1005' });
  at('2026-10-14T17:45:00Z'); startRun('refund', { ticket: 'T-1004' });
  at('2026-10-20T08:30:00Z'); startRun('sentinel', {});
  at('2026-10-27T10:00:00Z'); openVisit('meridian-forecaster', 'Q4 capacity plan — week 46 lanes');
  syncClock();
  save();
}
function resetWorkspace() { localStorage.removeItem(STORE_KEY); seed(); }
