const DEAL = 'Harborview Tower';

const STEPS = [
  { id: 0, eyebrow: 'NPL workflow lab', title: 'Walk through one workout package', nav: 'Start' },
  { id: 1, eyebrow: 'Step 1 — Ingest', title: 'Import the workout package', nav: 'Ingest' },
  { id: 2, eyebrow: 'Step 2 — Extract', title: 'Run the extraction pipeline', nav: 'Extract' },
  { id: 3, eyebrow: 'Step 3 — Review', title: 'Human-in-the-loop validation', nav: 'Review' },
  { id: 4, eyebrow: 'Step 4 — Insights', title: 'Structured data for decisions', nav: 'Insights' },
  { id: 5, eyebrow: 'Step 5 — Deliver', title: 'Data where work happens', nav: 'Deliver' },
];

const PERSONAS = {
  npl: {
    quote: '"I have 40 loans in special servicing. I can\'t spend half a day per file pulling DSCR and NOI out of servicer PDFs."',
    pain: 'Workout package intake — 3+ hours per loan.',
    ingest: 'Box / SharePoint: servicer drops workout package, you pull loan + collateral fields in one pass.',
    insights: 'UPB, DSCR, LTV, NOI, occupancy — covenant breaches flagged before you open Excel.',
    deliver: 'Workout Excel template pull. That\'s where modification decisions get made.',
    excelHint: 'Pull UPB, DSCR, LTV, NOI, occupancy into your NPL workout model.',
  },
  analyst: {
    quote: '"Distressed acquisition — I need the loan file and collateral in one structured view."',
    pain: 'NPL-to-acquisition: reuse loan data, add OM overlay.',
    ingest: 'Same cloud connector — workout package already structured from special servicing handoff.',
    insights: 'Recovery analysis inputs without re-keying servicer report.',
    deliver: 'Excel pull into distressed asset underwriting template.',
    excelHint: 'Loan + collateral fields land in your acquisition model.',
  },
  lender: {
    quote: '"Portfolio review is due Friday. I need 200 loans structured, not 200 PDF folders."',
    pain: 'Batch NPL portfolio — throughput, not one-offs.',
    ingest: 'Watched folder per portfolio segment — new servicer report auto-queues.',
    insights: 'Portfolio-level DSCR and LTV distribution from extracted corpus.',
    deliver: 'API into LOS + batch Excel export for credit committee.',
    excelHint: 'Batch pull across loans into portfolio workout summary.',
  },
  broker: {
    quote: '"Every OM has the same data in a different format. I need comps without the scavenger hunt."',
    pain: 'Needs fast OM summaries for buyer outreach and IC prep.',
    ingest: 'Broker drops OM in shared Dropbox folder — marketing never touches your upload UI.',
    insights: 'Property summary and unit mix — what buyers ask for in the first call.',
    deliver: 'Word merge for IC memos and buyer-facing summaries.',
    excelHint: 'Export to comp sheets and buyer comparison models.',
  },
  developer: {
    quote: '"We don\'t need another UI. We need a schema-stable API we can pipe into our warehouse."',
    pain: 'Needs programmatic access with confidence metadata.',
    ingest: 'Box enterprise connector + API ingest. Cloud OAuth at org level, not per-analyst setup.',
    insights: 'Schema-normalized JSON — property_id, financials, rent_roll arrays.',
    deliver: 'REST API first. Browser is for QA and exception handling.',
    excelHint: 'Partners embed via API; Excel add-in is end-user distribution.',
  },
};

const PIPELINE_STAGES = [
  { icon: '📥', name: 'Ingest', desc: 'Parse PDF, OCR scans' },
  { icon: '🏷️', name: 'Classify', desc: 'Detect document type' },
  { icon: '🔍', name: 'OCR', desc: 'Text & table recognition' },
  { icon: '🧠', name: 'Extract', desc: 'Field-level NLP' },
  { icon: '⚙️', name: 'Normalize', desc: 'CRE schema mapping' },
  { icon: '✓', name: 'Validate', desc: 'Confidence scoring' },
];

const EXTRACTED_FIELDS = [
  { key: 'property_name', label: 'Collateral Property', value: 'Harborview Tower', confidence: 98 },
  { key: 'loan_id', label: 'Loan ID', value: 'LN-2018-39201', confidence: 99 },
  { key: 'upb', label: 'Unpaid Principal Balance', value: '$38,200,000', confidence: 97 },
  { key: 'dscr', label: 'DSCR (TTM)', value: '0.78', confidence: 86 },
  { key: 'ltv', label: 'LTV (As-Is)', value: '118%', confidence: 84 },
  { key: 'noi', label: 'Collateral NOI (TTM)', value: '$2,104,000', confidence: 92 },
  { key: 'occupancy', label: 'Occupancy', value: '78.4%', confidence: 94 },
  { key: 'delinquency', label: 'Days Delinquent', value: '127', confidence: 99 },
  { key: 'collateral_value', label: 'As-Is Appraised Value', value: '$34,100,000', confidence: 91 },
  { key: 'workout_status', label: 'Workout Status', value: 'Modification under review', confidence: 95 },
];

const RENT_ROLL = [
  { unit: '101', type: '1 BR', sf: 720, tenant: 'James Mitchell', start: '03/01/2023', end: '02/28/2024', rent: '$1,650', status: 'Delinquent' },
  { unit: '204', type: '1 BR', sf: 720, tenant: 'Vacant', start: '—', end: '—', rent: '$1,795', status: 'Vacant' },
  { unit: '305', type: 'Studio', sf: 520, tenant: 'Vacant', start: '—', end: '—', rent: '$1,350', status: 'Vacant' },
  { unit: '412', type: '2 BR', sf: 1050, tenant: 'Marcus Williams', start: '09/01/2022', end: '08/31/2023', rent: '$2,100', status: 'Occupied' },
  { unit: '508', type: '3 BR', sf: 1280, tenant: 'Eviction pending', start: '—', end: '—', rent: '$0', status: 'Non-performing' },
  { unit: '601', type: '2 BR', sf: 1050, tenant: 'Sarah Chen', start: '06/15/2023', end: '06/14/2024', rent: '$2,200', status: 'Occupied' },
];

const NOI_BREAKDOWN = [
  { label: 'Gross Potential Rent', value: 4210000 },
  { label: 'Vacancy & Concessions', value: -892000 },
  { label: 'Bad Debt / Non-performing', value: -318000 },
  { label: 'Operating Expenses', value: -1898000 },
  { label: 'Net Operating Income', value: 2104000 },
];

const UNIT_MIX = [
  { type: 'Studio', count: 32, color: '#00c9a7' },
  { type: '1 BR', count: 112, color: '#3b82f6' },
  { type: '2 BR', count: 88, color: '#6366f1' },
  { type: '3 BR', count: 16, color: '#a855f7' },
];

const CLOUD_PROVIDERS = {
  box: { name: 'Box', folder: '/NPL Portfolio/Harborview Tower/Workout Package' },
  m365: { name: 'SharePoint', folder: '/Special Servicing/LN-2018-39201' },
  google: { name: 'Google Drive', folder: '/Asset Resolution/Harborview Tower' },
  dropbox: { name: 'Dropbox', folder: '/Servicer Reports/Q4 Workout Files' },
};

let currentStep = 0;
let maxReached = 0;
let uploaded = false;
let uploadSource = null;
let connectedProvider = null;
let pipelineRunning = false;
let approvedFields = new Set();
let currentPersona = 'npl';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function confLevel(score) {
  if (score >= 95) return 'high';
  if (score >= 90) return 'med';
  return 'low';
}

function fmtMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function getPersona() {
  return PERSONAS[currentPersona] || PERSONAS.analyst;
}

function applyPersona() {
  const p = getPersona();
  const quote = $('#voiceQuote');
  if (quote) quote.textContent = p.quote;
  const pain = $('#personaPain');
  if (pain) pain.textContent = p.pain;
  const ingest = $('#ingestContext');
  if (ingest) ingest.textContent = p.ingest;
  const insights = $('#insightsContext');
  if (insights) insights.textContent = p.insights;
  const deliver = $('#deliverLead');
  if (deliver) deliver.textContent = p.deliver;
  const excelHint = $('#excelSidebarHint');
  if (excelHint) excelHint.textContent = p.excelHint;
}

function buildStructuredOutput() {
  const data = {};
  EXTRACTED_FIELDS.forEach((f) => { data[f.key] = f.value; });
  return {
    document_id: 'doc_8f3a2c91',
    property_id: 'prop_riverside_commons',
    extracted_at: new Date().toISOString(),
    document_type: 'npl_workout_package',
    loan_status: 'non_performing',
    confidence_score: 0.91,
    fields: data,
    loan: {
      loan_id: 'LN-2018-39201',
      upb: 38200000,
      dscr: 0.78,
      ltv: 1.18,
      days_delinquent: 127,
      workout_status: 'modification_under_review',
    },
    rent_roll: RENT_ROLL.map(({ unit, type, sf, tenant, start, end, rent, status }) => ({
      unit, type, sqft: sf, tenant, lease_start: start, lease_end: end, monthly_rent: rent, status,
    })),
    collateral: {
      property_name: 'Harborview Tower',
      net_operating_income: 2104000,
      as_is_value: 34100000,
      occupancy: 0.784,
    },
  };
}

function renderStepNav() {
  const nav = $('#stepNav');
  nav.innerHTML = STEPS.map((s) => `
    <button type="button" class="step-btn${s.id === currentStep ? ' active' : ''}${s.id < currentStep || (s.id <= maxReached && s.id !== currentStep) ? ' done' : ''}"
      data-step="${s.id}" ${s.id > maxReached ? 'disabled' : ''}>
      <span class="step-num">${s.id === 0 ? '◆' : s.id}</span>
      <span>${s.nav}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.step-btn').forEach((btn) => {
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.step)));
  });
}

function updateTopbar() {
  const step = STEPS[currentStep];
  $('#stepEyebrow').textContent = step.eyebrow;
  $('#stepTitle').textContent = step.title;

  const nextBtn = $('#nextBtn');
  const dock = $('.action-dock');
  if (currentStep === 5) {
    if (dock) dock.hidden = true;
    return;
  }
  if (dock) dock.hidden = false;

  if (currentStep === 0) {
    nextBtn.textContent = 'Start walkthrough →';
    nextBtn.disabled = false;
  } else if (currentStep === 1 && !uploaded) {
    nextBtn.textContent = 'Connect or load package first';
    nextBtn.disabled = true;
  } else if (currentStep === 2) {
    nextBtn.textContent = pipelineRunning ? 'Processing…' : 'Continue to review →';
    nextBtn.disabled = pipelineRunning;
  } else {
    nextBtn.textContent = 'Continue →';
    nextBtn.disabled = false;
  }
}

function showPanel(step) {
  $$('.panel').forEach((p) => p.classList.toggle('active', Number(p.dataset.step) === step));
}

function goToStep(step, { force = false } = {}) {
  if (!force && step > maxReached) return;
  currentStep = step;
  showPanel(step);
  renderStepNav();
  updateTopbar();
  applyPersona();

  if (step === 2 && uploaded && !pipelineRunning && !$('#progressFill').style.width) {
    runPipeline();
  }
  if (step === 3) renderFields();
  if (step === 4) renderInsights();
  if (step === 5) renderDeliver();
}

function nextStep() {
  if (currentStep === 0) {
    maxReached = Math.max(maxReached, 1);
    goToStep(1, { force: true });
    return;
  }
  if (currentStep === 1 && !uploaded) return;
  if (currentStep === 2 && pipelineRunning) return;
  if (currentStep < 5) {
    maxReached = Math.max(maxReached, currentStep + 1);
    goToStep(currentStep + 1, { force: true });
  }
}

function resetDemo() {
  currentStep = 0;
  maxReached = 0;
  uploaded = false;
  uploadSource = null;
  connectedProvider = null;
  pipelineRunning = false;
  approvedFields.clear();
  $('#queueList').innerHTML = '<li class="queue-empty">No documents queued</li>';
  $('#cloudStatus').hidden = true;
  const wp = $('#watchedFolderPath');
  if (wp) wp.hidden = true;
  $$('.cloud-btn').forEach((b) => b.classList.remove('connected'));
  $('#progressFill').style.width = '0%';
  $('#progressPct').textContent = '0%';
  $('#processingLog').innerHTML = '';
  $$('.stage-card').forEach((c) => c.classList.remove('running', 'done'));
  goToStep(0, { force: true });
}

function initPipelineStages() {
  const container = $('#pipelineStages');
  container.innerHTML = PIPELINE_STAGES.map((s) => `
    <div class="stage-card" data-stage="${s.name}">
      <div class="stage-icon">${s.icon}</div>
      <h4>${s.name}</h4>
      <p>${s.desc}</p>
    </div>
  `).join('');
}

function addLog(msg) {
  const log = $('#processingLog');
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  log.appendChild(li);
  log.scrollTop = log.scrollHeight;
}

function runPipeline() {
  if (pipelineRunning) return;
  pipelineRunning = true;
  updateTopbar();

  $('#pipelineDocName').textContent = 'Harborview Tower — Special Servicer Report.pdf';
  const stages = $$('.stage-card');
  const sourceLabel = uploadSource || 'manual upload';
  const logs = [
    `Document received via ${sourceLabel} — 48 pages, 12.4 MB`,
    'Classified as Special Servicer Report / NPL workout (confidence 0.96)',
    'OCR complete — 14 tables detected',
    'Extracting loan fields: UPB, DSCR, LTV, delinquency…',
    'Normalizing to NPL workout schema v1.0',
    'Validation complete — 94% aggregate confidence',
  ];

  let stageIdx = 0;

  const tick = () => {
    if (stageIdx < stages.length) {
      stages.forEach((s, i) => {
        s.classList.remove('running');
        if (i < stageIdx) s.classList.add('done');
      });
      stages[stageIdx].classList.add('running');
      addLog(logs[stageIdx] || `Stage ${stageIdx + 1} complete`);
      stageIdx++;
      const progress = Math.round((stageIdx / stages.length) * 100);
      $('#progressFill').style.width = `${progress}%`;
      $('#progressPct').textContent = `${progress}%`;
      setTimeout(tick, 900);
    } else {
      stages.forEach((s) => { s.classList.remove('running'); s.classList.add('done'); });
      $('#progressFill').style.width = '100%';
      $('#progressPct').textContent = '100%';
      addLog('Extraction ready for human review');
      pipelineRunning = false;
      maxReached = Math.max(maxReached, 3);
      updateTopbar();
    }
  };

  tick();
}

function queuePackage(sourceLabel) {
  uploaded = true;
  uploadSource = sourceLabel;
  const prefix = connectedProvider ? '☁️' : '📄';
  $('#queueList').innerHTML = `
    <li>
      <span>${prefix} Harborview Tower — Special Servicer Report.pdf</span>
      <span class="queue-status">Ready · ${sourceLabel}</span>
    </li>
    <li>
      <span>${prefix} Harborview Tower — Rent Roll &amp; T-12.xlsx</span>
      <span class="queue-status">Ready · ${sourceLabel}</span>
    </li>
  `;
  maxReached = Math.max(maxReached, 2);
  updateTopbar();
}

function simulateUpload() {
  connectedProvider = null;
  $('#cloudStatus').hidden = true;
  const wp = $('#watchedFolderPath');
  if (wp) wp.hidden = true;
  $$('.cloud-btn').forEach((b) => b.classList.remove('connected'));
  queuePackage('manual upload');
}

function connectCloud(provider) {
  const info = CLOUD_PROVIDERS[provider];
  if (!info) return;

  connectedProvider = provider;
  $$('.cloud-btn').forEach((b) => {
    b.classList.toggle('connected', b.dataset.provider === provider);
  });

  const status = $('#cloudStatus');
  status.hidden = false;
  $('#cloudStatusText').textContent = `Connected to ${info.name} — importing from ${info.folder}`;

  const watchedPath = $('#watchedFolderPath');
  if (provider === 'dropbox' || provider === 'box' || provider === 'm365') {
    watchedPath.hidden = false;
    watchedPath.textContent = `Watched folder (Phase 2): ${info.folder}`;
  } else {
    watchedPath.hidden = true;
  }

  setTimeout(() => queuePackage(info.name), 600);
}

function initCloudConnectors() {
  $$('.cloud-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('cloud-btn-disabled')) return;
      connectCloud(btn.dataset.provider);
    });
  });
}

function renderFields() {
  const list = $('#fieldsList');
  list.innerHTML = EXTRACTED_FIELDS.map((f) => {
    const level = confLevel(f.confidence);
    const approved = approvedFields.has(f.key);
    return `
      <div class="field-row${approved ? ' approved' : ''}" data-field="${f.key}">
        <div>
          <div class="field-label">${f.label}</div>
          <input class="field-value" value="${f.value}" data-key="${f.key}">
        </div>
        <span class="conf-pill ${level}">${f.confidence}%</span>
      </div>
    `;
  }).join('');

  const high = EXTRACTED_FIELDS.filter((f) => confLevel(f.confidence) === 'high').length;
  const med = EXTRACTED_FIELDS.filter((f) => confLevel(f.confidence) === 'med').length;
  const low = EXTRACTED_FIELDS.filter((f) => confLevel(f.confidence) === 'low').length;

  $('#confidenceSummary').innerHTML = `
    <div class="conf-badge"><span class="conf-dot high"></span>${high} high confidence</div>
    <div class="conf-badge"><span class="conf-dot med"></span>${med} medium</div>
    <div class="conf-badge"><span class="conf-dot low"></span>${low} needs review</div>
  `;

  list.querySelectorAll('.field-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      highlightField(row.dataset.field);
    });
    row.querySelector('input').addEventListener('focus', () => highlightField(row.dataset.field));
  });
}

function highlightField(key) {
  $$('.field-row').forEach((r) => r.classList.toggle('active', r.dataset.field === key));
  $$('.doc-line, .doc-table tr').forEach((el) => {
    el.classList.remove('highlight');
    if (el.dataset.field === key) {
      el.classList.add('highlight');
      if (el.tagName === 'TR') {
        el.querySelectorAll('td').forEach((td) => { td.style.background = 'rgba(0, 201, 167, 0.35)'; });
      }
    } else if (el.tagName === 'TR') {
      el.querySelectorAll('td').forEach((td) => { td.style.background = ''; });
    }
  });
  const line = $(`.doc-line[data-field="${key}"]`);
  if (line) line.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function approveAllFields() {
  EXTRACTED_FIELDS.forEach((f) => approvedFields.add(f.key));
  renderFields();
  maxReached = Math.max(maxReached, 4);
}

function renderInsights() {
  $('#insightsKpis').innerHTML = `
    <div class="kpi-card"><div class="label">UPB</div><div class="value">$38.2M</div><div class="sub">LN-2018-39201</div></div>
    <div class="kpi-card"><div class="label">DSCR</div><div class="value">0.78</div><div class="sub danger">Covenant breach</div></div>
    <div class="kpi-card"><div class="label">LTV (As-Is)</div><div class="value">118%</div><div class="sub">Underwater collateral</div></div>
    <div class="kpi-card"><div class="label">Time saved</div><div class="value">~2.5 hr</div><div class="sub">vs. manual NPL intake</div></div>
  `;

  const maxVal = NOI_BREAKDOWN[0].value;
  $('#noiChart').innerHTML = NOI_BREAKDOWN.map((item) => `
    <div class="bar-row">
      <span>${item.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.abs(item.value) / maxVal * 100}%"></div></div>
      <span>${fmtMoney(item.value)}</span>
    </div>
  `).join('');

  $('#unitLegend').innerHTML = UNIT_MIX.map((u) => `
    <li><span class="legend-swatch" style="background:${u.color}"></span>${u.type} — ${u.count} units</li>
  `).join('');

  const statusClass = { Occupied: '', Vacant: 'warn', Delinquent: 'warn', 'Non-performing': 'danger' };
  $('#rentRollBody').innerHTML = RENT_ROLL.map((r) => `
    <tr>
      <td>${r.unit}</td><td>${r.type}</td><td>${r.sf}</td><td>${r.tenant}</td>
      <td>${r.start}</td><td>${r.end}</td><td>${r.rent}</td>
      <td><span class="status-pill ${statusClass[r.status] || ''}">${r.status}</span></td>
    </tr>
  `).join('');
}

function renderDeliver() {
  $('#jsonPreview').textContent = JSON.stringify(buildStructuredOutput(), null, 2);
  initExcelGrid();
}

function initExcelGrid() {
  const grid = $('#excelGrid');
  const cols = ['', 'A', 'B', 'C', 'D', 'E'];
  let html = cols.map((c) => `<div class="excel-cell header">${c}</div>`).join('');
  const rows = [
    ['1', 'Field', 'Value', 'Source', 'Confidence', ''],
    ['2', 'UPB', '', 'Servicer p.4', '', ''],
    ['3', 'DSCR', '', 'Servicer p.8', '', ''],
    ['4', 'LTV', '', 'Appraisal p.2', '', ''],
    ['5', 'NOI / Occ', '', 'T-12 p.1', '', ''],
  ];
  rows.forEach((row) => {
    row.forEach((cell, i) => {
      const cls = i === 0 ? 'header' : i === 1 ? 'label' : '';
      html += `<div class="excel-cell ${cls}" data-row="${row[0]}" data-col="${i}">${cell}</div>`;
    });
  });
  grid.innerHTML = html;
}

function pullExcelData() {
  const mapping = [
    { row: '2', value: '$38,200,000', conf: '97%' },
    { row: '3', value: '0.78', conf: '86%' },
    { row: '4', value: '118%', conf: '84%' },
    { row: '5', value: '$2,104,000 / 78.4%', conf: '92%' },
  ];
  mapping.forEach((m) => {
    const valCell = $(`.excel-cell[data-row="${m.row}"][data-col="2"]`);
    const confCell = $(`.excel-cell[data-row="${m.row}"][data-col="4"]`);
    if (valCell) { valCell.textContent = m.value; valCell.classList.add('filled'); }
    if (confCell) { confCell.textContent = m.conf; confCell.classList.add('filled'); }
  });
  $('#excelFields').innerHTML = EXTRACTED_FIELDS.slice(0, 5).map((f) =>
    `<li>✓ ${f.label}: ${f.value}</li>`
  ).join('');
}

function mergeWordFields() {
  const data = Object.fromEntries(EXTRACTED_FIELDS.map((f) => [f.key, f.value]));
  $$('.merge-field').forEach((el) => {
    const key = el.dataset.merge;
    if (data[key]) {
      el.textContent = data[key];
      el.classList.add('filled');
    }
  });
}

function executeApiCall() {
  $('#apiResponse').textContent = JSON.stringify({
    status: 200,
    data: buildStructuredOutput(),
    meta: { request_id: 'req_' + Math.random().toString(36).slice(2, 10), latency_ms: 142 },
  }, null, 2);
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(buildStructuredOutput(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'harborview-tower-npl-extraction.json';
  a.click();
  showToast('JSON exported');
}

function downloadCsv() {
  const header = 'unit,type,sf,tenant,lease_start,lease_end,monthly_rent,status';
  const rows = RENT_ROLL.map((r) => [r.unit, r.type, r.sf, r.tenant, r.start, r.end, r.rent, r.status].join(','));
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'harborview-tower-rent-roll.csv';
  a.click();
  showToast('Rent roll CSV downloaded');
}

function showToast(msg) {
  const toast = $('#browserToast');
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 3000);
}

function initDeliverTabs() {
  $$('.deliver-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.deliver-tab').forEach((t) => t.classList.remove('active'));
      $$('.deliver-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`.deliver-panel[data-tab-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });
}

function initUploadZone() {
  const zone = $('#uploadZone');
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); simulateUpload(); });
  $('#simulateUploadBtn').addEventListener('click', simulateUpload);
}

function initTypeSelector() {
  $$('.type-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      $$('.type-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    });
  });
}

function initPersona() {
  $('#personaSelect').addEventListener('change', (e) => {
    currentPersona = e.target.value;
    applyPersona();
  });
}

function init() {
  renderStepNav();
  updateTopbar();
  initPipelineStages();
  initDeliverTabs();
  initUploadZone();
  initCloudConnectors();
  initTypeSelector();
  initPersona();
  applyPersona();

  $('#nextBtn').addEventListener('click', nextStep);
  $('#resetBtn').addEventListener('click', resetDemo);
  $('#restartBtn').addEventListener('click', resetDemo);
  $('#approveAllBtn').addEventListener('click', approveAllFields);
  $('#flagLowConfBtn').addEventListener('click', () => highlightField('dscr'));
  $('#exportTableBtn').addEventListener('click', downloadCsv);
  $('#dlJsonBtn').addEventListener('click', downloadJson);
  $('#dlCsvBtn').addEventListener('click', downloadCsv);
  $('#pushDashBtn').addEventListener('click', () => showToast('Pushed to analytics dashboard'));
  $('#excelPullBtn').addEventListener('click', pullExcelData);
  $('#wordMergeBtn').addEventListener('click', mergeWordFields);
  $('#apiCallBtn').addEventListener('click', executeApiCall);
}

document.addEventListener('DOMContentLoaded', init);