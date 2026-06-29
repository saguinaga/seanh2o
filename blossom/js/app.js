/** App orchestration: screens, auth UI, chat, day modal */
window.BlossomApp = (function () {
  let state = null;
  let userId = null;

  async function boot() {
    await BlossomAuth.init();
    BlossomAuth.onChange(async (session) => {
      userId = session?.user?.id || null;
      updateAuthUi();
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
      cloudNote.hidden = window.BLOSSOM_CONFIG.cloudEnabled;
      cloudNote.textContent = window.BLOSSOM_CONFIG.cloudEnabled
        ? ''
        : 'Cloud saves: add Supabase keys in config.js to sync across devices.';
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
      if (canvas) state.avatar.shirtPattern = canvas.toDataURL('image/png');
      await BlossomSave.persist(state, BlossomAuth.getUserId());
      startGame();
    });
  }

  function startGame() {
    showScreen('game');
    document.getElementById('playerName').textContent = state.name;
    BlossomGame.init(
      document.getElementById('gameCanvas'),
      state,
      {
        onMessage: showToast,
        onPersist: async (s) => { state = s; await BlossomSave.persist(s, BlossomAuth.getUserId()); },
      }
    );
    BlossomGame.updateHud();
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
    modal.hidden = false;
  }

  function initGameUi() {
    document.getElementById('endDayBtn')?.addEventListener('click', () => {
      const result = BlossomGame.endDay();
      showDayModal(result);
      BlossomGame.updateHud();
    });
    document.getElementById('dayModalClose')?.addEventListener('click', () => {
      document.getElementById('dayModal').hidden = true;
    });
    document.getElementById('chatSend')?.addEventListener('click', sendChat);
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChat();
    });
    document.getElementById('soundToggle')?.addEventListener('click', () => {
      state.soundOn = !state.soundOn;
      document.getElementById('soundToggle').textContent = state.soundOn ? '🔊' : '🔇';
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
    showToast(reply, 'info');
    document.getElementById('npcBubble').textContent = reply.split(':')[1]?.trim() || reply;
    input.value = '';
  }

  function initAuthModals() {
    const authModal = document.getElementById('authModal');
    const open = () => { authModal.hidden = false; };
    const close = () => { authModal.hidden = true; };

    document.getElementById('openAuth')?.addEventListener('click', open);
    document.getElementById('openAuthGame')?.addEventListener('click', open);
    document.getElementById('authClose')?.addEventListener('click', close);
    document.getElementById('authGuest')?.addEventListener('click', close);

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
        if (state) await BlossomSave.persist(state, BlossomAuth.getUserId());
        showToast('Cloud save connected!', 'good');
        close();
      } catch (err) {
        showToast(err.message || 'Auth failed', 'bad');
      }
    });

    document.getElementById('authSignOut')?.addEventListener('click', async () => {
      await BlossomAuth.signOut();
      showToast('Signed out — progress still on this device', 'info');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCreateForm();
    initGameUi();
    initAuthModals();
    boot();
  });

  return { showDayModal, showToast, boot };
})();