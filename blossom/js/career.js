/** Careers — salon, stage, studio, life coaching & training */
window.BlossomCareer = (function () {
  const PATHS = {
    salon: {
      id: 'salon',
      label: 'Salon helper',
      emoji: '💇',
      tagline: 'Sweep hair, greet guests, bloom behind the chair.',
      workLabel: 'Work shift',
      playLabel: 'Play salon',
    },
    broadway: {
      id: 'broadway',
      label: 'Broadway star',
      emoji: '🎭',
      tagline: 'Rehearse, audition, and shine on the harbor stage.',
      workLabel: 'Rehearsal shift',
      playLabel: 'Play stage',
    },
    tiktoker: {
      id: 'tiktoker',
      label: 'TikToker',
      emoji: '📱',
      tagline: 'Film clips, hit your marks, grow your followers.',
      workLabel: 'Film shift',
      playLabel: 'Play studio',
    },
    coach: {
      id: 'coach',
      label: 'Life coach',
      emoji: '🌱',
      tagline: 'Listen deeply, guide goals, help neighbors bloom.',
      workLabel: 'Coaching session',
      playLabel: 'Play coach',
    },
    trainer: {
      id: 'trainer',
      label: 'Personal trainer',
      emoji: '💪',
      tagline: 'Lead warm-ups, cheer reps, build harbor strength.',
      workLabel: 'Training shift',
      playLabel: 'Play gym',
    },
  };

  const SALON_RANKS = [
    { id: 'reception', label: 'Reception', pay: 3, stars: 4, shiftsToPromote: 3 },
    { id: 'shampoo', label: 'Shampoo assistant', pay: 4, stars: 5, shiftsToPromote: 3 },
    { id: 'stylist', label: 'Stylist', pay: 6, stars: 6, shiftsToPromote: 99 },
  ];

  const COACH_RANKS = [
    { id: 'listener', label: 'Active listener', pay: 3, stars: 4, shiftsToPromote: 3 },
    { id: 'guide', label: 'Session guide', pay: 5, stars: 5, shiftsToPromote: 3 },
    { id: 'lead', label: 'Lead coach', pay: 7, stars: 6, shiftsToPromote: 99 },
  ];

  const TRAINER_RANKS = [
    { id: 'assistant', label: 'Floor assistant', pay: 3, stars: 4, shiftsToPromote: 3 },
    { id: 'class', label: 'Class helper', pay: 5, stars: 5, shiftsToPromote: 3 },
    { id: 'lead', label: 'Lead trainer', pay: 7, stars: 6, shiftsToPromote: 99 },
  ];

  const CAREER_RANKS = {
    salon: SALON_RANKS,
    coach: COACH_RANKS,
    trainer: TRAINER_RANKS,
  };

  const BONNIE_LEVEL = 3;

  const QUINN = {
    lifeGame: 'It\'s a game where it\'s like a life game… start off with 10 dollars… get stars for completing a full day… 50 stars.',
    bonnieHire: 'You bloomed to level 3! I\'m Bonnie — I run the salon. Want to get hired?',
    bonnieBroadway: 'Bonnie: The harbor stage needs your sparkle. Ready to rehearse for real?',
    bonnieTiktok: 'Bonnie: Everyone\'s filming these days — want to get paid for your clips?',
    bonnieCoach: 'Bonnie: Harbor Wellness is hiring warm hearts. Ready to coach for real?',
    bonnieTrainer: 'Bonnie: The park gym needs your energy. Ready to train clients?',
    playSalon: 'Pretend shift! No bills — just play and earn a few stars.',
    needWork: 'Adults need a work shift today — head to your job in the afternoon!',
    broke: 'You\'re short on cash after bills. Work a shift or pick cheaper meals!',
  };

  function path(state) {
    return PATHS[state.careerPath || 'salon'] || PATHS.salon;
  }

  function isChild(state) {
    return state.lifeStage === 'child';
  }

  function isAdult(state) {
    return state.lifeStage === 'adult';
  }

  function careerRank(state) {
    const ranks = CAREER_RANKS[state.careerPath] || SALON_RANKS;
    const idx = Math.min(state.jobRank || 0, ranks.length - 1);
    return ranks[idx];
  }

  function salonRank(state) {
    return careerRank(state);
  }

  function hasRankLadder(state) {
    return Boolean(CAREER_RANKS[state.careerPath]);
  }

  function isHired(state) {
    return Boolean(state.hired);
  }

  function shouldOfferBonnie(state) {
    return state.level >= BONNIE_LEVEL && !state.bonnieOfferSeen;
  }

  function bonnieOffer(state) {
    const p = path(state);
    if (p.id === 'salon') {
      return {
        title: 'Bonnie at the salon',
        body: `${QUINN.bonnieHire}\n\n"${QUINN.lifeGame}" — Quinn`,
        accept: 'Get hired at reception',
      };
    }
    if (p.id === 'broadway') {
      return { title: 'Bonnie believes in you', body: QUINN.bonnieBroadway, accept: 'Start paid rehearsals' };
    }
    if (p.id === 'tiktoker') {
      return { title: 'Bonnie has an idea', body: QUINN.bonnieTiktok, accept: 'Start paid filming' };
    }
    if (p.id === 'coach') {
      return { title: 'Bonnie sees your gift', body: QUINN.bonnieCoach, accept: 'Start coaching sessions' };
    }
    if (p.id === 'trainer') {
      return { title: 'Bonnie spots your grit', body: QUINN.bonnieTrainer, accept: 'Start training shifts' };
    }
    return { title: 'Bonnie at the salon', body: QUINN.bonnieHire, accept: 'Get hired' };
  }

  function acceptBonnieOffer(state) {
    state.bonnieOfferSeen = true;
    state.hired = true;
    state.jobRank = 0;
    state.shiftsAtRank = 0;
    return { ok: true, msg: `You're hired! ${path(state).emoji} ${path(state).label} path unlocked.` };
  }

  function canWorkShift(state) {
    const phase = BlossomDay.currentPhase(state);
    if (phase.id !== 'afternoon' && phase.id !== 'evening') {
      return { ok: false, msg: 'Work shifts open in the afternoon and evening.' };
    }
    if (state.workedToday) return { ok: false, msg: 'You already worked today!' };
    if (isAdult(state) && !isHired(state) && state.level >= BONNIE_LEVEL) {
      return { ok: false, msg: 'Talk to Bonnie at the salon first!' };
    }
    if (isAdult(state) && state.level < BONNIE_LEVEL) {
      return { ok: false, msg: `Keep blooming — Bonnie hires at level ${BONNIE_LEVEL}.` };
    }
    return { ok: true };
  }

  function canPlayPretend(state) {
    if (!isChild(state)) return { ok: false, msg: 'Only kids get pretend play shifts!' };
    if (state.playedToday) return { ok: false, msg: 'You already played work today!' };
    return { ok: true };
  }

  function workSiteFor(state) {
    const p = path(state);
    if (p.id === 'salon') return { loc: 'street', kind: 'shop', shop: 'salon' };
    if (p.id === 'broadway') return { loc: 'park', kind: 'stage' };
    if (p.id === 'tiktoker') return { loc: 'house', kind: 'studio' };
    if (p.id === 'coach') return { loc: 'street', kind: 'shop', shop: 'wellness' };
    if (p.id === 'trainer') return { loc: 'park', kind: 'gym' };
    return { loc: 'street', kind: 'shop', shop: 'salon' };
  }

  function completeShift(state, score, pretend) {
    const rank = careerRank(state);
    const perfect = score >= 3;
    const pay = pretend ? 1 : rank.pay + (perfect ? 1 : 0);
    const stars = pretend ? 2 : rank.stars + (perfect ? 2 : 0);

    state.money += pay;
    state.stars += stars;
    if (pretend) {
      state.playedToday = true;
    } else {
      state.workedToday = true;
      state.shiftsAtRank = (state.shiftsAtRank || 0) + 1;
      const ranks = CAREER_RANKS[state.careerPath];
      if (ranks && state.shiftsAtRank >= rank.shiftsToPromote && state.jobRank < ranks.length - 1) {
        state.jobRank += 1;
        state.shiftsAtRank = 0;
        return {
          ok: true,
          promoted: true,
          msg: `Shift done! +$${pay}, +${stars} stars. Promoted to ${careerRank(state).label}!`,
          pay,
          stars,
        };
      }
    }
    return { ok: true, msg: `Shift done! +$${pay}, +${stars} stars.`, pay, stars };
  }

  function applyMorningBills(state) {
    const cfg = window.BLOSSOM_CONFIG;
    if (!isAdult(state)) return { ok: true, deducted: 0, msg: '' };

    let deducted = cfg.rentDaily + cfg.utilitiesDaily;
    state.money -= deducted;
    let weeklyNote = '';
    if (state.day > 0 && state.day % cfg.weeklyBillEvery === 0) {
      state.money -= cfg.weeklyBill;
      deducted += cfg.weeklyBill;
      weeklyNote = ` Weekly bill $${cfg.weeklyBill} too.`;
    }
    if (state.money < 0) {
      return {
        ok: false,
        deducted,
        msg: `${QUINN.broke} (Bills: $${deducted}.${weeklyNote})`,
      };
    }
    return {
      ok: true,
      deducted,
      msg: `Bills paid: $${deducted}.${weeklyNote}`,
    };
  }

  function adultDayRequirements(state) {
    if (!isAdult(state)) return { ok: true };
    if (!state.workedToday && state.level >= BONNIE_LEVEL && isHired(state)) {
      return { ok: false, msg: QUINN.needWork };
    }
    if (state.money < 0) return { ok: false, msg: QUINN.broke };
    return { ok: true };
  }

  function resetDailyCareer(state) {
    state.workedToday = false;
    state.playedToday = false;
  }

  function rankLabel(state) {
    if (hasRankLadder(state) && isHired(state)) return careerRank(state).label;
    if (isHired(state)) return path(state).label;
    return isChild(state) ? 'Dreamer' : 'Looking for work';
  }

  return {
    PATHS,
    SALON_RANKS,
    COACH_RANKS,
    TRAINER_RANKS,
    CAREER_RANKS,
    QUINN,
    BONNIE_LEVEL,
    path,
    isChild,
    isAdult,
    careerRank,
    salonRank,
    hasRankLadder,
    isHired,
    shouldOfferBonnie,
    bonnieOffer,
    acceptBonnieOffer,
    canWorkShift,
    canPlayPretend,
    workSiteFor,
    completeShift,
    applyMorningBills,
    adultDayRequirements,
    resetDailyCareer,
    rankLabel,
  };
})();