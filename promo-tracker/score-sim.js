/**
 * Educational FICO-style score trajectory model — not a real bureau score.
 * Transparent factor weights; calibrates to user baseline.
 */

const WEIGHTS = {
  payment: 0.35,
  utilization: 0.30,
  length: 0.15,
  newCredit: 0.10,
  mix: 0.10,
};

const FACTOR_LABELS = {
  payment: 'Payment history',
  utilization: 'Amounts owed',
  length: 'Length of credit',
  newCredit: 'New credit',
  mix: 'Credit mix',
};

function clamp(n, lo = 300, hi = 850) {
  return Math.round(Math.max(lo, Math.min(hi, n)));
}

function n(v) {
  return Math.max(0, Number(v) || 0);
}

/** Derive utilization from limits/balances or explicit pct */
export function effectiveUtilization(profile) {
  const limit = n(profile.totalCreditLimit);
  const bal = n(profile.totalBalances);
  if (limit > 0) return Math.min(100, (bal / limit) * 100);
  return n(profile.utilizationPct);
}

/** Raw 0–100 subscores per FICO factor from profile snapshot */
export function factorScores(snapshot) {
  const util = effectiveUtilization(snapshot);
  const utilScore = util <= 9 ? 98
    : util <= 19 ? 90
    : util <= 29 ? 78
    : util <= 49 ? 55
    : util <= 69 ? 35
    : 15;

  const oldest = n(snapshot.oldestAccountYears ?? snapshot.creditHistoryYears);
  const aaoa = n(snapshot.aaoaYears);
  const lengthScore = Math.min(100,
    (oldest >= 15 ? 40 : oldest * 2.5)
    + (aaoa >= 8 ? 40 : aaoa * 4.5)
    + (n(snapshot.cardsOpen) >= 3 ? 20 : n(snapshot.cardsOpen) * 6),
  );

  const inq6 = n(snapshot.inquiries6mo);
  const inq12 = n(snapshot.inquiries12mo);
  const cards24 = n(snapshot.personalCards24mo ?? snapshot.cards24mo);
  const newScore = Math.max(5, 100
    - inq6 * 12
    - Math.max(0, inq12 - inq6) * 6
    - cards24 * 4
    - n(snapshot.recentAccounts12mo) * 8,
  );

  const cards = n(snapshot.cardsOpen);
  const hasInstallment = snapshot.hasMortgage || snapshot.hasAutoLoan || snapshot.hasStudentLoan;
  const mixScore = Math.min(100, 40 + cards * 8 + (hasInstallment ? 25 : 0));

  const late = n(snapshot.latePayments24mo);
  const paymentScore = late === 0 ? 98 : late === 1 ? 72 : late === 2 ? 50 : 25;

  return {
    payment: paymentScore,
    utilization: utilScore,
    length: lengthScore,
    newCredit: newScore,
    mix: mixScore,
  };
}

/** Weighted score from factor subscores (unscaled 0–100 composite → FICO range) */
export function scoreFromFactors(factors) {
  let composite = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    composite += (factors[k] ?? 50) * w;
  }
  return clamp(300 + composite * 5.5);
}

/** Scale factors so weighted score matches user baseline */
export function calibrateToBaseline(profile) {
  const target = n(profile.baselineScore) || scoreBandMid(profile.scoreBand) || 740;
  const raw = factorScores(profile);
  const rawScore = scoreFromFactors(raw);
  const delta = target - rawScore;
  const calibrated = { ...raw };
  if (Math.abs(delta) > 2) {
    const spread = Object.keys(WEIGHTS).reduce((s, k) => s + Math.abs(raw[k] - 50), 0) || 1;
    for (const k of Object.keys(WEIGHTS)) {
      const adj = ((raw[k] - 50) / spread) * delta * 0.55;
      calibrated[k] = Math.max(5, Math.min(100, raw[k] + adj / 5.5 / WEIGHTS[k]));
    }
  }
  return { factors: calibrated, score: clamp(target) };
}

function scoreBandMid(band) {
  const map = { '680-719': 700, '720-759': 740, '760-799': 780, '800+': 820 };
  return map[band] ?? 740;
}

/** Clone profile into sim state */
function snapshotProfile(profile) {
  return {
    ...profile,
    totalCreditLimit: n(profile.totalCreditLimit),
    totalBalances: n(profile.totalBalances),
    utilizationPct: effectiveUtilization(profile),
    personalCards24mo: n(profile.personalCards24mo ?? profile.cards24mo),
    cards24mo: n(profile.personalCards24mo ?? profile.cards24mo),
    cardsOpen: n(profile.cardsOpen),
    aaoaYears: n(profile.aaoaYears),
    oldestAccountYears: n(profile.oldestAccountYears ?? profile.creditHistoryYears),
    inquiries6mo: n(profile.inquiries6mo),
    inquiries12mo: n(profile.inquiries12mo),
    inquiries24mo: n(profile.inquiries24mo),
    recentAccounts12mo: n(profile.recentAccounts12mo),
  };
}

/** Apply one CC approval to running sim state */
function applyApproval(state, offer, events) {
  const line = n(offer.creditLine) || 8000;
  const msr = n(offer.minSpend);

  state.cardsOpen += 1;
  state.personalCards24mo += 1;
  state.cards24mo = state.personalCards24mo;
  state.recentAccounts12mo = n(state.recentAccounts12mo) + 1;
  state.inquiries6mo += 1;
  state.inquiries12mo += 1;
  state.inquiries24mo += 1;
  state.totalCreditLimit += line;

  const prevAaoa = state.aaoaYears;
  state.aaoaYears = (prevAaoa * (state.cardsOpen - 1)) / state.cardsOpen;
  events.push({
    type: 'inquiry',
    label: 'Hard inquiry',
    detail: `+1 inquiry (now ${state.inquiries6mo} in 6mo)`,
  });
  events.push({
    type: 'account',
    label: 'New account',
    detail: `AAoA ${prevAaoa.toFixed(1)}y → ${state.aaoaYears.toFixed(1)}y`,
  });
  events.push({
    type: 'limit',
    label: 'New credit line',
    detail: `+$${line.toLocaleString()} limit`,
  });

  if (msr > 0) {
    state._msrQueue = state._msrQueue || [];
    state._msrQueue.push({
      months: n(offer.msrMonths) || 3,
      amount: msr,
      cardLine: line,
      title: offer.title,
    });
  }

  return state;
}

/** Advance sim by one month — age inquiries, process spend for bonus, recover util */
function advanceMonth(state, events) {
  if (state._monthsSinceStart === undefined) state._monthsSinceStart = 0;
  state._monthsSinceStart += 1;

  if (state._monthsSinceStart === 6) {
    const before = state.inquiries6mo;
    state.inquiries6mo = Math.max(0, state.inquiries6mo - Math.ceil(state.inquiries6mo * 0.4));
    if (before !== state.inquiries6mo) {
      events.push({ type: 'recovery', label: 'Inquiry aging', detail: '6mo window refreshed (partial)' });
    }
  }
  if (state._monthsSinceStart === 12) {
    state.inquiries6mo = 0;
    state.inquiries12mo = Math.max(0, state.inquiries12mo - Math.ceil(state.inquiries12mo * 0.35));
    state.recentAccounts12mo = Math.max(0, state.recentAccounts12mo - 1);
    events.push({ type: 'recovery', label: '12mo milestone', detail: 'Recent accounts & inquiries age' });
  }

  state.aaoaYears += 1 / 12;

  if (state._msrQueue?.length) {
    state._msrQueue = state._msrQueue.map((m) => {
      if (m.months > 0) {
        const pct = 1 / m.months;
        const chunk = m.amount * pct;
        state.totalBalances += chunk;
        if (m.months === 1) {
          events.push({
            type: 'msr',
            label: 'Bonus spend peak',
            detail: `${m.title}: ~$${m.amount.toLocaleString()} on new line`,
          });
        }
        return { ...m, months: m.months - 1 };
      }
      if (!m.paid) {
        state.totalBalances = Math.max(0, state.totalBalances - m.amount);
        m.paid = true;
        events.push({ type: 'msr', label: 'Spend target met', detail: `${m.title}: balance cleared` });
      }
      return m;
    }).filter((m) => !m.paid || m.months > 0);
  }

  state.utilizationPct = effectiveUtilization(state);
}

/** Fixed offset so baseline matches user score; later steps reflect factor movement */
function createScorer(profile) {
  const baseSnap = snapshotProfile(profile);
  const offset = (n(profile.baselineScore) || scoreBandMid(profile.scoreBand) || 740)
    - scoreFromFactors(factorScores(baseSnap));

  return function scoreStep(snapshot, prevScore) {
    const rawFactors = factorScores(snapshot);
    const score = clamp(scoreFromFactors(rawFactors) + offset);
    return {
      score,
      delta: prevScore != null ? score - prevScore : 0,
      factors: rawFactors,
      rawFactors,
      utilizationPct: effectiveUtilization(snapshot),
      inquiries6mo: snapshot.inquiries6mo,
      aaoaYears: snapshot.aaoaYears,
      cardsOpen: snapshot.cardsOpen,
    };
  };
}

/**
 * Simulate planned CC offers in priority/timeline order.
 * @param {object} profile
 * @param {Array} offers — planned CC offers with hard pulls
 * @param {Array} [timeline] — optional dates from suggestTimeline
 */
export function simulateCreditPlan(profile, offers, timeline = []) {
  const ccOffers = offers
    .filter((o) => o.type === 'cc' && o.hardPull && !['done', 'skip'].includes(o.status))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  const dateMap = Object.fromEntries(timeline.map((t) => [t.offerId, t.suggestedDate]));

  let state = snapshotProfile(profile);
  delete state._msrQueue;
  delete state._monthsSinceStart;

  const scoreStep = createScorer(profile);
  const baseline = scoreStep(state, null);
  const steps = [{
    kind: 'baseline',
    label: 'Baseline',
    date: new Date().toISOString().slice(0, 10),
    ...baseline,
    events: [{ type: 'baseline', label: 'Starting point', detail: `Score ${baseline.score}` }],
  }];

  let prevScore = baseline.score;
  let monthCursor = 0;

  ccOffers.forEach((offer, idx) => {
    const events = [];
    state = applyApproval({ ...state, _msrQueue: state._msrQueue, _monthsSinceStart: state._monthsSinceStart }, offer, events);
    const immediate = scoreStep(state, prevScore);
    prevScore = immediate.score;

    steps.push({
      kind: 'application',
      label: offer.title,
      issuer: offer.issuer,
      offerId: offer.id,
      date: dateMap[offer.id] || '',
      ...immediate,
      events,
    });

    const gapMonths = offer.issuer === 'Chase' ? 4 : 3;
    for (let m = 0; m < gapMonths; m += 1) {
      const monthEvents = [];
      advanceMonth(state, monthEvents);
      monthCursor += 1;
      const monthStep = scoreStep(state, prevScore);
      if (Math.abs(monthStep.delta) >= 2 || monthEvents.length) {
        prevScore = monthStep.score;
        steps.push({
          kind: 'recovery',
          label: `Month +${monthCursor}`,
          after: offer.title,
          date: '',
          ...monthStep,
          events: monthEvents,
        });
      }
    }
  });

  const scores = steps.map((s) => s.score);
  const minScore = Math.min(...scores);
  const maxDrop = baseline.score - minScore;

  return {
    baseline: steps[0],
    steps,
    summary: {
      startScore: baseline.score,
      endScore: steps[steps.length - 1]?.score ?? baseline.score,
      minScore,
      maxDrop,
      totalApplications: ccOffers.length,
      mortgageRisk: profile.mortgageSensitive && maxDrop >= 15,
    },
    weights: WEIGHTS,
    factorLabels: FACTOR_LABELS,
  };
}

/** Human-readable factor deltas between two factor objects */
export function factorDeltas(before, after) {
  const out = [];
  for (const k of Object.keys(WEIGHTS)) {
    const d = (after[k] ?? 0) - (before[k] ?? 0);
    if (Math.abs(d) >= 0.5) {
      out.push({ factor: k, label: FACTOR_LABELS[k], delta: Math.round(d * 10) / 10 });
    }
  }
  return out;
}

export { WEIGHTS, FACTOR_LABELS };