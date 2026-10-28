'use strict';
/* ---------- UI helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtT = t => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtD = t => new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const money = n => '$' + (Math.round(n * 100) / 100).toFixed(2);
const short = h => h ? h.slice(0, 10) + '…' : '';
const decChip = d => `<span class="chip ${esc(d)}">${esc(d)}</span>`;
const labelChip = l => `<span class="chip ${esc(l)}">${esc(l)}</span>`;
const ringChip = a => `<span class="chip ${a.ring === 0 ? 'system' : 'hold'}">ring ${a.ring} · ${esc(a.kind)}</span>`;
const UI = { sel: {}, replay: {}, verify: null, recFilter: { agent: '', dec: '', q: '' }, auditAgent: 'refund-resolver', auditPeriod: 'Q3 2026', shell: [], more: false, specTab: 'effective' };
const ICON = {
  overview: '<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/>',
  agents: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  runs: '<path d="M4 4l16 8-16 8z"/>',
  spec: '<path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8"/>',
  enclave: '<rect x="3" y="3" width="18" height="18" rx="4"/><rect x="8" y="8" width="8" height="8" rx="2"/>',
  record: '<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/>',
  audit: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  shell: '<path d="M4 6l6 6-6 6M12 19h8"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
};
const ico = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
const NAV = [['overview', 'Overview'], ['agents', 'Agents'], ['runs', 'Runs & Replay'], ['enclave', 'Data Enclave'], ['spec', 'Specification'], ['record', 'Record'], ['audit', 'Regulator view'], ['data', 'Data'], ['shell', 'Operator shell'], ['settings', 'Settings']];
const BNAV = [['overview', 'Home'], ['runs', 'Runs'], ['enclave', 'Enclave'], ['record', 'Record'], ['more', 'More']];
const LOGO = '<svg class="logo" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="8" fill="#0f1b26" stroke="#7cc4ff"/><path d="M16 6l9.5 6.9-3.6 11.1H10.1L6.5 12.9z" fill="none" stroke="#7cc4ff" stroke-width="1.8"/><circle cx="16" cy="16" r="2.6" fill="#a78bfa"/></svg>';

function pending() {
  return { holds: S.runs.filter(r => r.status === 'awaiting'), curation: S.visits.filter(v => v.status === 'curating' && v.facts.some(f => f.gate === 'pending')) };
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
function route() { const h = (location.hash || '#/overview').slice(2).split('/'); return { name: h[0] || 'overview', arg: decodeURIComponent(h[1] || '') }; }

/* ---------- shell layout ---------- */
function render() {
  const r = route(); const p = pending(); const nNeeds = p.holds.length + p.curation.length;
  const active = r.name === 'run' ? 'runs' : r.name;
  const side = NAV.map(([k, l]) => `<a href="#/${k}" class="${active === k ? 'on' : ''}">${ico(k)}${l}${k === 'overview' && nNeeds ? `<span class="badge">${nNeeds}</span>` : ''}</a>`).join('');
  const bnav = BNAV.map(([k, l]) => k === 'more'
    ? `<a href="javascript:void 0" data-act="more" class="${!['overview', 'runs', 'enclave', 'record'].includes(active) ? 'on' : ''}">${ico('more')}${l}</a>`
    : `<a href="#/${k}" class="${active === k ? 'on' : ''}">${ico(k)}${l}${k === 'overview' && nNeeds ? `<span class="badge">${nNeeds}</span>` : ''}</a>`).join('');
  const view = (VIEWS[r.name] || VIEWS.overview)(r.arg);
  document.body.innerHTML = `<div class="app"><aside class="side">
    <div class="brand">${LOGO}<div><b>WunderOS</b><small>console · v${APP_VERSION}</small></div></div>
    <nav class="nav">${side}</nav>
    <div class="foot">node vpc-us-east-1<br>spec v${currentSpec().v} · ${short(currentSpec().hash)}<br>${esc(S.model)}</div></aside>
    <main id="main">${view}</main></div>
    <nav class="bnav">${bnav}</nav>
    ${UI.more ? `<div class="modal scrim" data-act="closemore"></div><div class="sheet">${NAV.filter(n => !['overview', 'runs', 'enclave', 'record'].includes(n[0])).map(([k, l]) => `<a href="#/${k}" data-act="closemore">${ico(k)}${l}</a>`).join('')}</div>` : ''}
    ${UI.modal || ''}`;
  if (r.name === 'shell') { const sh = $('#shellout'); if (sh) sh.scrollTop = sh.scrollHeight; }
}
function head(eyebrow, title, lede, right) {
  return `<div class="top"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</div>${right ? `<div class="row">${right}</div>` : ''}</div>`;
}

/* ---------- views ---------- */
const VIEWS = {};
VIEWS.overview = () => {
  const p = pending(); const chain = verifyChain(); const m = monthOf(S.clock);
  const evMonth = S.log.filter(e => monthOf(e.t) === m);
  const crossings = S.log.filter(e => ['read', 'model', 'tool', 'effect', 'emit'].includes(e.kind));
  const denies = crossings.filter(e => e.dec === 'deny').length; const holds = S.log.filter(e => e.dec === 'hold').length;
  const spend = S.agents.reduce((s, a) => s + spendMTD(a.id), 0);
  const needs = [
    ...p.holds.map(r => `<div class="li"><span class="chip hold">hold</span><div class="grow"><b>${esc(agentById(r.agent).name)}</b> wants <span class="mono">payments.refund $${esc(r.journal.length && (r.journal.find(j => j.intent.kind === 'model') || {}).result ? r.journal.find(j => j.intent.kind === 'model').result.amount : '')}</span><div class="small mut">${esc(r.id)} · rule ${esc(S.log.filter(e => e.run === r.id && e.dec === 'hold').slice(-1)[0]?.rule || '')} · ${fmtT(r.started)}</div></div><a class="btn sm" href="#/run/${r.id}">Review</a></div>`),
    ...p.curation.map(v => `<div class="li"><span class="chip mem">curate</span><div class="grow"><b>${esc(v.id)}</b> · ${v.facts.filter(f => f.gate === 'pending').length} fact(s) waiting at the curation gate<div class="small mut">${esc(agentById(v.agent).name)} · ${esc(v.purpose)}</div></div><a class="btn sm" href="#/enclave">Curate</a></div>`),
  ].join('') || '<div class="mut small">Nothing needs you. Every agent is inside policy.</div>';
  const tail = S.log.slice(-7).reverse().map(evRow).join('');
  return head('WunderOS · Pre-release simulator', 'Own the agents that run your business.',
    'The specification, the runtime and the record — inside your VPC, where you can audit and answer for every agent you build, inherit or admit.',
    `<a class="btn" href="#/audit">${ico('audit')}Answer a regulator</a><a class="btn pri" href="#/agents">${ico('runs')}Run an agent</a>`) + `
  <div class="grid g4">
    ${meter('Gate crossings', crossings.length, 'every read, model call, tool call & side effect')}
    ${meter('Refused at the gate', denies, `${holds} held for a human`)}
    ${meter('Model spend · ' + m, money(spend), S.agents.length + ' agents under budget meters')}
    <a class="card meter corner" href="#/record" style="color:inherit">${chain.ok ? `<div class="v" style="color:var(--ok)">Intact</div><div class="k">record · ${chain.n} events hash-chained</div>` : `<div class="v" style="color:var(--bad)">Broken</div><div class="k">at event #${chain.at}</div>`}</a>
  </div>
  <div class="hero" style="margin-top:14px">
    <div class="card"><div class="row between"><h2>Needs you</h2><span class="chip">${p.holds.length + p.curation.length}</span></div><div class="list">${needs}</div>
      <div class="pill3">
        <a href="#/spec"><b>The specification</b><small>Rules you can read, change and sign — v${currentSpec().v} · ${short(currentSpec().hash)}</small></a>
        <a href="#/runs"><b>The runtime</b><small>One governed boundary; replay any run decision for decision</small></a>
        <a href="#/record"><b>The record</b><small>What agents did at the boundary — not what they said</small></a>
      </div></div>
    <div class="card"><h2>Gate activity · last 8 weeks</h2>${spark()}<div class="row small mut" style="gap:14px"><span><i style="color:var(--ok)">■</i> allow</span><span><i style="color:var(--bad)">■</i> deny</span><span><i style="color:var(--hold)">■</i> hold</span></div>
      <h3 style="margin-top:12px">Fleet</h3>${S.agents.map(a => { const s = spendMTD(a.id); const pct = Math.min(100, s / a.budget * 100); return `<div style="margin:8px 0"><div class="row between small"><span>${esc(a.name)} ${a.status === 'suspended' ? '<span class="chip deny">suspended</span>' : ''}</span><span class="mono mut">${money(s)} / ${money(a.budget)}</span></div><div class="bar"><i class="${pct > 90 ? 'bad' : pct > 70 ? 'warn' : ''}" style="width:${pct}%"></i></div></div>`; }).join('')}</div>
  </div>
  <div class="card" style="margin-top:14px"><div class="row between"><h2>Latest in the record</h2><a href="#/record" class="small">Open record →</a></div><div class="tablewrap"><table><tbody>${tail}</tbody></table></div></div>
  <p class="small dim" style="margin-top:18px">${evMonth.length} events this month. Unofficial interactive demo inspired by WunderOS by Pentad Labs (pentad.ai). All agents, data and models are simulated in your browser.</p>`;
};
function meter(k, v, sub) { return `<div class="card meter corner"><div class="v">${esc(v)}</div><div class="k">${esc(k)}</div><div class="small dim">${esc(sub)}</div></div>`; }
function spark() {
  const weeks = 8, W = 7 * 864e5; const end = S.clock; const bins = Array.from({ length: weeks }, () => ({ allow: 0, deny: 0, hold: 0 }));
  S.log.forEach(e => { const k = weeks - 1 - Math.floor((end - e.t) / W); if (k >= 0 && k < weeks && bins[k][e.dec] !== undefined) bins[k][e.dec]++; });
  const max = Math.max(1, ...bins.map(b => b.allow + b.deny + b.hold)); const bw = 300 / weeks;
  const bars = bins.map((b, i) => { let y = 70; return ['allow', 'deny', 'hold'].map(k => { const h = b[k] / max * 64; y -= h; return h ? `<rect x="${i * bw + 4}" y="${y}" width="${bw - 8}" height="${h}" rx="2" fill="${k === 'allow' ? '#3fd18b' : k === 'deny' ? '#ff6b6b' : '#f5b84b'}"/>` : ''; }).join(''); }).join('');
  return `<svg class="spark" viewBox="0 0 300 72" preserveAspectRatio="none">${bars}</svg>`;
}
function evRow(e) {
  const a = agentById(e.agent);
  return `<tr class="click" data-act="openev" data-seq="${e.seq}"><td class="mono dim nowrap">#${e.seq}</td><td class="nowrap small mut hide-m">${fmtT(e.t)}</td><td class="nowrap small">${esc(a ? a.name : e.agent)}</td><td>${decChip(e.kind === 'emit' ? 'mem' : e.dec).replace('>mem<', '>memory<')} <span class="small">${esc(e.summary || e.kind)}</span>${e.rule ? ` <span class="chip">${esc(e.rule)}</span>` : ''}</td></tr>`;
}

VIEWS.agents = () => {
  const ring = `<svg class="ring" viewBox="0 0 420 300" font-family="ui-monospace,monospace" font-size="11">
    <rect x="6" y="6" width="408" height="288" rx="16" fill="none" stroke="#2a3846"/><text x="20" y="26" fill="#8b9bab">CUSTOMER VPC — nothing leaves</text>
    <rect x="30" y="38" width="360" height="200" rx="14" fill="#101a24" stroke="#7cc4ff"/><text x="46" y="58" fill="#7cc4ff">WUNDEROS · identity · memory · governance · recovery</text>
    <rect x="52" y="70" width="150" height="150" rx="12" fill="#0d141b" stroke="#3fd18b" stroke-dasharray="3 3"/><text x="62" y="88" fill="#3fd18b">RING 0 · native</text>
    <text x="62" y="112" fill="#e6edf3">● Ledger Sentinel</text>
    <rect x="218" y="70" width="150" height="150" rx="12" fill="#0d141b" stroke="#f5b84b" stroke-dasharray="3 3"/><text x="228" y="88" fill="#f5b84b">RING 1 · microVM</text>
    <text x="228" y="112" fill="#e6edf3">● Refund Resolver</text><text x="240" y="128" fill="#8b9bab">inherited</text>
    <rect x="226" y="140" width="134" height="70" rx="10" fill="none" stroke="#a78bfa"/><text x="234" y="158" fill="#a78bfa">DATA ENCLAVE</text><text x="234" y="178" fill="#e6edf3">● Meridian</text><text x="246" y="194" fill="#8b9bab">Forecaster</text>
    <line x1="210" y1="238" x2="210" y2="262" stroke="#7cc4ff"/><rect x="120" y="252" width="180" height="26" rx="8" fill="#0d141b" stroke="#7cc4ff"/><text x="146" y="269" fill="#7cc4ff">GATE → your data · record</text>
  </svg>`;
  const cards = S.agents.map(a => {
    const sc = Object.entries(SCENARIOS).filter(([, s]) => s.agent === a.id);
    const runs = S.runs.filter(r => r.agent === a.id); const ev = S.log.filter(e => e.agent === a.id);
    const s = spendMTD(a.id); const pct = Math.min(100, s / a.budget * 100);
    const runners = sc.map(([k, s2]) => k === 'forecast'
      ? `<a class="btn sm" href="#/enclave">Admit to enclave →</a>`
      : `<div class="row">${s2.param ? `<select class="inp" style="width:auto" id="p-${k}">${s2.options().map(o => `<option>${esc(o)}</option>`).join('')}</select>` : ''}<button class="btn sm pri" data-act="run" data-sc="${k}" ${a.status === 'suspended' ? 'disabled' : ''}>${esc(s2.title)}</button></div>`).join('');
    return `<div class="card corner"><div class="row between"><h2 style="margin:0">${esc(a.name)}</h2>${ringChip(a)}</div>
      <p class="small mut" style="margin:6px 0 10px">${esc(a.blurb)}</p>
      <dl class="kv"><dt>Vendor</dt><dd>${esc(a.vendor)}</dd><dt>Runtime</dt><dd>${esc(a.runtime)}</dd><dt>Identity</dt><dd class="mono">agent://${esc(a.id)}</dd><dt>Signing key</dt><dd class="hash">${short(keyOf(a.id))} (rooted apart from identity)</dd>
      <dt>Runs</dt><dd>${runs.length} · ${ev.filter(e => e.dec === 'deny').length} refusals · ${ev.filter(e => e.dec === 'hold').length} holds</dd></dl>
      <div style="margin:10px 0"><div class="row between small"><span>Budget ${esc(monthOf(S.clock))}</span><span class="mono">${money(s)} / ${money(a.budget)}</span></div><div class="bar"><i class="${pct > 90 ? 'bad' : pct > 70 ? 'warn' : ''}" style="width:${pct}%"></i></div></div>
      <div class="col">${runners}<div class="row"><button class="btn sm ${a.status === 'suspended' ? 'ok' : 'bad'}" data-act="suspend" data-id="${a.id}">${a.status === 'suspended' ? 'Resume agent' : 'Suspend agent'}</button><button class="btn sm ghost" data-act="budget" data-id="${a.id}">Edit budget</button><a class="btn sm ghost" href="#/shell" data-act="procfs" data-id="${a.id}">/procfs</a></div></div></div>`;
  }).join('');
  return head('Runtime · Identity', 'Agents', 'Every agent — built, inherited or admitted — runs under one governed boundary. No agent can rewrite the rules it runs under.') +
    `<div class="grid g2"><div class="card">${ring}</div><div class="card"><h2>How a run works</h2><ol class="small mut" style="padding-left:18px;margin:0">
     <li>The agent program yields an intent: <span class="mono">read</span>, <span class="mono">model</span>, <span class="mono">tool</span>, <span class="mono">effect</span> or memory <span class="mono">emit</span>.</li>
     <li>The <b>gate</b> evaluates it against the signed specification (first match wins, deny by default), plus budget and suspension.</li>
     <li>The model is called <b>off the hot path</b>; its output is recorded so the run can be replayed exactly.</li>
     <li>Every crossing is written to the hash-chained record, signed with the agent’s key.</li>
     <li>Held steps pause the run; an operator approval resumes it by deterministic replay from the journal.</li></ol></div></div>
     <div class="grid g3" style="margin-top:14px">${cards}</div>`;
};

VIEWS.runs = () => {
  const rows = S.runs.map(r => `<tr class="click" data-act="go" data-href="#/run/${r.id}"><td class="mono">${esc(r.id)}</td><td>${esc(agentById(r.agent).name)}<div class="small mut">${esc(SCENARIOS[r.scenario].title)} ${esc(r.params.ticket || r.visit || '')}</div></td>
    <td>${statusChip(r.status)}</td><td class="small mut hide-m">${fmtT(r.started)}</td><td class="small mono hide-m">v${r.spec} · ${esc(r.model)}</td><td class="small">${esc(r.result ? r.result.summary : r.status === 'awaiting' ? 'Waiting for approval' : '')}</td></tr>`).join('');
  return head('Runtime · Lightstand', 'Runs & Replay', 'Every run is a deterministic control loop. Open one to see what the agent saw at each step, replay it decision for decision, or ask “what if” under today’s spec or another model.') +
    `<div class="card"><div class="tablewrap"><table><thead><tr><th>Run</th><th>Agent</th><th>Status</th><th class="hide-m">Started</th><th class="hide-m">Spec · model</th><th>Outcome</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
};
function statusChip(s) { const m = { done: 'allow', awaiting: 'hold', blocked: 'deny', cancelled: 'deny', failed: 'deny', running: 'system', diverged: 'deny' }; return `<span class="chip ${m[s] || ''}">${esc(s)}</span>`; }

VIEWS.run = id => {
  const r = S.runs.find(x => x.id === id); if (!r) return head('Runs', 'Run not found', '') + '<a href="#/runs">← Back</a>';
  const a = agentById(r.agent); const sel = UI.sel[id] !== undefined ? UI.sel[id] : null;
  const steps = r.journal.map(j => {
    const d = j.dec.act === 'hold' && j.approval ? 'allow' : j.result.denied ? 'deny' : 'allow';
    const ev = S.log.find(e => e.seq === j.seq);
    return `<div class="step ${d} ${j.intent.kind === 'model' ? 'model' : ''} ${sel === j.i ? 'sel' : ''}" data-act="selstep" data-run="${id}" data-i="${j.i}" style="animation-delay:${j.i * 60}ms">
      <div class="row between"><span class="mono small">${j.i}. ${esc(j.intent.kind)}${j.intent.kind === 'model' ? ' · async, off hot path' : ''}</span><span class="row" style="gap:4px">${decChip(d)}<span class="chip">${esc(j.dec.rule)}${j.approval ? ' ✓' : ''}</span></span></div>
      <div class="small">${esc(ev ? ev.summary : '')}</div>${j.labels && j.labels.length ? `<div class="row" style="gap:4px;margin-top:4px">${j.labels.map(labelChip).join('')}</div>` : ''}</div>`;
  }).join('');
  let held = '';
  if (r.status === 'awaiting') {
    const hev = S.log.filter(e => e.run === r.id && e.dec === 'hold').slice(-1)[0];
    held = `<div class="step hold sel"><div class="row between"><span class="mono small">${r.holdAt}. effect</span><span class="row" style="gap:4px">${decChip('hold')}<span class="chip">${esc(hev ? hev.rule : '')}</span></span></div><div class="small">${esc(hev ? hev.summary : '')}</div>
      <div class="row" style="margin-top:8px"><button class="btn sm ok" data-act="approve" data-id="${r.id}">Approve (sign)</button><button class="btn sm bad" data-act="reject" data-id="${r.id}">Reject</button></div></div>`;
  }
  const j = sel !== null ? r.journal[sel] : null;
  const ev = j ? S.log.find(e => e.seq === j.seq) : null;
  const rule = j ? (specByV(r.spec).rules.find(x => x.id === j.dec.rule)) : null;
  const insp = j ? `<h2>Step ${j.i} · what the agent saw</h2>
    <dl class="kv"><dt>Intent</dt><dd><pre>${esc(JSON.stringify(j.intent, null, 1))}</pre></dd>
    <dt>Decision</dt><dd>${decChip(j.dec.act)} <span class="mono">${esc(j.dec.rule)}</span> under spec v${r.spec}${rule ? `<div class="small mut">${esc(rule.text)}</div>` : j.dec.rule === 'DEFAULT' ? '<div class="small mut">No rule matched — deny by default.</div>' : ''}${j.approval ? `<div class="small" style="color:var(--ok)">Approved by ${esc(j.approval.by)}</div>` : ''}</dd>
    ${j.model ? `<dt>Model</dt><dd class="mono">${esc(j.model)} · ${money(j.cost || 0)}</dd>` : ''}
    <dt>Result</dt><dd><pre>${esc(JSON.stringify(j.result, null, 1))}</pre></dd>
    ${j.lineage && j.lineage.length ? `<dt>Lineage</dt><dd class="mono small">${j.lineage.map(esc).join(', ')}</dd>` : ''}
    <dt>Record</dt><dd class="hash">#${j.seq} · ${ev ? ev.hash : ''}<br>sig ${ev ? ev.sig : ''}</dd></dl>` : '<div class="mut small">Select a step to inspect the exact inputs, decision and result retained in the record.</div>';
  const rp = UI.replay[id];
  let rpv = '';
  if (rp) {
    const lbl = `spec v${rp.spec} · ${esc(rp.model)}`;
    rpv = `<div class="banner ${rp.identical ? 'ok' : rp.whatif ? 'warn' : 'bad'}">${rp.identical ? `<b>Identical.</b> ${rp.rows.length} step(s) replayed under ${lbl}: same intents, same decisions, same outputs, and every step matches its hash in the record.` : `<b>${rp.whatif ? 'Counterfactual differs' : 'Replay mismatch'}</b> under ${lbl} — first divergence at step ${rp.firstDiv}.`}</div>
    <div class="tablewrap"><table><thead><tr><th>#</th><th>Intent</th><th>Recorded</th><th>Replayed</th><th>Output</th></tr></thead><tbody>${rp.rows.map(x => `<tr><td class="mono">${x.i}</td><td class="small">${esc(x.intent.kind)} ${esc(x.intent.res || x.intent.task || '')}</td>
      <td>${x.rec && x.rec.act ? decChip(x.rec.act) + ' <span class="mono small">' + esc(x.rec.rule) + '</span>' : '<span class="small mut">' + esc(x.status) + '</span>'}</td>
      <td>${x.now ? decChip(x.now.act) + ' <span class="mono small">' + esc(x.now.rule) + '</span>' : '<span class="small mut">' + esc(x.note || x.status) + '</span>'}</td>
      <td class="small">${x.status === 'match' ? '<span style="color:var(--ok)">same</span>' : x.outSame === false ? `<span style="color:var(--hold)">new model says: ${esc(x.result.decision || '')} ${x.result.amount !== undefined ? '$' + esc(x.result.amount) : ''} ${esc(x.result.summary || (x.result.facts ? x.result.facts[0] : '') || '')}</span>` : x.recordOk === false ? '<span style="color:var(--bad)">record hash mismatch</span>' : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const otherModels = Object.keys(MODELS).filter(m => m !== r.model);
  return head(`Lightstand · ${esc(r.id)}`, `${esc(a.name)} · ${esc(SCENARIOS[r.scenario].title)} ${esc(r.params.ticket || r.visit || '')}`,
    `${statusChip(r.status)} &nbsp;Started ${fmtT(r.started)} · spec v${r.spec} · ${esc(r.model)} · cost ${money(r.cost || r.journal.reduce((s, x) => s + (x.cost || 0), 0))}${r.result ? ' · ' + esc(r.result.summary) : ''}`,
    `<a class="btn ghost" href="#/runs">← Runs</a>`) +
    `<div class="grid g2"><div class="card"><h2>Control loop</h2><div class="tl">${steps}${held}</div></div><div class="card">${insp}</div></div>
    <div class="card" style="margin-top:14px"><h2>Replay</h2><p class="small mut" style="margin-top:0">Replay re-runs the agent program against the inputs retained in the record. The model is not called again unless you ask — its recorded output is the input.</p>
    <div class="row"><button class="btn pri" data-act="replay" data-id="${id}">Replay exactly</button>
    ${currentSpec().v !== r.spec ? `<button class="btn" data-act="whatif" data-id="${id}" data-spec="${currentSpec().v}">What if: today’s spec v${currentSpec().v}</button>` : ''}
    ${r.journal.some(x => x.intent.kind === 'model') ? otherModels.map(m => `<button class="btn" data-act="whatif" data-id="${id}" data-model="${m}">What if: ${esc(m)}</button>`).join('') : ''}</div>${rpv}</div>`;
};

VIEWS.spec = () => {
  const cur = currentSpec(); const tab = UI.specTab;
  const tabs = `<div class="tabs"><a href="javascript:void 0" data-act="spectab" data-t="effective" class="${tab === 'effective' ? 'on' : ''}">Effective v${cur.v}</a><a href="javascript:void 0" data-act="spectab" data-t="draft" class="${tab === 'draft' ? 'on' : ''}">Draft${S.spec.draft ? ' •' : ''}</a><a href="javascript:void 0" data-act="spectab" data-t="history" class="${tab === 'history' ? 'on' : ''}">History (${S.spec.versions.length})</a></div>`;
  let body = '';
  if (tab === 'effective') body = `<div class="card"><div class="row between"><div><b>Version ${cur.v}</b> · signed by ${esc(cur.by)} · ${fmtD(cur.at)}<div class="hash">${cur.hash}</div></div><button class="btn" data-act="newdraft">Propose a change</button></div>${rulesTable(cur.rules, false)}<p class="small mut">Rules are evaluated top to bottom; the first match decides. Anything no rule allows is denied by default.</p></div>`;
  else if (tab === 'draft') {
    if (!S.spec.draft) body = `<div class="card"><p class="mut">No draft. Start one from the effective spec.</p><button class="btn pri" data-act="newdraft">Start draft from v${cur.v}</button></div>`;
    else body = `<div class="card"><div class="row between"><b>Draft → v${cur.v + 1}</b><div class="row"><button class="btn" data-act="addrule">Add rule</button><button class="btn bad" data-act="discard">Discard</button><button class="btn pri" data-act="signspec">Sign off…</button></div></div>${rulesTable(S.spec.draft, true)}<h3 style="margin-top:14px">Diff vs v${cur.v}</h3>${specDiff(cur.rules, S.spec.draft)}</div>`;
  } else body = `<div class="card"><div class="list">${S.spec.versions.slice().reverse().map(v => `<div class="li"><span class="chip system">v${v.v}</span><div class="grow"><b>${esc(v.note)}</b><div class="small mut">${esc(v.by)} · ${fmtD(v.at)} · ${v.rules.length} rules</div><div class="hash">${v.hash}</div>${v.v > 1 ? `<details><summary class="small">Diff vs v${v.v - 1}</summary>${specDiff(specByV(v.v - 1).rules, v.rules)}</details>` : ''}</div></div>`).join('')}</div></div>`;
  return head('The specification', 'Rules you can read and change', 'Your policy, vocabulary and constraints in a form people can read, amend and sign off. When a requirement changes, you change it — not the vendor.') + tabs + body;
};
function rulesTable(rules, edit) {
  return `<div class="tablewrap"><table><thead><tr><th>ID</th><th>Rule</th><th class="hide-m">Applies to</th>${edit ? '<th></th>' : ''}</tr></thead><tbody>${rules.map((r, i) => `<tr><td class="mono">${esc(r.id)}</td><td>${decChip(r.act)} <span class="mono small">${esc(r.kind)} ${esc(r.res)}${r.when && r.when.f ? ` when ${esc(r.when.f)} ${esc(r.when.op)} ${esc(r.when.v)}` : ''}</span><div class="small mut">${esc(r.text)}</div></td><td class="mono small hide-m">${esc(r.who)}</td>
    ${edit ? `<td class="nowrap"><button class="btn sm ghost" data-act="mvrule" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''}>↑</button><button class="btn sm ghost" data-act="mvrule" data-i="${i}" data-d="1" ${i === rules.length - 1 ? 'disabled' : ''}>↓</button><button class="btn sm" data-act="editrule" data-i="${i}">Edit</button><button class="btn sm bad" data-act="delrule" data-i="${i}">✕</button></td>` : ''}</tr>`).join('')}
    <tr><td class="mono dim">—</td><td>${decChip('deny')} <span class="mono small">* * (default)</span></td><td class="mono small hide-m">*</td>${edit ? '<td></td>' : ''}</tr></tbody></table></div>`;
}
function specDiff(a, b) {
  const A = Object.fromEntries(a.map(r => [r.id, ruleText(r)])); const B = Object.fromEntries(b.map(r => [r.id, ruleText(r)]));
  const ids = [...new Set([...a.map(r => r.id), ...b.map(r => r.id)])]; const out = [];
  ids.forEach(id => { if (A[id] === B[id]) return; if (A[id]) out.push(`<div class="diffdel mono small">- ${esc(id)} ${esc(A[id])}</div>`); if (B[id]) out.push(`<div class="diffadd mono small">+ ${esc(id)} ${esc(B[id])}</div>`); });
  if (canon(a.map(r => r.id)) !== canon(b.map(r => r.id)) && !out.length) out.push('<div class="mono small mut">rule order changed</div>');
  return `<pre>${out.join('') || '<span class="mut">no changes</span>'}</pre>`;
}

VIEWS.enclave = () => {
  const v = S.visits[0];
  const stage = !v ? 0 : v.status === 'open' ? 2 : v.status === 'curating' ? 4 : 5;
  const loop = [['1', 'Agent comes to the data', 'Computation moves to your VPC; data never does.'], ['2', 'Every action governed', 'Reads, model calls and effects cross one gate.'], ['3', 'Provable, replayable', 'The visit is in the record, replayable step by step.'], ['4', 'You curate what it keeps', 'Nothing leaves if its lineage reaches a protected source.']]
    .map((s, i) => `<div class="s ${stage === 4 && i === 3 ? 'on' : stage > i + 1 ? 'done' : ''}"><b>STAGE ${s[0]}</b>${s[1]}<div class="small dim">${s[2]}</div></div>`).join('');
  const guest = S.agents.find(a => a.kind === 'guest');
  const facts = v ? v.facts.map(f => `<div class="fact ${f.gate.startsWith('purged') ? '' : f.gate}" style="margin-bottom:8px"><div class="row between"><span class="mono small dim">${esc(f.id)}</span><span class="chip ${f.gate === 'blocked' ? 'deny' : f.gate === 'released' ? 'allow' : f.gate === 'pending' ? 'hold' : ''}">${esc(f.gate)}</span></div>
     <div style="margin:4px 0">${esc(f.text)}</div><div class="row small" style="gap:4px">lineage: ${f.lineage.length ? f.lineage.map(l => `<span class="chip ${(S.data[l] || {}).label}">${esc(l)}</span>`).join('') : '<span class="mut">none</span>'}</div>
     ${f.gate === 'blocked' ? '<div class="small" style="color:var(--bad);margin-top:4px">Blocked by Information Flow Control — lineage reaches a protected source.</div>' : ''}
     ${f.gate === 'pending' && v.status === 'curating' ? `<div class="row" style="margin-top:8px"><button class="btn sm ok" data-act="curate" data-v="${v.id}" data-f="${f.id}" data-a="release">Release to partner</button><button class="btn sm bad" data-act="curate" data-v="${v.id}" data-f="${f.id}" data-a="reject">Reject</button></div>` : ''}</div>`).join('') : '';
  const past = S.visits.map(x => `<div class="li"><span class="chip ${x.status === 'closed' ? '' : 'mem'}">${esc(x.status)}</span><div class="grow"><b>${esc(x.id)}</b> · ${esc(x.purpose)}<div class="small mut">${esc(agentById(x.agent).name)} · ${fmtD(x.opened)} · ${x.facts.filter(f => f.gate === 'released').length}/${x.facts.length} facts released · <a href="#/run/${x.run}">${esc(x.run)}</a></div></div></div>`).join('');
  return head('Agentic Data Enclave', 'Bring the agents to the data', 'Their agents come in. Only the answers you approve go out. The visiting agent’s memory lives in the OS, not the agent — so the enclave owns the last word.',
    `<button class="btn pri" data-act="admit" ${v && v.status !== 'closed' ? 'disabled' : ''}>Admit ${esc(guest.name)}</button>`) +
    `<div class="card"><div class="loop">${loop}</div></div>
    <div class="grid g2" style="margin-top:14px"><div class="card"><div class="row between"><h2>Curation gate${v ? ' · ' + esc(v.id) : ''}</h2>${v && v.status === 'curating' ? `<button class="btn" data-act="closevisit" data-v="${v.id}" ${v.facts.some(f => f.gate === 'pending') ? 'disabled title="Decide every pending fact first"' : ''}>Close visit & purge</button>` : ''}</div>
      ${v ? `<p class="small mut" style="margin-top:0">${esc(v.purpose)} · run <a href="#/run/${v.run}">${esc(v.run)}</a></p>${facts}` : '<p class="mut">No visits yet.</p>'}</div>
      <div class="card"><h2>Enclave data</h2>${['forecasts.q4', 'inventory.partner', 'customers.pii'].map(k => `<div class="li"><span class="chip ${S.data[k].label}">${S.data[k].label}</span><div class="grow"><span class="mono">${k}</span><div class="small mut">${esc(S.data[k].desc)} · owner ${esc(S.data[k].owner)}</div></div></div>`).join('')}
      <h3 style="margin-top:12px">Visits</h3><div class="list">${past}</div></div></div>`;
};

VIEWS.record = () => {
  const f = UI.recFilter;
  const evs = S.log.filter(e => (!f.agent || e.agent === f.agent) && (!f.dec || e.dec === f.dec) && (!f.q || (e.summary + ' ' + e.res + ' ' + e.run + ' ' + e.rule).toLowerCase().includes(f.q.toLowerCase()))).slice().reverse();
  const vb = UI.verify ? (UI.verify.ok ? `<div class="banner ok"><b>Record verified.</b> ${UI.verify.n} events; every hash links to its predecessor and every signature matches its agent key. Head <span class="hash">${UI.verify.head}</span></div>` : `<div class="banner bad"><b>Tamper detected at event #${UI.verify.at}:</b> ${esc(UI.verify.why)}. Everything after it can no longer be trusted as evidence.</div>`) : '';
  const blob = URL.createObjectURL(new Blob([JSON.stringify({ exported: new Date(S.clock).toISOString(), head: S.log.length ? S.log[S.log.length - 1].hash : null, log: S.log }, null, 1)], { type: 'application/json' }));
  const opts = [['', 'All agents'], ...S.agents.map(a => [a.id, a.name]), ['os', 'WunderOS'], ['operator', 'Operator']];
  return head('The record · Wunderlog', 'What each agent did — at the boundary', 'Not what it said it did. Every event is hash-chained to the one before and signed with a key rooted apart from the agent’s identity. No agent and no single party can edit it unnoticed.',
    `<button class="btn pri" data-act="verify">Verify chain</button>${S.tamper ? '<button class="btn ok" data-act="untamper">Restore record</button>' : '<button class="btn bad" data-act="tamper">Tamper drill</button>'}<a class="btn" href="${blob}" download="wunderlog-${monthOf(S.clock)}.json">Export</a>`) +
    vb + `<div class="card"><div class="row" style="margin-bottom:10px"><select class="inp" style="width:auto" data-filter="agent">${opts.map(o => `<option value="${o[0]}" ${f.agent === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>
    <select class="inp" style="width:auto" data-filter="dec">${['', 'allow', 'deny', 'hold', 'system'].map(d => `<option value="${d}" ${f.dec === d ? 'selected' : ''}>${d || 'All decisions'}</option>`).join('')}</select>
    <input class="inp" style="flex:1;min-width:140px" placeholder="Search…" data-filter="q" value="${esc(f.q)}"><span class="small mut">${evs.length} events</span></div>
    <div class="tablewrap"><table><thead><tr><th>#</th><th class="hide-m">Time</th><th>Principal</th><th>Event</th></tr></thead><tbody>${evs.slice(0, 300).map(evRow).join('')}</tbody></table></div></div>`;
};

VIEWS.audit = () => {
  const q = regulatorAnswer(UI.auditAgent, UI.auditPeriod);
  const allOk = q.replays.every(x => x.ok);
  const report = auditText(q);
  const blob = URL.createObjectURL(new Blob([report], { type: 'text/markdown' }));
  return head('Regulator view', 'Two questions, answered from your own systems', 'What was this agent allowed to do? What did it actually do — which model version made the decision, and what data did it see? If answering either means calling the vendor, you bought a dependency.') +
    `<div class="card noprint"><div class="row"><select class="inp" style="width:auto" data-aud="agent">${S.agents.map(a => `<option value="${a.id}" ${a.id === UI.auditAgent ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
    <select class="inp" style="width:auto" data-aud="period">${Object.keys(QUARTERS).map(p => `<option ${p === UI.auditPeriod ? 'selected' : ''}>${p}</option>`).join('')}</select>
    <a class="btn" href="${blob}" download="answer-${q.agent.id}-${UI.auditPeriod.replace(/\s/g, '')}.md">Download answer (.md)</a></div></div>
    <div class="grid g2" style="margin-top:14px"><div class="card corner"><div class="eyebrow">Question 1</div><h2>What was ${esc(q.agent.name)} allowed to do?</h2>
      ${q.specs.length ? q.specs.map(s => `<div style="margin-bottom:12px"><b>Spec v${s.v}</b> <span class="small mut">signed ${esc(s.by)} · ${fmtD(s.at)}</span><div class="hash">${s.hash}</div>
      <div class="list">${s.rules.map(r => `<div class="li">${decChip(r.act)}<div class="grow small"><span class="mono">${esc(r.id)} ${esc(r.kind)} ${esc(r.res)}${r.when && r.when.f ? ` when ${esc(r.when.f)} ${esc(r.when.op)} ${esc(r.when.v)}` : ''}</span><div class="mut">${esc(r.text)}</div></div></div>`).join('')}</div></div>`).join('') : '<p class="mut">No specification was in force.</p>'}
      <p class="small mut">Answered from the signed specification you own.</p></div>
    <div class="card corner"><div class="eyebrow">Question 2</div><h2>What did it actually do?</h2>
      <dl class="kv"><dt>Runs</dt><dd>${q.runs.length} ${q.runs.map(r => `<a class="mono small" href="#/run/${r.id}">${r.id}</a>`).join(' ')}</dd>
      <dt>Model versions</dt><dd class="mono">${q.models.map(esc).join(', ') || '—'}</dd>
      <dt>Gate decisions</dt><dd>${decChip('allow')} ${q.tally.allow} &nbsp;${decChip('deny')} ${q.tally.deny} &nbsp;${decChip('hold')} ${q.tally.hold}</dd>
      <dt>Model spend</dt><dd>${money(q.spend)}</dd>
      <dt>Data seen</dt><dd>${Object.entries(q.seen).map(([k, n]) => `<span class="chip ${(S.data[k.split('/')[0]] || {}).label}" style="margin:2px">${esc(k)}${n > 1 ? ' ×' + n : ''}</span>`).join('') || '—'}</dd>
      <dt>Replay</dt><dd>${q.replays.length ? (allOk ? `<span style="color:var(--ok)">All ${q.replays.length} runs replay identically</span>` : `<span style="color:var(--bad)">${q.replays.filter(x => !x.ok).length} run(s) fail replay</span>`) : '—'}</dd>
      <dt>Record</dt><dd>${q.chain.ok ? '<span style="color:var(--ok)">hash chain intact</span>' : `<span style="color:var(--bad)">broken at #${q.chain.at}</span>`}</dd></dl>
      <h3 style="margin-top:12px">Decisions</h3><div class="list">${q.runs.map(r => { const m = r.journal.find(j => j.intent.kind === 'model'); return `<div class="li small"><a class="mono" href="#/run/${r.id}">${r.id}</a><div class="grow">${esc(r.result ? r.result.summary : r.status)}<div class="mut">${fmtT(r.started)} · ${esc(r.model)}${m && m.result.confidence ? ' · confidence ' + m.result.confidence : ''}</div></div></div>`; }).join('') || '<div class="mut small">No runs in this period.</div>'}</div>
      <p class="small mut">Answered from the record — evidence, not the agent’s testimony.</p></div></div>`;
};
function auditText(q) {
  const L = [`# Regulator answer — ${q.agent.name} (${q.period})`, '', `Generated ${new Date(S.clock).toISOString()} from WunderOS console v${APP_VERSION}. Record ${q.chain.ok ? 'verified: ' + q.chain.n + ' events, head ' + q.chain.head : 'BROKEN at #' + q.chain.at}.`, '', '## 1. What was it allowed to do?'];
  q.specs.forEach(s => { L.push('', `### Spec v${s.v} — signed by ${s.by}, ${new Date(s.at).toISOString().slice(0, 10)}`, `hash ${s.hash}`, ''); s.rules.forEach(r => L.push(`- ${r.id}: ${ruleText(r)} — ${r.text}`)); L.push('- default: DENY everything else'); });
  L.push('', '## 2. What did it actually do?', '', `Model versions: ${q.models.join(', ') || 'none'}`, `Gate decisions: ${q.tally.allow} allow, ${q.tally.deny} deny, ${q.tally.hold} hold`, `Model spend: $${q.spend.toFixed(2)}`, `Data seen: ${Object.keys(q.seen).join(', ') || 'none'}`, '');
  q.runs.forEach(r => { L.push(`### ${r.id} — ${new Date(r.started).toISOString()} — ${r.model} — spec v${r.spec}`, `Outcome: ${r.result ? r.result.summary : r.status}`, `Replay: ${q.replays.find(x => x.id === r.id).ok ? 'identical' : 'MISMATCH'}`); r.journal.forEach(j => { const e = S.log.find(x => x.seq === j.seq); L.push(`  ${j.i}. ${e ? e.summary : j.intent.kind} [${j.dec.act}/${j.dec.rule}] #${j.seq} ${e ? e.hash.slice(0, 16) : ''}`); }); L.push(''); });
  return L.join('\n');
}

VIEWS.data = () => head('Your data', 'Data that never leaves the VPC', 'The enclave governs every read. Reads are captured in the record as snapshots, so a replay sees exactly what the agent saw — even after the data changes.') +
  `<div class="grid g2">${Object.entries(S.data).map(([k, d]) => { const rows = Array.isArray(d.rows) ? d.rows.slice(-8) : Object.entries(d.rows).map(([id, r]) => Object.assign({ id }, r)); const cols = rows.length ? Object.keys(rows[0]) : [];
    return `<div class="card"><div class="row between"><span class="mono"><b>${k}</b></span>${labelChip(d.label)}</div><div class="small mut" style="margin-bottom:8px">${esc(d.desc)} · owner ${esc(d.owner)}${Array.isArray(d.rows) ? ` · ${d.rows.length} rows (latest 8)` : ''}</div>
    <div class="tablewrap"><table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="small ${c === 'id' ? 'mono' : ''}">${esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`; }).join('')}</div>`;

VIEWS.shell = () => {
  if (!UI.shell.length) UI.shell.push({ t: 'WunderOS operator shell — type `help`.\nAgents are files under /agents (agent /procfs).', c: '' });
  return head('Operator shell', 'A human operator’s shell on the live system', 'Agents as files, so Unix habits work on them.') +
    `<div class="shell" id="shellout">${UI.shell.map(l => (l.c !== '' ? `<span class="p">operator@wunderos:~$</span> ${esc(l.c)}\n` : '') + `<span class="${l.err ? 'e' : ''}">${esc(l.t)}</span>`).join('\n')}</div>
    <form class="shellin" data-form="shell"><input class="inp" id="shellin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ls /agents"><button class="btn pri">Run</button></form>
    <div class="row small" style="margin-top:8px">${['help', 'ls /agents', 'cat /agents/refund-resolver/status', 'ps', 'tail 5', 'verify', 'replay RUN-0002', 'spec'].map(c => `<button class="btn sm ghost mono" data-act="sh" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
};
function shellExec(cmd) {
  const [c, ...a] = cmd.trim().split(/\s+/); let out = ''; let err = false;
  const agentFromPath = p => { const m = /^\/agents\/([^/]+)(?:\/(\w+))?/.exec(p || ''); return m ? { a: agentById(m[1]), f: m[2] } : null; };
  switch (c) {
    case '': return;
    case 'help': out = 'ls /agents            list agents\ncat /agents/<id>/{status,spec,budget,key}\nps                    runs that are running or held\ntail [n]              last n record events\nverify                verify the hash-chained record\nreplay <RUN-ID>       deterministic replay\nspec                  effective specification\nwhoami | date | clear'; break;
    case 'ls': if (!a[0] || a[0] === '/' ) out = 'agents/  data/  record/  spec/'; else if (a[0].startsWith('/agents')) { const p = agentFromPath(a[0]); out = p && p.a ? 'status  spec  budget  key' : S.agents.map(x => x.id + '/').join('  '); } else if (a[0].startsWith('/data')) out = Object.keys(S.data).join('  '); else { out = 'ls: ' + a[0] + ': No such file or directory'; err = true; } break;
    case 'cat': { const p = agentFromPath(a[0]); if (!p || !p.a) { out = 'cat: ' + (a[0] || '') + ': No such file'; err = true; break; } const x = p.a;
      if (p.f === 'status' || !p.f) out = `name:     ${x.name}\nid:       agent://${x.id}\nring:     ${x.ring} (${x.kind})\nstate:    ${x.status}\nruntime:  ${x.runtime}\nruns:     ${S.runs.filter(r => r.agent === x.id).length}\nheld:     ${S.runs.filter(r => r.agent === x.id && r.status === 'awaiting').map(r => r.id).join(',') || '-'}`;
      else if (p.f === 'spec') out = currentSpec().rules.filter(r => matchWho(r.who, x)).map(r => `${r.id}\t${ruleText(r)}`).join('\n') + '\n*\tDENY * * (default)';
      else if (p.f === 'budget') out = `${monthOf(S.clock)}  spent ${money(spendMTD(x.id))} of ${money(x.budget)}`;
      else if (p.f === 'key') out = keyOf(x.id);
      else { out = 'cat: no such file'; err = true; } break; }
    case 'ps': out = 'RUN        AGENT                 STATUS\n' + S.runs.slice(0, 12).map(r => `${r.id}   ${r.agent.padEnd(20)}  ${r.status}`).join('\n'); break;
    case 'tail': out = S.log.slice(-(parseInt(a[0], 10) || 10)).map(e => `#${e.seq} ${new Date(e.t).toISOString().slice(0, 16)} ${String(e.agent).padEnd(19)} ${String(e.dec).padEnd(6)} ${e.summary}`).join('\n'); break;
    case 'verify': { const v = verifyChain(); out = v.ok ? `OK  ${v.n} events  head ${v.head}` : `FAIL at #${v.at}: ${v.why}`; err = !v.ok; break; }
    case 'replay': { const r = S.runs.find(x => x.id === (a[0] || '').toUpperCase()); if (!r) { out = 'replay: unknown run'; err = true; break; } const rp = replay(r); out = rp.rows.map(x => `${x.i}. ${x.intent.kind.padEnd(6)} ${String(x.intent.res || x.intent.task).padEnd(18)} ${x.status}`).join('\n') + `\n=> ${rp.identical ? 'IDENTICAL' : 'DIVERGES at step ' + rp.firstDiv}`; err = !rp.identical; break; }
    case 'spec': out = `spec v${currentSpec().v} ${currentSpec().hash}\n` + currentSpec().rules.map(r => `${r.id}\t${ruleText(r)}`).join('\n'); break;
    case 'whoami': out = S.operator; break;
    case 'date': out = new Date(S.clock).toString(); break;
    case 'clear': UI.shell = [{ t: '', c: '' }]; return;
    default: out = c + ': command not found'; err = true;
  }
  UI.shell.push({ c: cmd, t: out, err });
}

VIEWS.settings = () => {
  const blob = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return head('Settings', 'Workspace', '') + `<div class="grid g2">
    <div class="card"><h2>Model egress</h2><label class="field">Default model for new runs<select data-set="model">${Object.entries(MODELS).map(([k, m]) => `<option value="${k}" ${k === S.model ? 'selected' : ''}>${k} — ${m.provider}, $${m.price}/1K tok</option>`).join('')}</select></label>
      <p class="small mut">Changing the model never changes the past: recorded runs replay with the outputs that were actually returned.</p>
      <label class="field" style="margin-top:10px">Operator name (used on approvals and sign-offs)<input data-set="operator" value="${esc(S.operator)}"></label></div>
    <div class="card"><h2>Data</h2><div class="row"><a class="btn" href="${blob}" download="wunderos-workspace.json">Export workspace</a><label class="btn">Import<input type="file" accept="application/json" data-act="import" hidden></label>
      <button class="btn bad" data-act="reset">${UI.confirmReset ? 'Tap again to reset' : 'Reset demo'}</button></div>
      <p class="small mut">Everything is stored in this browser (localStorage). Reset restores the seeded Northwind workspace.</p></div>
    <div class="card"><h2>Install</h2>${ios ? '<p>On iPhone: open this page in <b>Safari</b> → Share → <b>Add to Home Screen</b>.</p>' : `<button class="btn pri" data-act="install" ${window.__bip ? '' : 'disabled'}>Install app</button><p class="small mut">Works offline once installed. On iPhone use Safari → Share → Add to Home Screen.</p>`}</div>
    <div class="card"><h2>About</h2><p class="small">WunderOS Console v${APP_VERSION} — an unofficial, interactive simulator of the ideas behind <a href="https://pentad.ai/" target="_blank" rel="noopener">WunderOS by Pentad Labs</a>: owned specification, governed runtime, deterministic replay, tamper-evident record and the Agentic Data Enclave. Not affiliated with Pentad Labs. Approval PIN: <span class="mono">${OPERATOR_PIN}</span>.</p></div></div>`;
};

/* ---------- modals ---------- */
function openModal(html) { UI.modal = `<div class="modal" data-act="modalbg"><div class="card" data-stop="1">${html}</div></div>`; render(); const f = document.querySelector('.modal input'); if (f) f.focus(); }
function closeModal() { UI.modal = ''; render(); }
function pinModal(title, body, onOk) {
  UI.onPin = onOk;
  openModal(`<h2>${title}</h2><p class="small mut">${body}</p><form data-form="pin" class="col"><label class="field">Signer<input name="by" value="${esc(S.operator)}"></label><label class="field">PIN (demo: ${OPERATOR_PIN})<input name="pin" type="password" inputmode="numeric" autocomplete="off"></label><div id="pinerr" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn pri">Sign</button><button type="button" class="btn ghost" data-act="closemodal">Cancel</button></div></form>`);
}
function ruleModal(i) {
  const r = i >= 0 ? S.spec.draft[i] : { id: 'R' + (Math.max(0, ...S.spec.draft.map(x => parseInt(x.id.slice(1), 10) || 0)) + 1), act: 'allow', kind: 'read', res: '', who: '*', text: '' };
  const w = r.when || {}; UI.editIdx = i;
  const sel = (n, opts, v) => `<select name="${n}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  openModal(`<h2>${i >= 0 ? 'Edit' : 'Add'} rule ${esc(r.id)}</h2><form data-form="rule" class="col">
    <input type="hidden" name="id" value="${esc(r.id)}"><div class="grid g2"><label class="field">Decision${sel('act', ['allow', 'deny', 'hold'], r.act)}</label><label class="field">Kind${sel('kind', ['read', 'model', 'tool', 'effect', '*'], r.kind)}</label></div>
    <label class="field">Resource (comma list, * glob) — e.g. payments.refund, notify.*<input name="res" value="${esc(r.res)}" required></label>
    <label class="field">Applies to — *, native, customer, guest, ring0, ring1 or an agent id<input name="who" value="${esc(r.who)}" required></label>
    <div class="grid g3"><label class="field">When field<input name="wf" value="${esc(w.f || '')}" placeholder="amount"></label><label class="field">Op${sel('wop', ['>', '>=', '<', '<=', '==', '!=', 'has'], w.op || '>')}</label><label class="field">Value<input name="wv" value="${esc(w.v === undefined ? '' : w.v)}"></label></div>
    <label class="field">Plain-language meaning<textarea name="text" required>${esc(r.text)}</textarea></label>
    <div class="row"><button class="btn pri">Save to draft</button><button type="button" class="btn ghost" data-act="closemodal">Cancel</button></div></form>`);
}
function evModal(seq) {
  const e = S.log.find(x => x.seq === +seq); if (!e) return;
  openModal(`<div class="row between"><h2>Event #${e.seq}</h2>${decChip(e.dec)}</div><p>${esc(e.summary)}</p><pre>${esc(JSON.stringify(e, null, 1))}</pre><div class="row">${e.run ? `<a class="btn" href="#/run/${e.run}" data-act="closemodal">Open ${esc(e.run)}</a>` : ''}<button class="btn ghost" data-act="closemodal">Close</button></div>`);
}

/* ---------- actions ---------- */
function commit(msg) { save(); render(); if (msg) toast(msg); }
const ACT = {
  more() { UI.more = true; render(); }, closemore() { UI.more = false; render(); },
  go(d) { location.hash = d.href; },
  openev(d) { evModal(d.seq); },
  modalbg(d, el, ev) { if (ev.target === el) closeModal(); }, closemodal() { closeModal(); },
  run(d) { syncClock(); const sc = SCENARIOS[d.sc]; const p = {}; if (sc.param) p[sc.param] = $('#p-' + d.sc).value; const r = startRun(d.sc, p); save(); location.hash = '#/run/' + r.id; render(); toast(`${r.id}: ${r.status === 'awaiting' ? 'held for approval' : r.status}`); },
  suspend(d) { syncClock(); const a = agentById(d.id); a.status = a.status === 'suspended' ? 'active' : 'suspended'; logEvent({ agent: 'operator', kind: 'agent.' + (a.status === 'suspended' ? 'suspend' : 'resume'), res: a.id, dec: 'system', summary: `${S.operator} ${a.status === 'suspended' ? 'suspended' : 'resumed'} ${a.name}` }); commit(a.name + ' ' + a.status); },
  budget(d) { const a = agentById(d.id); openModal(`<h2>Budget · ${esc(a.name)}</h2><form data-form="budget" class="col"><input type="hidden" name="id" value="${a.id}"><label class="field">Monthly model budget (USD)<input name="b" type="number" min="0" step="1" value="${a.budget}"></label><div class="row"><button class="btn pri">Save</button><button type="button" class="btn ghost" data-act="closemodal">Cancel</button></div></form>`); },
  procfs(d) { UI.shell.push({ c: `cat /agents/${d.id}/status`, t: '' }); UI.shell.pop(); shellExec(`cat /agents/${d.id}/status`); },
  selstep(d) { UI.sel[d.run] = +d.i; render(); },
  approve(d) { const r = S.runs.find(x => x.id === d.id); pinModal('Approve held step', `Sign to release ${r.id}'s held side effect. This approval is recorded and the run resumes by deterministic replay.`, by => { syncClock(); approveHold(r, by); commit(`${r.id} approved → ${r.status}`); }); },
  reject(d) { const r = S.runs.find(x => x.id === d.id); pinModal('Reject held step', 'The run is cancelled and the rejection is recorded.', by => { syncClock(); rejectHold(r, by); commit(`${r.id} cancelled`); }); },
  replay(d) { const r = S.runs.find(x => x.id === d.id); UI.replay[d.id] = replay(r); render(); },
  whatif(d) { const r = S.runs.find(x => x.id === d.id); const rp = replay(r, { spec: d.spec ? +d.spec : undefined, model: d.model }); rp.whatif = true; UI.replay[d.id] = rp; render(); },
  spectab(d) { UI.specTab = d.t; render(); },
  newdraft() { if (!S.spec.draft) S.spec.draft = clone(currentSpec().rules); UI.specTab = 'draft'; commit(); },
  discard() { S.spec.draft = null; UI.specTab = 'effective'; commit('Draft discarded'); },
  addrule() { ruleModal(-1); }, editrule(d) { ruleModal(+d.i); },
  delrule(d) { S.spec.draft.splice(+d.i, 1); commit(); },
  mvrule(d) { const i = +d.i, j = i + +d.d; const a = S.spec.draft; [a[i], a[j]] = [a[j], a[i]]; commit(); },
  signspec() {
    if (canon(S.spec.draft) === canon(currentSpec().rules)) { toast('Draft is identical to the effective spec'); return; }
    UI.onPin = null; openModal(`<h2>Sign off spec v${currentSpec().v + 1}</h2><form data-form="signspec" class="col"><label class="field">Change note<input name="note" required placeholder="Why this changed"></label><label class="field">Signer<input name="by" value="${esc(S.operator)}"></label><label class="field">PIN (demo: ${OPERATOR_PIN})<input name="pin" type="password" inputmode="numeric"></label><div id="pinerr" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn pri">Sign & make effective</button><button type="button" class="btn ghost" data-act="closemodal">Cancel</button></div></form>`);
  },
  admit() { syncClock(); const g = S.agents.find(a => a.kind === 'guest'); const v = openVisit(g.id, 'Q4 capacity plan — follow-up'); commit(`${v.id}: ${g.name} admitted`); },
  curate(d) { syncClock(); const v = S.visits.find(x => x.id === d.v); curate(v, d.f, d.a, S.operator); commit(); },
  closevisit(d) { syncClock(); const v = S.visits.find(x => x.id === d.v); if (closeVisit(v, S.operator)) commit(`${v.id} closed; agent memory purged`); },
  verify() { UI.verify = verifyChain(); render(); },
  tamper() { const e = tamper(); UI.verify = null; save(); render(); toast(`Event #${e.seq} silently edited. Now verify.`); },
  untamper() { untamper(); UI.verify = verifyChain(); commit('Record restored from the replicated copy'); },
  sh(d) { shellExec(d.c); render(); },
  reset() { if (!UI.confirmReset) { UI.confirmReset = true; render(); setTimeout(() => { UI.confirmReset = false; if (route().name === 'settings') render(); }, 4000); return; } UI.confirmReset = false; resetWorkspace(); UI.replay = {}; UI.verify = null; UI.shell = []; commit('Demo reset'); },
  install() { if (window.__bip) { window.__bip.prompt(); window.__bip = null; } },
};
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]'); if (!el) { if (UI.more && !ev.target.closest('.sheet')) { UI.more = false; render(); } return; }
  const a = el.dataset.act; if (a === 'import' || (a === 'modalbg' && ev.target !== el)) return;
  if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').startsWith('#')) { if (a === 'closemore') UI.more = false; if (a === 'closemodal') UI.modal = ''; if (a === 'procfs') ACT.procfs(el.dataset); return; }
  ev.preventDefault(); if (ACT[a]) ACT[a](el.dataset, el, ev);
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.filter) { UI.recFilter[t.dataset.filter] = t.value; render(); }
  if (t.dataset.aud) { if (t.dataset.aud === 'agent') UI.auditAgent = t.value; else UI.auditPeriod = t.value; render(); }
  if (t.dataset.set) { if (t.dataset.set === 'model' && t.value !== S.model) { syncClock(); logEvent({ agent: 'os', kind: 'model.switch', res: t.value, dec: 'system', summary: `Default model changed ${S.model} → ${t.value} by ${S.operator}` }); } S[t.dataset.set] = t.value; commit(t.dataset.set === 'model' ? 'New runs use ' + t.value : 'Saved'); }
  if (t.dataset.act === 'import' && t.files[0]) { t.files[0].text().then(txt => { try { const o = JSON.parse(txt); if (!o.log || !o.spec) throw 0; S = o; upgrade(); commit('Workspace imported'); } catch (e) { toast('Not a WunderOS workspace file'); } }); }
});
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset.filter === 'q') { UI.recFilter.q = t.value; clearTimeout(UI._qt); UI._qt = setTimeout(() => { render(); const i = document.querySelector('[data-filter=q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); } });
document.addEventListener('submit', ev => {
  const f = ev.target; const k = f.dataset.form; if (!k) return; ev.preventDefault(); const v = Object.fromEntries(new FormData(f));
  if (k === 'shell') { shellExec(v.cmd === undefined ? $('#shellin').value : v.cmd); render(); const i = $('#shellin'); if (i) i.focus(); return; }
  if (k === 'pin' || k === 'signspec') {
    if (v.pin !== OPERATOR_PIN) { $('#pinerr').textContent = 'Wrong PIN — signature refused.'; return; }
    const by = (v.by || S.operator).trim(); UI.modal = '';
    if (k === 'pin') UI.onPin(by); else { syncClock(); const sv = signSpec(S.spec.draft, by, v.note.trim()); S.spec.draft = null; UI.specTab = 'effective'; commit(`Spec v${sv.v} is now effective`); }
    return;
  }
  if (k === 'rule') {
    const r = { id: v.id, act: v.act, kind: v.kind, res: v.res.trim(), who: v.who.trim(), text: v.text.trim() };
    if (v.wf.trim()) r.when = { f: v.wf.trim(), op: v.wop, v: isNaN(+v.wv) || v.wv === '' ? v.wv : +v.wv };
    if (UI.editIdx >= 0) S.spec.draft[UI.editIdx] = r; else S.spec.draft.push(r);
    UI.modal = ''; commit('Draft updated'); return;
  }
  if (k === 'budget') { const a = agentById(v.id); a.budget = Math.max(0, +v.b || 0); syncClock(); logEvent({ agent: 'operator', kind: 'agent.budget', res: a.id, dec: 'system', summary: `${S.operator} set ${a.name} budget to $${a.budget}/month` }); UI.modal = ''; commit('Budget saved'); }
});
window.addEventListener('hashchange', () => { UI.more = false; UI.modal = ''; render(); window.scrollTo(0, 0); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__bip = e; });

load(); render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
