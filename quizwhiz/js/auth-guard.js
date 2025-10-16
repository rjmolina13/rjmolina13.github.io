// auth-guard.js
(function (w) {
  const CARD_HTML = (msg) => `
    <div class="card p-4 max-w-xl mx-auto mt-10">
      <h2 class="h5 mb-2">Please sign in</h2>
      <p class="text-muted mb-4">${msg || "You need to log in or register to access this page."}</p>
      <div class="flex gap-2">
        <button id="guardLogin" class="btn btn-primary">Login</button>
        <button id="guardRegister" class="btn btn-outline-primary">Register</button>
      </div>
    </div>`;

  function ensureShell(root) {
    if (root.dataset.guardApplied) return root;
    const content = document.createElement('div');     // original page
    const gate    = document.createElement('div');     // login card
    content.className = 'guard-content';
    gate.className    = 'guard-gate';
    while (root.firstChild) content.appendChild(root.firstChild);
    root.appendChild(content); root.appendChild(gate);
    root.dataset.guardApplied = '1';
    return root;
  }

  function showGate(root, message) {
    const gate = root.querySelector('.guard-gate');
    const content = root.querySelector('.guard-content');
    if (!gate || !content) return;
    gate.innerHTML = CARD_HTML(message);
    content.style.display = 'none';
    gate.style.display = '';
    gate.querySelector('#guardLogin')?.addEventListener('click', () => w.app?.authManager?.showLoginModal?.());
    gate.querySelector('#guardRegister')?.addEventListener('click', () => w.app?.authManager?.showRegisterModal?.());
  }

  function showContent(root) {
    const gate = root.querySelector('.guard-gate');
    const content = root.querySelector('.guard-content');
    if (!gate || !content) return;
    gate.style.display = 'none';
    content.style.display = '';
  }

  function protect(selector, renderAuthedFn, message) {
    const root = (typeof selector === 'string') ? document.querySelector(selector) : selector;
    if (!root) return;
    ensureShell(root);

    const safeRenderAuthed = (typeof renderAuthedFn === 'function') ? renderAuthedFn : null;

    const render = () => {
      const authed = !!w.app?.authManager?.currentUser;
      if (authed) {
        showContent(root);
        // call user code only if it exists
        safeRenderAuthed?.(root.querySelector('.guard-content'));
      } else {
        showGate(root, message);
      }
    };

    // first paint, then listen for state changes
    render();
    w.app?.authManager?.ready?.then(render);
    document.addEventListener('auth:changed', render);
  }

  w.AuthGuard = { protect };
})(window);