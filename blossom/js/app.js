/** App orchestration: screens, auth UI, day modal */
window.BlossomApp = (function () {
  let state = null;
  let userId = null;

  async function boot() {
    try {
    await BlossomAuth.init();
    BlossomAuth.onChange(async (session) => {
      const prevUser = userId;
      userId = session?.user?.id || null;
      updateAuthUi();
      if (userId && userId !== prevUser) {
        const loaded = await BlossomSave.load(userId);
        if (loaded?.name) {
          state = loaded;
          if (document.querySelector('[data-screen="game"]')?.hidden === false) {
            document.getElementById('playerName').textContent = state.name;
            BlossomGame.updateHud?.();
          }
        }
      }
      if (userId && state) await BlossomSave.persist(state, userId);
    });
    updateAuthUi();

    const params = new URLSearchParams(location.search);
    if (params.get('screen') === 'create') {
      BlossomSave.clearLocal();
      showScreen('create');
      history.replaceState(null, '', location.pathname + location.hash);
      return;
    }

    const saved = await BlossomSave.load(BlossomAuth.getUserId());
    if (saved?.name) {
      state = saved;
      startGame();
    } else {
      showScreen('create');
    }
    } catch (err) {
      console.error('Blossom boot failed:', err);
      window.BlossomBoot?.hideLoad?.();
      showScreen('create');
    }
  }

  function showScreen(id) {
    document.querySelectorAll('[data-screen]').forEach((el) => {
      el.hidden = el.dataset.screen !== id;
    });
    document.body.classList.toggle('blossom-playing', id === 'game');
    document.body.classList.toggle('blossom-create', id === 'create');
    document.querySelector('.game-shell')?.classList.toggle('is-playing', id === 'game');
  }

  function updateAuthUi() {
    const badge = document.getElementById('authBadge');
    const cloudNote = document.getElementById('cloudNote');
    if (!badge) return;
    if (BlossomAuth.isLoggedIn()) {
      badge.textContent = BlossomAuth.getEmail() || 'Signed in';
      badge.className = 'auth-badge auth-badge--on';
    } else {
      badge.textContent = 'Guest';
      badge.className = 'auth-badge';
    }
    if (cloudNote) {
      if (window.BLOSSOM_CONFIG.cloudEnabled) {
        cloudNote.hidden = true;
      } else {
        cloudNote.hidden = false;
        cloudNote.textContent = 'Cloud saves: paste your Supabase anon key in config.js (see API settings).';
      }
    }
  }

  function getCreatePreviewData(form) {
    const fd = new FormData(form);
    const avatar = BlossomAvatar.parseCreateForm(fd);
    const glasses = fd.get('glasses')?.toString() || 'none';
    const wardrobe = BlossomAvatar.defaultWardrobe();
    wardrobe.equipped.accessory = glasses === 'none' ? 'acc_none' : `acc_${glasses}`;
    return { avatar, wardrobe };
  }

  function restartCharacter() {
    const saved = BlossomSave.loadLocal();
    if (saved?.name && !window.confirm('Start a new character? Your save on this device will be erased.')) return;
    BlossomSave.clearLocal();
    location.href = `${location.pathname}?screen=create`;
  }

  function refreshCreatePreview() {
    const form = document.getElementById('createForm');
    const preview = document.getElementById('avatarPreview');
    if (!form || !preview) return;
    const { avatar, wardrobe } = getCreatePreviewData(form);
    BlossomAvatar.drawPreview(preview, avatar, wardrobe);
  }

  function initCreateForm() {
    const form = document.getElementById('createForm');

    form?.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', refreshCreatePreview);
      el.addEventListener('change', refreshCreatePreview);
    });

    refreshCreatePreview();
    requestAnimationFrame(function tick() {
      if (!document.querySelector('[data-screen="create"]')?.hidden) {
        refreshCreatePreview();
        requestAnimationFrame(tick);
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        const fd = new FormData(form);
        state = BlossomSave.defaultState();
        state.name = fd.get('name')?.toString().trim() || 'Blossom';
        state.lifeStage = fd.get('lifeStage')?.toString() || 'child';
        state.avatar = BlossomAvatar.parseCreateForm(fd);
        state.wardrobe = BlossomAvatar.defaultWardrobe();
        const glasses = fd.get('glasses')?.toString() || 'none';
        if (glasses !== 'none') {
          const accId = `acc_${glasses}`;
          state.wardrobe.equipped.accessory = accId;
          if (!state.wardrobe.owned.includes(accId)) state.wardrobe.owned.push(accId);
        }
        state.careerPath = fd.get('careerPath')?.toString() || 'salon';
        state.hired = false;
        state.bonnieOfferSeen = false;
        state.jobRank = 0;
        BlossomAvatar.migrate(state);
        startGame();
        const saved = await BlossomSave.persist(state, BlossomAuth.getUserId());
        if (!saved.localOk) showToast('Could not save locally — try again', 'warn');
      } catch (err) {
        console.error('Create form failed:', err);
        showToast('Could not start — try again', 'bad');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function syncSoundUi() {
    const on = state?.soundOn !== false;
    const btn = document.getElementById('soundToggle');
    if (btn) {
      btn.textContent = on ? '🔊' : '🔇';
      btn.title = on ? 'Sound on' : 'Sound off';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    window.BlossomAudio?.setEnabled(on);
  }

  function startGame() {
    showScreen('game');
    document.getElementById('playerName').textContent = state.name;
    syncSoundUi();
    BlossomGame.init(
      document.getElementById('gameCanvas'),
      state,
      {
        onMessage: showToast,
        onPersist: async (s) => { state = s; await BlossomSave.persist(s, BlossomAuth.getUserId()); },
      }
    );
    BlossomGame.updateHud();
    const bubble = document.getElementById('npcBubble');
    if (bubble) {
      const cp = BlossomCareer.path(state);
      bubble.textContent = state.lifeStage === 'child'
        ? `${cp.playLabel} at your dream spot · green exit for outdoor chores`
        : `Level ${BlossomCareer.BONNIE_LEVEL}: Bonnie hires on Main street · ${cp.workLabel} afternoons`;
    }
    BlossomGame.checkBonnieOffer?.();
    nudgeFirstDayGuide(state);
    window.BlossomToday?.renderCard?.(state);
    requestAnimationFrame(() => {
      window.BlossomGame?.resize?.();
      requestAnimationFrame(() => window.BlossomGame?.resize?.());
    });
    const cvs = document.getElementById('gameCanvas');
    setTimeout(() => cvs?.focus?.({ preventScroll: true }), 200);
  }

  function nudgeFirstDayGuide(st) {
    if (!st || st.guideWelcomeSeen || st.day > 1) return;
    st.guideWelcomeSeen = true;
    st.guideDismissed = false;
    if (st.guideExpanded == null) st.guideExpanded = false;
    BlossomGuide.updatePanel(st);
    BlossomSave.persist(st, BlossomAuth.getUserId());

  }

  function shareGame() {
    const url = 'https://seanaguinaga.com/blossom/play.html';
    const text = 'Play Blossom Life — 3D Huntington Beach open world!';
    if (navigator.share) {
      navigator.share({ title: 'Blossom Life', text, url }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(url).then(() => {
      showToast('Link copied — share Blossom Life!', 'good');
    }).catch(() => showToast(url, 'info'));
  }

  function showStarGuide() {
    if (!state) return;
    state.guideDismissed = false;
    state = BlossomGuide.openModal(state) || state;
    BlossomSave.persist(state, BlossomAuth.getUserId());
  }

  function showBonnieModal(offer) {
    const modal = document.getElementById('bonnieModal');
    if (!modal) return;
    document.getElementById('bonnieModalTitle').textContent = offer.title;
    document.getElementById('bonnieModalBody').textContent = offer.body;
    const btn = document.getElementById('bonnieAccept');
    if (btn) btn.textContent = offer.accept;
    setModalOpen(modal, true);
  }



  function showToast(msg, type = 'info') {
    const el = document.getElementById('gameToast');
    if (!el) return;
    el.textContent = msg;
    el.className = `game-toast game-toast--${type} game-toast--show`;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      el.classList.remove('game-toast--show');
      setTimeout(() => { el.hidden = true; }, 300);
    }, 3500);
  }

  function showTravelBanner(name, locId, rewardSub) {
    const el = document.getElementById('travelBanner');
    const text = document.getElementById('travelBannerText');
    const sub = document.getElementById('travelBannerSub');
    if (!el || !text) return;
    text.textContent = name;
    const hb = BlossomHBLocal?.loc?.(locId);
    if (sub) sub.textContent = rewardSub || hb?.blurb || '';
    if (locId) el.dataset.zone = locId;
    else delete el.dataset.zone;
    el.hidden = false;
    el.classList.remove('travel-banner--show');
    void el.offsetWidth;
    el.classList.add('travel-banner--show');
    clearTimeout(showTravelBanner._t);
    showTravelBanner._t = setTimeout(() => {
      el.classList.remove('travel-banner--show');
      setTimeout(() => { el.hidden = true; }, 500);
    }, 2200);
  }

  function showDayModal(result) {
    const modal = document.getElementById('dayModal');
    if (!modal) return;
    document.getElementById('dayModalTitle').textContent = result.title;
    document.getElementById('dayModalBody').textContent = result.body;
    setModalOpen(modal, true);
  }

  function initGameUi() {
    document.getElementById('endDayBtn')?.addEventListener('click', () => {
      const result = BlossomGame.endDay();
      window.BlossomAudio?.playSfx(result.success ? 'dayWin' : 'dayFail');
      if (result.success) {
        window.BlossomFx?.confetti();
        window.BlossomFx?.screenFlash('#4ade80', 0.45);
      }
      showDayModal(result);
      BlossomGame.updateHud();
    });
    document.getElementById('dayModalClose')?.addEventListener('click', () => {
      setModalOpen(document.getElementById('dayModal'), false);
    });
    document.getElementById('bonnieAccept')?.addEventListener('click', () => {
      BlossomGame.onBonnieAccepted?.();
      setModalOpen(document.getElementById('bonnieModal'), false);
      window.BlossomAudio?.playSfx('dayWin');
    });
    document.getElementById('bonnieLater')?.addEventListener('click', () => {
      setModalOpen(document.getElementById('bonnieModal'), false);
    });
    document.getElementById('guideHelpBtn')?.addEventListener('click', () => showStarGuide());
    document.getElementById('questChip')?.addEventListener('click', () => showStarGuide());
    document.getElementById('guideModalClose')?.addEventListener('click', () => {
      if (!state) return;
      state = BlossomGuide.closeModal(state) || state;
      BlossomSave.persist(state, BlossomAuth.getUserId());
    });
    document.getElementById('guideModal')?.addEventListener('click', (e) => {
      if (e.target.id !== 'guideModal') return;
      if (!state) return;
      state = BlossomGuide.closeModal(state) || state;
      BlossomSave.persist(state, BlossomAuth.getUserId());
    });
    document.getElementById('guideDismiss')?.addEventListener('click', () => {
      if (!state) return;
      state.guideDismissed = true;
      state = BlossomGuide.closeModal(state) || state;
      BlossomGuide.updatePanel(state);
      BlossomSave.persist(state, BlossomAuth.getUserId());
    });
    document.getElementById('shareBtn')?.addEventListener('click', shareGame);
    document.getElementById('passportBtn')?.addEventListener('click', () => {
      if (state) window.BlossomPassport?.renderModal?.(state);
    });
    document.getElementById('passportClose')?.addEventListener('click', () => {
      window.BlossomPassport?.closeModal?.();
    });
    document.getElementById('todayCardDismiss')?.addEventListener('click', () => {
      const el = document.getElementById('todayCard');
      if (el) el.hidden = true;
    });
    document.getElementById('soundToggle')?.addEventListener('click', async () => {
      await window.BlossomAudio?.unlock();
      state.soundOn = !state.soundOn;
      syncSoundUi();
      window.BlossomAudio?.playSfx('ui');
      if (state) BlossomSave.persist(state, BlossomAuth.getUserId());
    });
  }

  function setModalOpen(modal, open) {
    if (!modal) return;
    if (!open) {
      const active = document.activeElement;
      if (active && modal.contains(active)) active.blur();
    }
    modal.hidden = !open;
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function closeAuthModal() {
    setModalOpen(document.getElementById('authModal'), false);
  }

  function openAuthModal() {
    setModalOpen(document.getElementById('authModal'), true);
  }

  function playAsGuest() {
    closeAuthModal();
    if (!state?.name) {
      showScreen('create');
      showToast('Create a character — progress saves on this device', 'info');
      return;
    }
    showToast('Playing as guest — saved on this device', 'good');
  }

  function initAuthModals() {
    const authModal = document.getElementById('authModal');

    document.getElementById('openAuth')?.addEventListener('click', openAuthModal);
    document.getElementById('openAuthGame')?.addEventListener('click', openAuthModal);
    document.getElementById('newCharacterBtn')?.addEventListener('click', restartCharacter);
    document.getElementById('newCharacterLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      restartCharacter();
    });
    document.getElementById('authClose')?.addEventListener('click', closeAuthModal);
    document.getElementById('authGuest')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      playAsGuest();
    });

    authModal?.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });
    authModal?.querySelector('.modal-card')?.addEventListener('click', (e) => e.stopPropagation());

    document.getElementById('authForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = fd.get('email')?.toString() || '';
      const password = fd.get('password')?.toString() || '';
      const mode = fd.get('mode')?.toString();
      try {
        if (!window.BLOSSOM_CONFIG.cloudEnabled) {
          showToast('Add Supabase URL + key in config.js first', 'warn');
          return;
        }
        if (mode === 'signup') await BlossomAuth.signUp(email, password);
        else await BlossomAuth.signIn(email, password);
        const uid = BlossomAuth.getUserId();
        if (state && uid) {
          state = await BlossomSave.load(uid);
          await BlossomSave.persist(state, uid);
        }
        showToast('Cloud save connected!', 'good');
        closeAuthModal();
      } catch (err) {
        showToast(err.message || 'Auth failed', err.confirmationRequired ? 'info' : 'bad');
      }
    });

    document.getElementById('authSignOut')?.addEventListener('click', async () => {
      await BlossomAuth.signOut();
      closeAuthModal();
      showToast('Signed out — progress still on this device', 'info');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCreateForm();
    initGameUi();
    initAuthModals();
    boot();
  });

  function setGuideExpanded(val) {
    if (state) state.guideExpanded = Boolean(val);
  }

  return {
    showDayModal,
    showBonnieModal,
    showTravelBanner,
    showToast,
    nudgeFirstDayGuide,
    shareGame,
    setGuideExpanded,
    restartCharacter,
    boot,
  };
})();