import {
  OFFER_TYPES, STATUS, ISSUERS, defaultState, defaultProfile,
  evaluateOffer, suggestTimeline, seedOffers,
} from './rules.js';

const STORAGE_KEY = 'promo_tracker_v1';

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed, profile: { ...defaultProfile(), ...parsed.profile } };
    }
  } catch { /* noop */ }
  return defaultState();
}

function save() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return [...document.querySelectorAll(sel)]; }

function fmtMoney(n) {
  return Number.isFinite(n) ? `$${n.toLocaleString()}` : '—';
}

function renderProfile() {
  const p = state.profile;
  $('#scoreBand').value = p.scoreBand;
  $('#cardsOpen').value = p.cardsOpen;
  $('#cards24mo').value = p.cards24mo;
  $('#aaoaYears').value = p.aaoaYears;
  $('#utilizationPct').value = p.utilizationPct;
  $('#inquiries6mo').value = p.inquiries6mo;
  $('#inquiries12mo').value = p.inquiries12mo;
  $('#inquiries24mo').value = p.inquiries24mo;
  $('#lastHardPull').value = p.lastHardPull || '';
  $('#profileNotes').value = p.notes || '';

  const chase = p.cards24mo;
  $('#gate524').textContent = chase >= 5 ? 'Blocked' : chase >= 4 ? 'Caution' : 'Clear';
  $('#gate524').className = `gate-pill gate-pill--${chase >= 5 ? 'blocked' : chase >= 4 ? 'caution' : 'clear'}`;
  $('#gateInq').textContent = p.inquiries6mo >= 3 ? 'Caution' : 'Clear';
  $('#gateInq').className = `gate-pill gate-pill--${p.inquiries6mo >= 3 ? 'caution' : 'clear'}`;
}

function readProfile() {
  state.profile = {
    scoreBand: $('#scoreBand').value,
    cardsOpen: Number($('#cardsOpen').value) || 0,
    cards24mo: Number($('#cards24mo').value) || 0,
    aaoaYears: Number($('#aaoaYears').value) || 0,
    utilizationPct: Number($('#utilizationPct').value) || 0,
    inquiries6mo: Number($('#inquiries6mo').value) || 0,
    inquiries12mo: Number($('#inquiries12mo').value) || 0,
    inquiries24mo: Number($('#inquiries24mo').value) || 0,
    lastHardPull: $('#lastHardPull').value,
    notes: $('#profileNotes').value.trim(),
  };
  save();
  renderAll();
}

function renderStats() {
  const active = state.offers.filter((o) => o.status === 'active').length;
  const planned = state.offers.filter((o) => ['idea', 'planned', 'ready'].includes(o.status)).length;
  const doneVal = state.offers
    .filter((o) => o.status === 'done')
    .reduce((s, o) => s + (o.valueUsd || 0), 0);
  const pipeVal = state.offers
    .filter((o) => !['done', 'skip'].includes(o.status))
    .reduce((s, o) => s + (o.valueUsd || 0), 0);

  $('#statActive').textContent = String(active);
  $('#statPlanned').textContent = String(planned);
  $('#statDoneVal').textContent = fmtMoney(doneVal);
  $('#statPipeVal').textContent = fmtMoney(pipeVal);
}

function offerCard(o) {
  const meta = OFFER_TYPES[o.type] || OFFER_TYPES.cc;
  const st = STATUS[o.status] || STATUS.idea;
  const ev = evaluateOffer(o, state.profile, state.offers);
  const badge = ev.score === 'blocked' ? 'blocked' : ev.score === 'caution' ? 'caution' : 'clear';

  return `
    <article class="offer-card offer-card--${badge}" data-id="${o.id}">
      <header class="offer-card__head">
        <span class="offer-card__icon">${meta.icon}</span>
        <div>
          <h3>${escapeHtml(o.title)}</h3>
          <p class="offer-card__meta">${meta.label} · ${escapeHtml(o.issuer)} · ${fmtMoney(o.valueUsd)}</p>
        </div>
        <span class="offer-card__status">${st.label}</span>
      </header>
      <dl class="offer-card__facts">
        ${o.hardPull ? '<div><dt>Credit</dt><dd>Hard pull</dd></div>' : '<div><dt>Credit</dt><dd>Soft / none</dd></div>'}
        ${o.minSpend ? `<div><dt>Min spend</dt><dd>${fmtMoney(o.minSpend)}</dd></div>` : ''}
        ${o.earliestDate ? `<div><dt>Earliest</dt><dd>${o.earliestDate}</dd></div>` : ''}
        ${o.completedDate ? `<div><dt>Done</dt><dd>${o.completedDate}</dd></div>` : ''}
      </dl>
      ${ev.blockers.length ? `<ul class="offer-alerts offer-alerts--block">${ev.blockers.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
      ${ev.warnings.length ? `<ul class="offer-alerts offer-alerts--warn">${ev.warnings.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
      ${o.notes ? `<p class="offer-notes">${escapeHtml(o.notes)}</p>` : ''}
      <div class="offer-card__actions">
        <select class="offer-status-select" data-id="${o.id}" aria-label="Status">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select>
        <button type="button" class="btn-ghost offer-edit" data-id="${o.id}">Edit</button>
        <button type="button" class="btn-ghost offer-del" data-id="${o.id}">Remove</button>
      </div>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderOffers() {
  const list = $('#offerList');
  if (!state.offers.length) {
    list.innerHTML = '<p class="empty">No offers yet — add one or load the starter set.</p>';
    return;
  }
  const sorted = [...state.offers].sort((a, b) => (a.priority || 99) - (b.priority || 99));
  list.innerHTML = sorted.map(offerCard).join('');

  list.querySelectorAll('.offer-status-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const o = state.offers.find((x) => x.id === sel.dataset.id);
      if (!o) return;
      o.status = sel.value;
      if (o.status === 'done' && !o.completedDate) {
        o.completedDate = new Date().toISOString().slice(0, 10);
        if (o.hardPull) state.profile.lastHardPull = o.completedDate;
      }
      save();
      renderAll();
    });
  });
  list.querySelectorAll('.offer-edit').forEach((btn) => btn.addEventListener('click', () => openForm(btn.dataset.id)));
  list.querySelectorAll('.offer-del').forEach((btn) => btn.addEventListener('click', () => {
    if (!confirm('Remove this offer?')) return;
    state.offers = state.offers.filter((x) => x.id !== btn.dataset.id);
    save();
    renderAll();
  }));
}

function renderTimeline() {
  const tl = suggestTimeline(state.offers, state.profile);
  const el = $('#timeline');
  if (!tl.length) {
    el.innerHTML = '<p class="empty">Add planned offers to see a semi-realistic sequence.</p>';
    return;
  }
  el.innerHTML = tl.map((row, i) => `
    <div class="timeline-row">
      <span class="timeline-step">${i + 1}</span>
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <span class="timeline-date">${row.suggestedDate}</span>
        <p class="timeline-reason">${escapeHtml(row.reason)}</p>
      </div>
    </div>
  `).join('');
}

function renderAll() {
  renderProfile();
  renderStats();
  renderOffers();
  renderTimeline();
}

function openForm(id) {
  const modal = $('#offerModal');
  const o = id ? state.offers.find((x) => x.id === id) : null;
  $('#offerModalTitle').textContent = o ? 'Edit offer' : 'Add offer';
  $('#offerId').value = o?.id || '';
  $('#offerTitle').value = o?.title || '';
  $('#offerType').value = o?.type || 'cc';
  $('#offerIssuer').value = o?.issuer || 'Chase';
  $('#offerValue').value = o?.valueUsd ?? '';
  $('#offerMinSpend').value = o?.minSpend ?? '';
  $('#offerHardPull').checked = o?.hardPull ?? true;
  $('#offerPriority').value = o?.priority ?? 5;
  $('#offerEarliest').value = o?.earliestDate || '';
  $('#offerNotes').value = o?.notes || '';
  modal.hidden = false;
}

function closeForm() {
  $('#offerModal').hidden = true;
}

function saveOffer(e) {
  e.preventDefault();
  const id = $('#offerId').value || crypto.randomUUID();
  const existing = state.offers.find((x) => x.id === id);
  const payload = {
    id,
    type: $('#offerType').value,
    title: $('#offerTitle').value.trim(),
    issuer: $('#offerIssuer').value,
    valueUsd: Number($('#offerValue').value) || 0,
    minSpend: Number($('#offerMinSpend').value) || 0,
    hardPull: $('#offerHardPull').checked,
    priority: Number($('#offerPriority').value) || 5,
    earliestDate: $('#offerEarliest').value,
    notes: $('#offerNotes').value.trim(),
    status: existing?.status || 'planned',
    completedDate: existing?.completedDate || '',
  };
  if (!payload.title) return;
  if (existing) {
    Object.assign(existing, payload);
  } else {
    state.offers.push(payload);
  }
  save();
  closeForm();
  renderAll();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `promo-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = { ...defaultState(), ...parsed, profile: { ...defaultProfile(), ...parsed.profile } };
      save();
      renderAll();
    } catch {
      alert('Could not read that file — need a promo-tracker JSON export.');
    }
  };
  reader.readAsText(file);
}

function init() {
  $all('[data-profile]').forEach((el) => {
    el.addEventListener('change', readProfile);
    el.addEventListener('blur', readProfile);
  });

  $('#addOffer')?.addEventListener('click', () => openForm(null));
  $('#loadSeed')?.addEventListener('click', () => {
    if (state.offers.length && !confirm('Replace offers with starter examples?')) return;
    state.offers = seedOffers();
    save();
    renderAll();
  });
  $('#exportBtn')?.addEventListener('click', exportJson);
  $('#importBtn')?.addEventListener('click', () => $('#importFile').click());
  $('#importFile')?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) importJson(f);
    e.target.value = '';
  });
  $('#offerForm')?.addEventListener('submit', saveOffer);
  $('#offerCancel')?.addEventListener('click', closeForm);
  $('#offerModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'offerModal') closeForm();
  });

  renderAll();
}

init();