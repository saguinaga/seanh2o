/** Guest play + optional Supabase auth */
window.BlossomAuth = (function () {
  let client = null;
  let session = null;
  let listeners = [];

  function notify() {
    listeners.forEach((fn) => fn(session));
  }

  async function init() {
    if (!window.BLOSSOM_CONFIG.cloudEnabled || !window.supabase) return false;
    client = window.supabase.createClient(
      window.BLOSSOM_CONFIG.supabaseUrl,
      window.BLOSSOM_CONFIG.supabaseAnonKey
    );
    const { data } = await client.auth.getSession();
    session = data.session;
    client.auth.onAuthStateChange((_event, s) => {
      session = s;
      notify();
    });
    return true;
  }

  function onChange(fn) {
    listeners.push(fn);
    fn(session);
  }

  function getUserId() {
    return session?.user?.id || null;
  }

  function getEmail() {
    return session?.user?.email || null;
  }

  function isLoggedIn() {
    return Boolean(session?.user);
  }

  async function signUp(email, password) {
    if (!client) throw new Error('Cloud saves not configured');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    session = data.session;
    notify();
    return data;
  }

  async function signIn(email, password) {
    if (!client) throw new Error('Cloud saves not configured');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    session = data.session;
    notify();
    return data;
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    session = null;
    notify();
  }

  return {
    get client() { return client; },
    init,
    onChange,
    getUserId,
    getEmail,
    isLoggedIn,
    signUp,
    signIn,
    signOut,
  };
})();