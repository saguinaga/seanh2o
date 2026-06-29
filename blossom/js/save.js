/** localStorage + optional Supabase cloud persistence */
window.BlossomSave = (function () {
  const LOCAL_KEY = 'blossom_life_v1';
  const GUEST_KEY = 'blossom_guest_id';

  function defaultState() {
    return {
      version: window.BLOSSOM_CONFIG.gameVersion,
      name: '',
      lifeStage: 'child',
      money: window.BLOSSOM_CONFIG.startMoney,
      stars: 0,
      bonusStars: 0,
      level: 1,
      day: 1,
      fatItemsToday: 0,
      chubby: false,
      sick: false,
      mealsEaten: { breakfast: false, lunch: false, dinner: false },
      choresDone: {},
      todaysChores: [],
      careerPath: 'salon',
      hired: false,
      bonnieOfferSeen: false,
      jobRank: 0,
      shiftsAtRank: 0,
      workedToday: false,
      playedToday: false,
      avatar: {
        skin: '#f5d0a8',
        hair: '#4a3728',
        hairStyle: 'short',
        shirtColor: '#5eead4',
        shirtPattern: null,
        hat: null,
      },
      house: 'small',
      currentLocation: 'house',
      position: { x: 400, y: 360 },
      timeOfDay: 'morning',
      dayPhaseIndex: 0,
      alive: true,
      hasPet: false,
      soundOn: true,
      createdAt: Date.now(),
    };
  }

  function getGuestId() {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = 'guest_' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      return { ...defaultState(), ...JSON.parse(raw) };
    } catch {
      return null;
    }
  }

  function slimState(state) {
    const copy = { ...state, avatar: { ...state.avatar } };
    if (copy.avatar?.shirtPattern?.length > 120000) {
      copy.avatar.shirtPattern = null;
    }
    return copy;
  }

  function saveLocal(state) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(slimState(state)));
      return true;
    } catch (err) {
      console.warn('Local save failed:', err);
      try {
        const fallback = slimState(state);
        fallback.avatar.shirtPattern = null;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(fallback));
        return true;
      } catch {
        return false;
      }
    }
  }

  async function loadCloud(userId) {
    if (!window.BLOSSOM_CONFIG.cloudEnabled || !window.BlossomAuth?.client) return null;
    const { data, error } = await window.BlossomAuth.client
      .from('blossom_saves')
      .select('save_data')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data?.save_data) return null;
    return { ...defaultState(), ...data.save_data };
  }

  async function saveCloud(userId, state) {
    if (!window.BLOSSOM_CONFIG.cloudEnabled || !window.BlossomAuth?.client) return false;
    const { error } = await window.BlossomAuth.client.from('blossom_saves').upsert(
      {
        user_id: userId,
        save_data: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) console.warn('Cloud save failed:', error.message);
    return !error;
  }

  /** Prefer cloud save; upload local guest progress on first login. */
  async function load(userId) {
    const local = loadLocal();
    if (userId) {
      const cloud = await loadCloud(userId);
      if (cloud?.name) return cloud;
      if (local?.name) {
        await saveCloud(userId, local);
        return local;
      }
    }
    return local || defaultState();
  }

  async function persist(state, userId) {
    const localOk = saveLocal(state);
    let cloudOk = true;
    if (userId) cloudOk = await saveCloud(userId, slimState(state));
    return { localOk, cloudOk };
  }

  function clearLocal() {
    localStorage.removeItem(LOCAL_KEY);
  }

  return {
    defaultState,
    getGuestId,
    load,
    persist,
    clearLocal,
    loadLocal,
  };
})();