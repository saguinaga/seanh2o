/** Household / Player 1+2 points sharing — full matrix */

import { evaluateIssuerGates } from './issuers.js';
import { pointsWallet, PARTNERS, PROGRAMS, tripTransferPlan } from './transfers.js';
import { defaultProfile } from './rules.js';

export const POOLING_MATRIX = {
  chase_ur: {
    program: 'chase_ur',
    poolsSamePersonCards: true,
    poolsAcrossHousehold: false,
    authorizedUserEarns: false,
    canTransferToPartnerLoyalty: true,
    summary: 'UR pools across your Chase cards (Freedom → Sapphire). Spouses keep separate UR — transfer both to same Hyatt/United account.',
  },
  amex_mr: {
    program: 'amex_mr',
    poolsSamePersonCards: true,
    poolsAcrossHousehold: false,
    authorizedUserEarns: true,
    canTransferToPartnerLoyalty: true,
    summary: 'MR pools on one login. AUs earn into primary pool. Second Amex account = separate MR until you transfer out.',
  },
  citi_ty: {
    program: 'citi_ty',
    poolsSamePersonCards: true,
    poolsAcrossHousehold: false,
    authorizedUserEarns: false,
    canTransferToPartnerLoyalty: true,
    summary: 'ThankYou pools per Citi login. Need Premier/Strata to transfer. Combine at airline/hotel loyalty #.',
  },
  capone: {
    program: 'capone',
    poolsSamePersonCards: true,
    poolsAcrossHousehold: false,
    authorizedUserEarns: true,
    canTransferToPartnerLoyalty: true,
    summary: 'Miles pool across Cap One cards on one account.',
  },
};

export function defaultHousehold() {
  const p2 = defaultProfile();
  return {
    enabled: true,
    player1Label: 'You',
    player2Label: 'Partner',
    player2Profile: {
      baselineScore: p2.baselineScore,
      personalCards24mo: 0,
      cards24mo: 0,
      inquiries6mo: 0,
      inquiries12mo: 0,
      chaseCards30d: 0,
      amexCards90d: 0,
      amexCardsTotal: 0,
      citiCards65d: 0,
      existingPoints: { chase_ur: 0, amex_mr: 0, citi_ty: 0, capone: 0 },
    },
    sharedLoyalty: {
      hyatt: '',
      united: '',
      marriott: '',
      delta: '',
      southwest: '',
    },
    offerOwner: {},
  };
}

export function householdWallet(profile, household, offers) {
  const p1 = pointsWallet(profile, offers.filter((o) => getOfferOwner(household, o.id) !== 'player2'));
  const p2Offers = offers.filter((o) => getOfferOwner(household, o.id) === 'player2');
  const p2Prof = { ...profile, ...household.player2Profile, existingPoints: household.player2Profile?.existingPoints };
  const p2 = pointsWallet(p2Prof, p2Offers);

  const combined = { ...p1.byProgram };
  Object.entries(p2.byProgram).forEach(([k, v]) => {
    combined[k] = (combined[k] || 0) + v;
  });

  return { player1: p1, player2: p2, combinedByProgram: combined };
}

export function getOfferOwner(household, offerId) {
  return household?.offerOwner?.[offerId] || 'player1';
}

export function setOfferOwner(household, offerId, owner) {
  return {
    ...household,
    offerOwner: { ...household.offerOwner, [offerId]: owner },
  };
}

/** Who should open the next card based on issuer gates */
export function suggestOfferOwner(profile, household, offer) {
  const p2 = { ...defaultProfile(), ...profile, ...household.player2Profile };
  const g1 = offer.issuer && offer.issuer !== 'Other' ? evaluateIssuerGates(profile, offer.issuer) : { status: 'clear' };
  const g2 = offer.issuer && offer.issuer !== 'Other' ? evaluateIssuerGates(p2, offer.issuer) : { status: 'clear' };

  if (g1.status === 'blocked' && g2.status !== 'blocked') return { owner: 'player2', reason: `${household.player2Label} passes ${offer.issuer} gates` };
  if (g2.status === 'blocked' && g1.status !== 'blocked') return { owner: 'player1', reason: `${household.player1Label} passes ${offer.issuer} gates` };
  if (g1.status === 'blocked' && g2.status === 'blocked') return { owner: null, reason: 'Both blocked — wait or skip' };
  const p1Cards = profile.personalCards24mo ?? profile.cards24mo ?? 0;
  const p2Cards = p2.personalCards24mo ?? p2.cards24mo ?? 0;
  if (p1Cards > p2Cards) return { owner: 'player2', reason: 'Balance 5/24 — player 2 has more room' };
  return { owner: 'player1', reason: 'Default to player 1' };
}

/** Optimal split of queued offers across household */
export function optimalHouseholdSplit(profile, household, offers) {
  const pending = offers.filter((o) => !['done', 'skip'].includes(o.status));
  const assignments = pending.map((o) => {
    const sug = suggestOfferOwner(profile, household, o);
    return {
      offerId: o.id,
      title: o.title,
      issuer: o.issuer,
      suggestedOwner: sug.owner,
      reason: sug.reason,
      valueUsd: o.valueUsd || 0,
    };
  });

  const p1Val = assignments.filter((a) => a.suggestedOwner === 'player1').reduce((s, a) => s + a.valueUsd, 0);
  const p2Val = assignments.filter((a) => a.suggestedOwner === 'player2').reduce((s, a) => s + a.valueUsd, 0);

  return { assignments, p1Val, p2Val };
}

/** Trip funding split using combined wallet + shared loyalty */
export function tripSplitPlan(tripId, profile, household, offers) {
  const hw = householdWallet(profile, household, offers);
  const combinedByProgram = hw.combinedByProgram;
  const combinedWallet = {
    byProgram: combinedByProgram,
    totalPoints: Object.values(combinedByProgram).reduce((s, n) => s + n, 0),
    lines: [],
  };
  const plan = tripTransferPlan(tripId, combinedWallet);
  const loyalty = household.sharedLoyalty || {};

  const steps = (plan?.steps || []).map((step) => {
    const pid = step.partner?.id;
    const account = pid ? loyalty[pid] || loyalty[step.partner?.name?.toLowerCase?.()] : '';
    return {
      ...step,
      sharedAccount: account || '(set shared loyalty #)',
      splitNote: step.program
        ? `${household.player1Label} UR + ${household.player2Label} MR → same ${step.partner?.name} account`
        : '',
    };
  });

  return { plan, steps, loyalty, hw };
}

export function activeTransferBonuses(feed) {
  return (feed?.transferBonuses || []).concat(
    (feed?.docAlerts || []).filter((d) => d.type === 'transfer_bonus'),
  );
}

export function poolingMatrixRows() {
  return Object.values(POOLING_MATRIX);
}