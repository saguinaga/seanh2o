/** Issuer-specific velocity & eligibility rules (heuristics — verify before applying) */
import { ruleLabel, ruleTip } from './help-content.js';

export const ISSUER_GROUPS = [
  {
    label: 'National banks',
    issuers: [
      'Chase', 'Amex', 'Citi', 'Discover', 'Capital One',
      'Bank of America', 'Wells Fargo', 'US Bank', 'Barclays',
    ],
  },
  {
    label: 'Regional banks',
    issuers: ['PNC', 'TD Bank', 'Truist', 'Regions', 'Fifth Third', 'Huntington', 'BMO'],
  },
  {
    label: 'Credit unions',
    issuers: ['Navy Federal', 'PenFed', 'DCU', 'Alliant', 'Andrews FCU'],
  },
  {
    label: 'Fintech & neo-bank',
    issuers: ['Goldman Sachs', 'SoFi', 'Mercury', 'Brex'],
  },
  {
    label: 'Store & co-brand',
    issuers: ['Synchrony', 'Bread Financial', 'Comenity', 'Elan'],
  },
  {
    label: 'Specialty',
    issuers: ['Credit One', 'FNBO', 'First Tech FCU'],
  },
];

export const ISSUER_LIST = [...ISSUER_GROUPS.flatMap((g) => g.issuers), 'Other'];

function n(v) { return Math.max(0, Number(v) || 0); }

export function issuerRulesMeta() {
  return {
    Chase: {
      color: '#1174CC',
      rules: [
        { id: '5/24', name: 'New personal card limit', desc: 'Fewer than 5 personal cards opened in the last 24 months (from any bank) for most Chase cards.' },
        { id: '2/30', name: 'Recent Chase applications', desc: 'Try not to apply for more than ~2 Chase cards within 30 days.' },
        { id: '1/30', name: 'Application spacing', desc: 'Some reps flag more than one Chase application per 30 days.' },
      ],
    },
    Amex: {
      color: '#006FCF',
      rules: [
        { id: '2/90', name: 'Application pace', desc: 'About 2 new Amex credit cards every 90 days.' },
        { id: '5card', name: 'Total card limit', desc: 'Often capped around 5 Amex credit cards total.' },
        { id: '1life', name: 'Once per lifetime bonus', desc: 'Same card welcome bonus typically once per lifetime (per product family).' },
      ],
    },
    Citi: {
      color: '#003B70',
      rules: [
        { id: '8/65', name: 'Short-term pacing', desc: '1 Citi card per 8 days; no more than 2 per 65 days.' },
        { id: '1/95', name: 'Bonus cooldown', desc: 'Welcome bonus on a card family about once per 48 months.' },
        { id: '2/65', name: '65-day cap', desc: 'A second Citi card within 65 days is often auto-denied.' },
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
        { id: '1/6', name: '6-month spacing', desc: 'About 1 new Capital One card every 6 months.' },
        { id: '2/3', name: 'Personal card cap', desc: 'Often a maximum of 2 personal Capital One cards total.' },
      ],
    },
    'Bank of America': {
      color: '#E31837',
      rules: [
        { id: '2/3/4', name: '2 / 3 / 4 over time', desc: 'Max 2 BofA cards in 2 months, 3 in 12 months, 4 in 24 months.' },
      ],
    },
    'Wells Fargo': {
      color: '#D71E28',
      rules: [
        { id: '1/6wf', name: '6-month spacing', desc: 'Often 1 Wells Fargo card per 6 months.' },
        { id: 'bonus48', name: 'Bonus cooldown', desc: 'Welcome bonus on the same product about once per 48 months.' },
      ],
    },
    'US Bank': {
      color: '#0C2074',
      rules: [
        { id: 'usbank1', name: '12-month spacing', desc: 'Conservative pace: 1 US Bank card per 12 months.' },
      ],
    },
    Barclays: {
      color: '#00AEEF',
      rules: [
        { id: 'barc6', name: '6mo spacing', desc: 'Often 1 Barclays card per 6 months.' },
      ],
    },
    PNC: {
      color: '#F58025',
      rules: [
        { id: 'pnc6', name: '6mo spacing', desc: 'Community reports: ~1 PNC card per 6 months.' },
        { id: 'pncbonus', name: 'Bonus cooldown', desc: 'Same PNC product bonus often once per 24–48 months.' },
      ],
    },
    'TD Bank': {
      color: '#34A853',
      rules: [
        { id: 'td6', name: '6mo spacing', desc: 'Often 1 TD Bank card per 6 months.' },
      ],
    },
    Truist: {
      color: '#7B2D8E',
      rules: [
        { id: 'truist6', name: '6mo spacing', desc: 'Post-merger Truist often ~1 card per 6 months.' },
      ],
    },
    Regions: {
      color: '#007C3D',
      rules: [
        { id: 'regions6', name: '6mo spacing', desc: 'Often 1 Regions card per 6 months.' },
      ],
    },
    'Fifth Third': {
      color: '#004B8D',
      rules: [
        { id: '53_12', name: '12-month spacing', desc: 'Conservative: 1 Fifth Third card per 12 months.' },
      ],
    },
    Huntington: {
      color: '#5BA63C',
      rules: [
        { id: 'hunt6', name: '6mo spacing', desc: 'Often 1 Huntington card per 6 months.' },
      ],
    },
    BMO: {
      color: '#0079C1',
      rules: [
        { id: 'bmo6', name: '6mo spacing', desc: 'Often 1 BMO Harris card per 6 months.' },
      ],
    },
    'Navy Federal': {
      color: '#003366',
      rules: [
        { id: 'nfcu90', name: '90-day spacing', desc: 'Member-only. Often 1 Navy Federal card per 90 days.' },
        { id: 'nfcumem', name: 'Membership', desc: 'Military / DoD / family eligibility required.' },
      ],
    },
    PenFed: {
      color: '#1B365D',
      rules: [
        { id: 'penfed6', name: '6mo spacing', desc: 'Often 1 PenFed card per 6 months.' },
        { id: 'penfedmem', name: 'Membership', desc: 'Open membership available; verify eligibility.' },
      ],
    },
    DCU: {
      color: '#006298',
      rules: [
        { id: 'dcu6', name: '6mo spacing', desc: 'Often 1 DCU card per 6 months.' },
        { id: 'dcumem', name: 'Membership', desc: 'Credit union membership required.' },
      ],
    },
    Alliant: {
      color: '#582C83',
      rules: [
        { id: 'alliant6', name: '6mo spacing', desc: 'Often 1 Alliant card per 6 months.' },
      ],
    },
    'Andrews FCU': {
      color: '#003087',
      rules: [
        { id: 'andrews6', name: '6mo spacing', desc: 'Often 1 Andrews FCU card per 6 months.' },
      ],
    },
    'Goldman Sachs': {
      color: '#6F8FAF',
      rules: [
        { id: 'apple1', name: 'Apple Card', desc: 'Typically one Apple Card per person; no traditional SUB.' },
        { id: 'gscons', name: 'Conservative UW', desc: 'Goldman tends to be inquiry- and utilization-sensitive.' },
      ],
    },
    SoFi: {
      color: '#00D4AA',
      rules: [
        { id: 'sofi6', name: '6mo spacing', desc: 'Often 1 SoFi card per 6 months.' },
      ],
    },
    Mercury: {
      color: '#5B4FE6',
      rules: [
        { id: 'mercbiz', name: 'Business only', desc: 'Mercury cards are for business banking customers.' },
      ],
    },
    Brex: {
      color: '#111827',
      rules: [
        { id: 'brexbiz', name: 'Startup business', desc: 'Brex is business-only; underwriting uses cash flow.' },
      ],
    },
    Synchrony: {
      color: '#F4B400',
      rules: [
        { id: 'syncstore', name: 'Store cards', desc: 'Many co-brands allowed; limits often modest.' },
        { id: 'sync6', name: '6mo spacing', desc: 'Same Synchrony issuer: ~1 new card per 6 months.' },
      ],
    },
    'Bread Financial': {
      color: '#E87722',
      rules: [
        { id: 'bread6', name: '6mo spacing', desc: 'Often 1 Bread-issued card per 6 months.' },
      ],
    },
    Comenity: {
      color: '#C8102E',
      rules: [
        { id: 'comenity', name: 'Store cards', desc: 'Retail cards; many allowed but rarely high limits.' },
      ],
    },
    Elan: {
      color: '#4A4A4A',
      rules: [
        { id: 'elan6', name: 'Per-bank spacing', desc: 'Elan issues for many CUs/regions — track per bank brand.' },
      ],
    },
    'Credit One': {
      color: '#8B0000',
      rules: [
        { id: 'c1sub', name: 'Subprime', desc: 'Rebuild-focused; fees high — verify value vs national issuers.' },
      ],
    },
    FNBO: {
      color: '#0054A4',
      rules: [
        { id: 'fnbo6', name: '6mo spacing', desc: 'Often 1 FNBO card per 6 months.' },
      ],
    },
    'First Tech FCU': {
      color: '#00843D',
      rules: [
        { id: 'ftfcu6', name: '6mo spacing', desc: 'Often 1 First Tech card per 6 months.' },
      ],
    },
  };
}

export function evaluateIssuerGates(profile, issuer) {
  const p = normalizeCounters(profile);
  const results = [];

  if (issuer === 'Chase') {
    results.push(gate('5/24', p.personalCards24mo < 5, `${p.personalCards24mo} personal cards in 24 mo — ${p.personalCards24mo < 5 ? 'under limit of 5' : 'at or over limit of 5'}`));
    results.push(gate('2/30', p.chaseCards30d < 2, `${p.chaseCards30d} Chase card(s) in 30 days — ${p.chaseCards30d < 2 ? 'within ~2 limit' : 'over ~2 limit'}`));
  }
  if (issuer === 'Amex') {
    results.push(gate('2/90', p.amexCards90d < 2, `${p.amexCards90d} Amex card(s) in 90 days — ${p.amexCards90d < 2 ? 'within ~2 limit' : 'over ~2 limit'}`));
    results.push(gate('5-card', p.amexCardsTotal < 5, `${p.amexCardsTotal} Amex credit cards total — ${p.amexCardsTotal < 5 ? 'under ~5 cap' : 'at or over ~5 cap'}`));
  }
  if (issuer === 'Citi') {
    results.push(gate('8/65', p.citiCards8d < 1, `${p.citiCards8d} Citi card(s) in 8 days — need 0 to apply`));
    results.push(gate('2/65', p.citiCards65d < 2, `${p.citiCards65d} Citi card(s) in 65 days — ${p.citiCards65d < 2 ? 'under 2 limit' : 'at or over 2 limit'}`));
  }
  if (issuer === 'Discover') {
    results.push(gate('1card', p.discoverCardsTotal < 1, p.discoverCardsTotal < 1 ? 'No Discover card open — OK to apply' : 'Already have a Discover card'));
  }
  if (issuer === 'Capital One') {
    results.push(gate('1/6', p.capOneCards6mo < 1, `${p.capOneCards6mo} Cap One card(s) in 6 mo — ${p.capOneCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
    results.push(gate('2/3', p.capOneCardsTotal < 2, `${p.capOneCardsTotal} personal Cap One cards — ${p.capOneCardsTotal < 2 ? 'under ~2 limit' : 'at or over ~2 limit'}`));
  }
  if (issuer === 'Bank of America') {
    results.push(gate('2/3/4', p.bofaCards2mo < 2, `${p.bofaCards2mo} BofA card(s) in 2 mo — ${p.bofaCards2mo < 2 ? 'under 2 limit' : 'at or over 2 limit'}`));
    results.push(gate('bofa12', p.bofaCards12mo < 3, `${p.bofaCards12mo} BofA card(s) in 12 mo — ${p.bofaCards12mo < 3 ? 'under 3 limit' : 'at or over 3 limit'}`));
    results.push(gate('bofa24', p.bofaCards24mo < 4, `${p.bofaCards24mo} BofA card(s) in 24 mo — ${p.bofaCards24mo < 4 ? 'under 4 limit' : 'at or over 4 limit'}`));
  }
  if (issuer === 'Wells Fargo') {
    results.push(gate('1/6wf', p.wfCards6mo < 1, `${p.wfCards6mo} WF card(s) in 6 mo — ${p.wfCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'US Bank') {
    results.push(gate('usbank1', p.usbCards12mo < 1, `${p.usbCards12mo} US Bank card(s) in 12 mo — ${p.usbCards12mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Barclays') {
    results.push(gate('barc6', p.barcCards6mo < 1, `${p.barcCards6mo} Barclays card(s) in 6 mo — ${p.barcCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'PNC') {
    results.push(gate('pnc6', p.pncCards6mo < 1, `${p.pncCards6mo} PNC card(s) in 6 mo — ${p.pncCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'TD Bank') {
    results.push(gate('td6', p.tdCards6mo < 1, `${p.tdCards6mo} TD card(s) in 6 mo — ${p.tdCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Truist') {
    results.push(gate('truist6', p.truistCards6mo < 1, `${p.truistCards6mo} Truist card(s) in 6 mo — ${p.truistCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Regions') {
    results.push(gate('regions6', p.regionsCards6mo < 1, `${p.regionsCards6mo} Regions card(s) in 6 mo — ${p.regionsCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Fifth Third') {
    results.push(gate('53_12', p.fifthThirdCards12mo < 1, `${p.fifthThirdCards12mo} Fifth Third card(s) in 12 mo — ${p.fifthThirdCards12mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Huntington') {
    results.push(gate('hunt6', p.huntingtonCards6mo < 1, `${p.huntingtonCards6mo} Huntington card(s) in 6 mo — ${p.huntingtonCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'BMO') {
    results.push(gate('bmo6', p.bmoCards6mo < 1, `${p.bmoCards6mo} BMO card(s) in 6 mo — ${p.bmoCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Navy Federal') {
    results.push(gate('nfcu90', p.nfcuCards90d < 1, `${p.nfcuCards90d} NFCU card(s) in 90 days — ${p.nfcuCards90d < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'PenFed') {
    results.push(gate('penfed6', p.penfedCards6mo < 1, `${p.penfedCards6mo} PenFed card(s) in 6 mo — ${p.penfedCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'DCU') {
    results.push(gate('dcu6', p.dcuCards6mo < 1, `${p.dcuCards6mo} DCU card(s) in 6 mo — ${p.dcuCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Alliant') {
    results.push(gate('alliant6', p.alliantCards6mo < 1, `${p.alliantCards6mo} Alliant card(s) in 6 mo — ${p.alliantCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Andrews FCU') {
    results.push(gate('andrews6', p.andrewsCards6mo < 1, `${p.andrewsCards6mo} Andrews card(s) in 6 mo — ${p.andrewsCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Goldman Sachs') {
    results.push(gate('apple1', p.goldmanCardsTotal < 1, p.goldmanCardsTotal < 1 ? 'No Goldman/Apple card — OK to apply' : 'Already have a Goldman/Apple card'));
  }
  if (issuer === 'SoFi') {
    results.push(gate('sofi6', p.sofiCards6mo < 1, `${p.sofiCards6mo} SoFi card(s) in 6 mo — ${p.sofiCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Synchrony') {
    results.push(gate('sync6', p.syncCards6mo < 1, `${p.syncCards6mo} Synchrony card(s) in 6 mo — ${p.syncCards6mo < 1 ? 'spacing OK' : 'consider waiting'}`, true));
  }
  if (issuer === 'Bread Financial') {
    results.push(gate('bread6', p.breadCards6mo < 1, `${p.breadCards6mo} Bread card(s) in 6 mo — ${p.breadCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'Elan') {
    results.push(gate('elan6', p.elanCards6mo < 1, `${p.elanCards6mo} Elan-brand card(s) in 6 mo — ${p.elanCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'FNBO') {
    results.push(gate('fnbo6', p.fnboCards6mo < 1, `${p.fnboCards6mo} FNBO card(s) in 6 mo — ${p.fnboCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }
  if (issuer === 'First Tech FCU') {
    results.push(gate('ftfcu6', p.firstTechCards6mo < 1, `${p.firstTechCards6mo} First Tech card(s) in 6 mo — ${p.firstTechCards6mo < 1 ? 'spacing OK' : 'wait for spacing'}`));
  }

  const blocked = results.filter((r) => !r.pass);
  const status = blocked.length ? 'blocked' : results.some((r) => r.caution) ? 'caution' : 'clear';
  return { issuer, status, results, blocked };
}

function gate(id, pass, detail, caution = false) {
  return {
    id,
    label: ruleLabel(id),
    tip: ruleTip(id),
    pass,
    detail,
    caution: caution && pass,
  };
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
    pncCards6mo: n(p.pncCards6mo),
    tdCards6mo: n(p.tdCards6mo),
    truistCards6mo: n(p.truistCards6mo),
    regionsCards6mo: n(p.regionsCards6mo),
    fifthThirdCards12mo: n(p.fifthThirdCards12mo),
    huntingtonCards6mo: n(p.huntingtonCards6mo),
    bmoCards6mo: n(p.bmoCards6mo),
    nfcuCards90d: n(p.nfcuCards90d),
    penfedCards6mo: n(p.penfedCards6mo),
    dcuCards6mo: n(p.dcuCards6mo),
    alliantCards6mo: n(p.alliantCards6mo),
    andrewsCards6mo: n(p.andrewsCards6mo),
    goldmanCardsTotal: n(p.goldmanCardsTotal),
    sofiCards6mo: n(p.sofiCards6mo),
    syncCards6mo: n(p.syncCards6mo),
    breadCards6mo: n(p.breadCards6mo),
    elanCards6mo: n(p.elanCards6mo),
    fnboCards6mo: n(p.fnboCards6mo),
    firstTechCards6mo: n(p.firstTechCards6mo),
  };
}

export function allIssuerDashboard(profile) {
  return ISSUER_LIST.filter((i) => i !== 'Other').map((issuer) => evaluateIssuerGates(profile, issuer));
}