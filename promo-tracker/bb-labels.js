/** Plain-language labels & tooltips for hobby jargon */

export const TERMS = {
  sub: {
    tip: 'Welcome bonus (often called SUB): extra points or cash the bank gives you for opening a card and hitting a spending target. Amounts change — always verify the live offer.',
  },
  msr: {
    tip: 'MSR = Minimum Spend Requirement (NOT "merchant sales rewards" or similar). This is the dollar amount you must charge on the NEW card in the first X months (using money you were already going to spend on groceries/gas/etc.) to unlock the welcome bonus. Miss it and you get nothing extra.',
  },
  af: {
    tip: 'Annual fee: what the card costs per year after the first year (some cards waive year one). Subtract this from the bonus when judging value.',
  },
  hard_pull: {
    tip: 'Hard inquiry: the bank pulls your credit report when you apply. Too many in a short window can mean denials or a temporary score dip.',
  },
  points: {
    tip: 'Reward points: bank currency you can redeem for travel, cash, or gift cards. Value varies — we show a rough cash estimate.',
  },
  five24: {
    tip: 'Chase’s “5/24” rule: if you opened 5 or more personal credit cards (from any bank) in the last 24 months, Chase will usually decline you for most of their cards.',
  },
  inquiries: {
    tip: 'Credit inquiries: each card application adds a hard pull. Many banks get nervous if you have several in the last 6 months.',
  },
  utilization: {
    tip: 'Utilization: balances divided by credit limits across your cards. High utilization (especially over 30%) can hurt approvals and your score.',
  },
  aaoa: {
    tip: 'Average age of accounts (AAoA): how old your cards are on average. Very young credit history makes some issuers cautious.',
  },
  velocity: {
    tip: 'Velocity rules: informal limits on how many cards you can open with one bank in a given period (e.g. “2 cards per 90 days”).',
  },
  gate: {
    tip: 'Gate / blocker: a rule from your profile that suggests waiting before applying — you might still get approved, but odds are lower.',
  },
  transfer: {
    tip: 'Transfer partners: some point types can move to airline or hotel programs. Useful for trips; not required for cash-back style bonuses.',
  },
  captured: {
    tip: 'Captured: bonus money you’ve already received (offer marked Done).',
  },
  pipeline: {
    tip: 'Pipeline: estimated value of bonuses still in your queue — not in your bank account until you finish spend and the bonus posts.',
  },
  cash_floor: {
    tip: 'Cash floor: conservative value if you redeemed as statement credit or through a bank portal (~1¢ per point). This is the “honest dollars” number.',
  },
  travel_upside: {
    tip: 'Travel upside: estimated trip value if you transfer points to airline/hotel partners (Hyatt, United, Flying Blue, etc.) — often 1.4–2.5¢ per point. Same grocery spend, bigger family trip.',
  },
};

/** Issuer rule jargon → plain titles & explanations */
export const RULE_HELP = {
  '5/24': {
    label: 'Chase new-card limit',
    tip: 'Count every personal credit card you opened in the last 24 months, from any bank. Chase generally wants this under 5.',
  },
  '2/30': {
    label: 'Recent Chase applications',
    tip: 'Unwritten but often cited: try not to apply for more than ~2 Chase cards within 30 days.',
  },
  '1/30': { label: 'Chase application spacing', tip: 'Some reps flag more than one Chase application per 30 days.' },
  '2/90': {
    label: 'Amex application pace',
    tip: 'American Express often limits you to about 2 new credit cards every 90 days.',
  },
  '5-card': {
    label: 'Amex card count',
    tip: 'Many people are capped around 5 Amex credit cards total (charge cards may not count the same way).',
  },
  '1life': {
    label: 'Once-per-lifetime bonus',
    tip: 'You can usually earn the welcome bonus on the same Amex card family only once in your life.',
  },
  '8/65': {
    label: 'Citi pacing (8 days)',
    tip: 'Citi often allows 1 new card per 8 days, and no more than 2 per 65 days.',
  },
  '2/65': { label: 'Citi pacing (65 days)', tip: 'A second Citi card within 65 days is often auto-denied.' },
  '1/95': { label: 'Citi bonus cooldown', tip: 'Welcome bonus on the same Citi card family about once every 48 months.' },
  '1card': { label: 'One Discover card', tip: 'Discover typically allows only one Discover card at a time.' },
  'match': { label: 'First-year cashback match', tip: 'Discover doubles all cashback in year one — different from a points welcome bonus.' },
  '1/6': { label: '6-month spacing', tip: 'Capital One often approves about 1 new card every 6 months.' },
  '2/3': { label: 'Cap One card limit', tip: 'Often a maximum of 2 personal Capital One cards total.' },
  '2/3/4': { label: 'BofA 2 / 3 / 4 rule', tip: 'Bank of America: max 2 cards in 2 months, 3 in 12 months, 4 in 24 months.' },
  bofa12: { label: 'BofA 12-month cap', tip: 'Third BofA card within 12 months may be denied.' },
  bofa24: { label: 'BofA 24-month cap', tip: 'Fourth BofA card within 24 months may be denied.' },
  '1/6wf': { label: 'Wells Fargo spacing', tip: 'Often 1 Wells Fargo card every 6 months.' },
  bonus48: { label: 'WF bonus cooldown', tip: 'Same Wells Fargo product bonus about once per 48 months.' },
  usbank1: { label: 'US Bank spacing', tip: 'Conservative pace: 1 US Bank card per 12 months.' },
  barc6: { label: 'Barclays spacing', tip: 'Often 1 Barclays card every 6 months.' },
  pnc6: { label: 'PNC spacing', tip: 'Community reports: ~1 PNC card every 6 months.' },
  pncbonus: { label: 'PNC bonus cooldown', tip: 'Same PNC product bonus often once per 24–48 months.' },
  td6: { label: 'TD Bank spacing', tip: 'Often 1 TD Bank card every 6 months.' },
  truist6: { label: 'Truist spacing', tip: 'Often 1 Truist card every 6 months.' },
  regions6: { label: 'Regions spacing', tip: 'Often 1 Regions card every 6 months.' },
  '53_12': { label: 'Fifth Third spacing', tip: 'Conservative: 1 Fifth Third card per 12 months.' },
  hunt6: { label: 'Huntington spacing', tip: 'Often 1 Huntington card every 6 months.' },
  bmo6: { label: 'BMO spacing', tip: 'Often 1 BMO Harris card every 6 months.' },
  nfcu90: { label: 'Navy Federal spacing', tip: 'Member-only. Often 1 NFCU card every 90 days.' },
  nfcumem: { label: 'NFCU membership', tip: 'Military, DoD, or eligible family membership required.' },
  penfed6: { label: 'PenFed spacing', tip: 'Often 1 PenFed card every 6 months.' },
  penfedmem: { label: 'PenFed membership', tip: 'Credit union membership required (open membership available).' },
  dcu6: { label: 'DCU spacing', tip: 'Often 1 DCU card every 6 months.' },
  dcumem: { label: 'DCU membership', tip: 'Digital Federal Credit Union membership required.' },
  alliant6: { label: 'Alliant spacing', tip: 'Often 1 Alliant card every 6 months.' },
  andrews6: { label: 'Andrews FCU spacing', tip: 'Often 1 Andrews FCU card every 6 months.' },
  apple1: { label: 'Apple Card limit', tip: 'Usually one Apple Card per person; no traditional points welcome bonus.' },
  gscons: { label: 'Goldman underwriting', tip: 'Goldman Sachs (Apple Card) is often sensitive to inquiries and utilization.' },
  sofi6: { label: 'SoFi spacing', tip: 'Often 1 SoFi card every 6 months.' },
  mercbiz: { label: 'Business only', tip: 'Mercury cards are for business banking customers.' },
  brexbiz: { label: 'Business only', tip: 'Brex is for businesses; approval uses company cash flow.' },
  syncstore: { label: 'Store cards', tip: 'Many store cards are OK to hold, but limits are often modest.' },
  sync6: { label: 'Synchrony spacing', tip: 'About 1 new Synchrony-issued card every 6 months.' },
  bread6: { label: 'Bread Financial spacing', tip: 'Often 1 Bread-issued card every 6 months.' },
  comenity: { label: 'Store cards', tip: 'Retail cards; approvals vary widely.' },
  elan6: { label: 'Elan (per bank)', tip: 'Elan issues for many credit unions — track spacing per bank brand.' },
  c1sub: { label: 'Rebuild card', tip: 'Geared toward rebuilding credit; fees can be high — compare carefully.' },
  fnbo6: { label: 'FNBO spacing', tip: 'Often 1 FNBO card every 6 months.' },
  ftfcu6: { label: 'First Tech spacing', tip: 'Often 1 First Tech FCU card every 6 months.' },
};

export function issuerStatusLabel(status) {
  return { clear: 'Looks OK', caution: 'Go slow', blocked: 'Wait' }[status] || status;
}

export function gatePassLabel(pass) {
  return pass ? 'Within limit' : 'Over limit';
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Small ? button with hover/focus tooltip */
export function helpTip(termKey, { label } = {}) {
  const t = TERMS[termKey] || RULE_HELP[termKey];
  if (!t?.tip) return '';
  const aria = label || t.label || 'More info';
  return `<button type="button" class="help-tip" aria-label="${esc(aria)}: ${esc(t.tip)}" data-tip="${esc(t.tip)}">?</button>`;
}

/** Plain label + optional tip icon */
export function labelWithTip(text, termKey) {
  return `${text}${helpTip(termKey)}`;
}

export function ruleLabel(ruleId) {
  return RULE_HELP[ruleId]?.label || ruleId;
}

export function ruleTip(ruleId) {
  return RULE_HELP[ruleId]?.tip || '';
}

export function ruleLabelHtml(ruleId) {
  const label = ruleLabel(ruleId);
  const tip = ruleTip(ruleId);
  if (!tip) return esc(label);
  return `${esc(label)}<button type="button" class="help-tip" aria-label="${esc(label)}: ${esc(tip)}" data-tip="${esc(tip)}">?</button>`;
}

export function glossaryHtml() {
  const rows = [
    ['Welcome bonus', 'SUB', TERMS.sub.tip],
    ['Minimum Spend Requirement', 'MSR (NOT merchant sales or anything like that)', TERMS.msr.tip],
    ['Annual fee', 'AF', TERMS.af.tip],
    ['Hard inquiry', 'Hard pull', TERMS.hard_pull.tip],
    ['Chase 5/24', '5/24', TERMS.five24.tip],
    ['Reward points', 'Pts', TERMS.points.tip],
    ['Average account age', 'AAoA', TERMS.aaoa.tip],
    ['Utilization', 'Util %', TERMS.utilization.tip],
    ['Velocity rule', 'e.g. 2/90', TERMS.velocity.tip],
  ];
  return `
    <dl class="glossary">
      ${rows.map(([plain, jargon, tip]) => `
        <div class="glossary__row">
          <dt>${esc(plain)} <span class="glossary__jargon">${esc(jargon)}</span></dt>
          <dd>${esc(tip)}</dd>
        </div>
      `).join('')}
    </dl>
  `;
}

/** Friendlier bonus line for catalog cards */
export function formatWelcomeBonus(card, estVal, fmtMoney) {
  if (card.cashbackMatch) return 'First-year cashback doubled (Discover Match)';
  if (card.subPoints) {
    return `${Math.round(card.subPoints / 1000)}k points welcome bonus · ~${fmtMoney(estVal)} cash value`;
  }
  if (card.subCash) return `$${card.subCash} cash welcome bonus`;
  return 'Bonus varies — check issuer site';
}

export function formatSpendReq(msr, months) {
  if (!msr) return 'No minimum spend for bonus';
  return `Spend ${msr.toLocaleString()} in ${months} month${months === 1 ? '' : 's'} to earn bonus`;
}