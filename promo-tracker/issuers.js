/** Issuer-specific velocity & eligibility rules (heuristics — verify before applying) */

export const ISSUER_LIST = [
  'Chase', 'Amex', 'Citi', 'Discover', 'Capital One', 'Bank of America', 'Wells Fargo', 'US Bank', 'Barclays', 'Other',
];

function n(v) { return Math.max(0, Number(v) || 0); }

export function issuerRulesMeta() {
  return {
    Chase: {
      color: '#1174CC',
      rules: [
        { id: '5/24', name: '5/24 rule', desc: 'Fewer than 5 personal cards opened in last 24 months for most Chase cards.' },
        { id: '2/30', name: '2/30', desc: 'Max ~2 Chase cards in 30 days (unwritten, often cited).' },
        { id: '1/30', name: '1/30', desc: 'Some reps flag >1 Chase app per 30 days.' },
      ],
    },
    Amex: {
      color: '#006FCF',
      rules: [
        { id: '2/90', name: '2/90', desc: 'Max ~2 Amex credit cards per 90 days.' },
        { id: '5card', name: '5-card limit', desc: 'Often capped around 5 Amex credit cards total.' },
        { id: '1life', name: 'Once per lifetime', desc: 'Same card SUB typically once per lifetime (per product family).' },
      ],
    },
    Citi: {
      color: '#003B70',
      rules: [
        { id: '8/65', name: '8/65', desc: '1 Citi card per 8 days; 2 per 65 days.' },
        { id: '1/95', name: '1/95 bonus', desc: 'Bonus on a card family once per 48 months (~95 for some families).' },
        { id: '2/65', name: '2/65 velocity', desc: 'Second card within 65 days often auto-denied.' },
      ],
    },
    Discover: {
      color: '#FF6000',
      rules: [
        { id: '1card', name: 'One Discover', desc: 'Usually only one Discover card at a time.' },
        { id: 'match', name: 'First-year match', desc: 'Cashback Match doubles first-year rewards (not a SUB in points).' },
      ],
    },
    'Capital One': {
      color: '#D03027',
      rules: [
        { id: '1/6', name: '1/6', desc: 'Max 1 Capital One card every 6 months.' },
        { id: '2/3', name: '2 personal', desc: 'Often max 2 personal Capital One cards total.' },
      ],
    },
    'Bank of America': {
      color: '#E31837',
      rules: [
        { id: '2/3/4', name: '2/3/4', desc: 'Max 2 cards in 2mo, 3 in 12mo, 4 in 24mo (BofA cards).' },
      ],
    },
    'Wells Fargo': {
      color: '#D71E28',
      rules: [
        { id: '1/6wf', name: '1/6 spacing', desc: 'Often 1 Wells Fargo card per 6 months.' },
        { id: 'bonus48', name: '48mo bonus', desc: 'SUB on same product about once per 48 months.' },
      ],
    },
    'US Bank': {
      color: '#0C2074',
      rules: [
        { id: 'usbank1', name: '1/12', desc: 'Conservative: 1 US Bank card per 12 months for approvals.' },
      ],
    },
    Barclays: {
      color: '#00AEEF',
      rules: [
        { id: 'barc6', name: '6mo spacing', desc: 'Often 1 Barclays card per 6 months.' },
      ],
    },
  };
}

export function evaluateIssuerGates(profile, issuer) {
  const p = normalizeCounters(profile);
  const results = [];

  if (issuer === 'Chase') {
    results.push(gate('5/24', p.personalCards24mo < 5, `${p.personalCards24mo}/5 personal cards (24mo)`));
    results.push(gate('2/30', p.chaseCards30d < 2, `${p.chaseCards30d}/2 Chase (30d)`));
  }
  if (issuer === 'Amex') {
    results.push(gate('2/90', p.amexCards90d < 2, `${p.amexCards90d}/2 Amex (90d)`));
    results.push(gate('5-card', p.amexCardsTotal < 5, `${p.amexCardsTotal}/5 Amex cards`));
  }
  if (issuer === 'Citi') {
    results.push(gate('8/65', p.citiCards8d < 1, `${p.citiCards8d}/1 Citi (8d)`));
    results.push(gate('2/65', p.citiCards65d < 2, `${p.citiCards65d}/2 Citi (65d)`));
  }
  if (issuer === 'Discover') {
    results.push(gate('1card', p.discoverCardsTotal < 1, `${p.discoverCardsTotal}/1 Discover`));
  }
  if (issuer === 'Capital One') {
    results.push(gate('1/6', p.capOneCards6mo < 1, `${p.capOneCards6mo}/1 Cap One (6mo)`));
    results.push(gate('2/3', p.capOneCardsTotal < 2, `${p.capOneCardsTotal}/2 Cap One personal`));
  }
  if (issuer === 'Bank of America') {
    results.push(gate('2/3/4', p.bofaCards2mo < 2, `${p.bofaCards2mo}/2 BofA (2mo)`));
    results.push(gate('bofa12', p.bofaCards12mo < 3, `${p.bofaCards12mo}/3 BofA (12mo)`));
    results.push(gate('bofa24', p.bofaCards24mo < 4, `${p.bofaCards24mo}/4 BofA (24mo)`));
  }
  if (issuer === 'Wells Fargo') {
    results.push(gate('1/6wf', p.wfCards6mo < 1, `${p.wfCards6mo}/1 WF (6mo)`));
  }
  if (issuer === 'US Bank') {
    results.push(gate('usbank1', p.usbCards12mo < 1, `${p.usbCards12mo}/1 US Bank (12mo)`));
  }
  if (issuer === 'Barclays') {
    results.push(gate('barc6', p.barcCards6mo < 1, `${p.barcCards6mo}/1 Barclays (6mo)`));
  }

  const blocked = results.filter((r) => !r.pass);
  const status = blocked.length ? 'blocked' : results.some((r) => r.caution) ? 'caution' : 'clear';
  return { issuer, status, results, blocked };
}

function gate(id, pass, detail, caution = false) {
  return { id, pass, detail, caution: caution && pass };
}

function normalizeCounters(profile) {
  const p = profile || {};
  return {
    personalCards24mo: n(p.personalCards24mo ?? p.cards24mo),
    chaseCards30d: n(p.chaseCards30d),
    amexCards90d: n(p.amexCards90d),
    amexCardsTotal: n(p.amexCardsTotal),
    citiCards8d: n(p.citiCards8d),
    citiCards65d: n(p.citiCards65d),
    discoverCardsTotal: n(p.discoverCardsTotal),
    capOneCards6mo: n(p.capOneCards6mo),
    capOneCardsTotal: n(p.capOneCardsTotal),
    bofaCards2mo: n(p.bofaCards2mo),
    bofaCards12mo: n(p.bofaCards12mo),
    bofaCards24mo: n(p.bofaCards24mo),
    wfCards6mo: n(p.wfCards6mo),
    usbCards12mo: n(p.usbCards12mo),
    barcCards6mo: n(p.barcCards6mo),
  };
}

export function allIssuerDashboard(profile) {
  return ISSUER_LIST.filter((i) => i !== 'Other').map((issuer) => evaluateIssuerGates(profile, issuer));
}