// js/data-sync.js
(function (w) {
  const db = () => window.db;
const auth = () => window.auth;

  // simple debounce
  const debounce = (fn, ms=400) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms);}};

  // NAMESPACE keys for local cache
  const k = (uid, path) => `qw_cache:${uid || 'anon'}:${path}`;

  // merges local cache into Firestore on login
  const migrateCacheToCloud = async (uid, paths=[]) => {
    if (!uid) return;
    for (const path of paths) {
      const cache = localStorage.getItem(k('anon', path));
      if (!cache) continue;
      try {
        const data = JSON.parse(cache);
        const docRef = window.doc(window.db, 'users', uid, 'pages', path);
        await window.setDoc(docRef, data, { merge: true });
        localStorage.removeItem(k('anon', path));
      } catch (e) { console.warn('[DataSync] migrate failed', path, e); }
    }
  };

  // sanitize path to prevent undefined errors
  const sanitize = (s) => String(s || 'settings').replace(/[^a-zA-Z0-9:_-]/g,'_');

  // generic document binder (page-level)
  const bindDoc = ({ path, onLoad, $write, initial={} }) => {
    // default + sanitize
    path = sanitize(path);
    
    // path example: "flashcards", "content", "quiz:ABC123"
    const normalizePath = (uid) => {
      const pageId = path.replace(/[^a-zA-Z0-9:_-]/g,'_');
      return `users/${uid}/pages/${pageId}`;
    };

    const loadFromCache = (uid) => {
      const raw = localStorage.getItem(k(uid || 'anon', path));
      if (!raw) return initial;
      try { return { ...initial, ...JSON.parse(raw) }; } catch { return initial; }
    };

    const saveToCache = debounce((uid, data) => {
      localStorage.setItem(k(uid || 'anon', path), JSON.stringify(data));
    }, 200);

    const writeCloud = debounce(async (uid, data) => {
      try { 
        const docRef = window.doc(window.db, 'users', uid, 'pages', path);
        await window.setDoc(docRef, data, { merge: true }); 
      }
      catch (e) { console.warn('[DataSync] cloud save failed; caching', e); saveToCache(uid, data); }
    }, 400);

    const current = () => auth()?.currentUser;

    // initial load (cache first)
    const bootstrap = async () => {
      // Wait for Supabase to be ready
      if (typeof window.supabaseClient === 'undefined') {
        await new Promise(resolve => {
          document.addEventListener('supabase-ready', resolve, { once: true });
        });
      }
      const uid = current()?.uid;
      const data = loadFromCache(uid ? uid : 'anon');
      onLoad?.(data);
      // if authed, hydrate from cloud after onLoad so UI shows quickly
      if (uid) {
        const docRef = window.doc(window.db, 'users', uid, 'pages', path);
        window.getDoc(docRef).then(snap => {
          if (snap.exists()) {
            const merged = { ...data, ...snap.data() };
            onLoad?.(merged);
          }
        }).catch(()=>{ /* fall back to cache */});
      }
    };

    // listen to field writes from UI
    const registerWrite = () => {
      $write?.((data) => {
        const uid = current()?.uid;
        // always cache
        saveToCache(uid || 'anon', data);
        // and try cloud when authed
        if (uid) writeCloud(uid, data);
      });
    };

    // on login: migrate anon cache ➜ cloud, then refresh
    document.addEventListener('auth:changed', async (e) => {
      const user = e.detail?.user || null;
      if (user?.uid) {
        await migrateCacheToCloud(user.uid, [path]);
        // refresh from cloud (authoritative)
        // Use modular API through window functions
          const docRef = window.doc(window.db, 'users', user.uid, 'pages', path);
          window.getDoc(docRef).then(snap => {
            if (snap.exists()) onLoad?.(snap.data());
          });
      } else {
        // logged out; keep using anon cache
        onLoad?.(loadFromCache('anon'));
      }
    });

    // Initialize data sync
    bootstrap().catch(console.error);
    registerWrite();
  };

  w.DataSync = { bindDoc };
})(window);