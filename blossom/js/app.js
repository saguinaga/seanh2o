/** App orchestration: screens, auth UI, chat, day modal */
window.BlossomApp = (function () {
  let state = null;
  let userId = null;

  async function boot() {
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
      return;
    }

    const saved = await BlossomSave.load(BlossomAuth.getUserId());
    if (saved?.name) {
      state = saved;
      startGame();
    } else {
      showScreen('create');
    }
  }

  function showScreen(id) {
    document.querySelectorAll('[data-screen]').forEach((el) => {
      el.hidden = el.dataset.screen !== id;
    });
  }

  function updateAuthUi() {
    const badge = document.getElementById('authBadge');
    const cloudNote = document.getElementById('cloudNote');
    if (!badge) return;
    if (BlossomAuth.isLoggedIn()) {
      badge.textContent = BlossomAuth.getEmail() || 'Signed in';
      badge.className = 'auth-badge auth-badge--on';
    } else {
      badge.textContent = 'Guest · saved on this device';
      badge.className = 'auth-badge';
    }
    if (cloudNote) {
      if (window.BLOSSOM_CONFIG.cloudEnabled) {
        cloudNote.hidden = BlossomAuth.isLoggedIn();
        cloudNote.textContent = BlossomAuth.isLoggedIn()
          ? ''
          : '☁️ Cloud saves ready — tap Account to sign in and sync across devices.';
      } else {
        cloudNote.hidden = false;
        cloudNote.textContent = 'Cloud saves: paste your Supabase anon key in config.js (see API settings).';
      }
    }
  }

  function initCreateForm() {
    const form = document.getElementById('createForm');
    const canvas = document.getElementById('shirtCanvas');
    const ctx = canvas?.getContext('2d');
    let drawing = false;

    if (canvas && ctx) {
      ctx.fillStyle = '#5eead4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const draw = (e) => {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        ctx.fillStyle = document.getElementById('shirtPen')?.value || '#e11d48';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      };
      canvas.addEventListener('mousedown', () => { drawing = true; });
      canvas.addEventListener('mouseup', () => { drawing = false; });
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; draw(e.touches[0]); }, { passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); }, { passive: false });
      canvas.addEventListener('touchend', () => { drawing = false; });
      document.getElementById('clearShirt')?.addEventListener('click', () => {
        ctx.fillStyle = document.getElementById('shirtColor')?.value || '#5eead4';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
    }

    document.getElementById('shirtColor')?.addEventListener('input', (e) => {
      if (!ctx) return;
      ctx.fillStyle = e.target.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      state = BlossomSave.defaultState();
      state.name = fd.get('name')?.toString().trim() || 'Blossom';
      state.lifeStage = fd.get('lifeStage')?.toString() || 'child';
      state.avatar.skin = fd.get('skin')?.toString() || '#f5d0a8';
      state.avatar.hair = fd.get('hair')?.toString() || '#4a3728';
      state.avatar.shirtColor = fd.get('shirtColor')?.toString() || '#5eead4';
      state.careerPath = fd.get('careerPath')?.toString() || 'salon';
      state.hired = false;
      state.bonnieOfferSeen = false;
      state.jobRank = 0;
      if (canvas) {
        try {
          state.avatar.shirtPattern = canvas.toDataURL('image/jpeg', 0.82);
        } catch {
          state.avatar.shirtPattern = null;
        }
      }
      const saved = await BlossomSave.persist(state, BlossomAuth.getUserId());
      if (!saved.localOk) showToast('Could not save locally — try a simpler shirt drawing', 'warn');
      startGame();
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
    window.BlossomAudio?.unlock();
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
    el.className = `game-toast game-toast--${type}`;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { el.hidden = true; }, 3500);
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
    document.getElementById('chatSend')?.addEventListener('click', sendChat);
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChat();
    });
    document.getElementById('soundToggle')?.addEventListener('click', async () => {
      await window.BlossomAudio?.unlock();
      state.soundOn = !state.soundOn;
      syncSoundUi();
      window.BlossomAudio?.playSfx('ui');
      if (state) BlossomSave.persist(state, BlossomAuth.getUserId());
    });
  }

  function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input?.value?.trim();
    if (!text) return;
    const replies = [
      `Mom: "Great job, ${state.name}! Keep going for those stars!"`,
      'Neighbor: "I heard there\'s a café hiring soon!"',
      'Pet: *happy wiggle*',
      'You: *practices for the audition*',
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    window.BlossomAudio?.playSfx('chat');
    showToast(reply, 'info');
    document.getElementById('npcBubble').textContent = reply.split(':')[1]?.trim() || reply;
    input.value = '';
  }

  function setModalOpen(modal, open) {
    if (!modal) return;
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

  return { showDayModal, showBonnieModal, showToast, boot };
})();