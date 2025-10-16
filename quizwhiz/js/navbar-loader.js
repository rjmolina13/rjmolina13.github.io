/**
 * Navbar Loader (Supabase-ready, path-agnostic)
 * - Works for /pages/* and for root pages like /index.html
 * - Hooks into AuthManager (Supabase) if present
 */
class NavbarLoader {
  constructor() {
    this.currentPage = this.getCurrentPageName();
  }

  getCurrentPageName() {
    const p = location.pathname.split('/').pop() || 'home.html';
    return p.replace('.html', '') || 'home';
  }

  async fetchNavbarHTML() {
    // Try several candidate URLs until one works, in order of likelihood
    const candidates = [];

    // If page is under /pages/, the existing relative path is valid
    if (location.pathname.includes('/pages/')) {
      candidates.push('../components/navbar.html');
    }

    // Common fallbacks (absolute and relative)
    candidates.push('/components/navbar.html');
    candidates.push('components/navbar.html');
    candidates.push('./components/navbar.html');

    // Deduplicate while preserving order
    const seen = new Set();
    const urls = candidates.filter(u => (seen.has(u) ? false : seen.add(u)));

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) return await res.text();
      } catch (_) {
        /* try next */
      }
    }
    throw new Error('[NavbarLoader] Unable to fetch components/navbar.html from any candidate path.');
  }

  highlightActive() {
    // Remove existing actives
    document.querySelectorAll('.nav-btn.active')
      .forEach(b => b.classList.remove('active'));
    // Mark current
    const btn = document.querySelector(`[data-page="${this.currentPage}"]`);
    if (btn) btn.classList.add('active');
  }

  setupMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu   = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open', !expanded);
    });
  }

  setupNavigation() {
    // If you use a Router (SPA), prefer Router.navigateTo; else do hard navigations
    const hasRouter = typeof window.Router !== 'undefined';

    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = btn.getAttribute('data-page') || 'home';
        if (hasRouter && window.router) {
          window.router.navigateTo(page, true);
        } else {
          // Compute proper destination regardless of depth
          const inPages = location.pathname.includes('/pages/');
          const dest = inPages ? `${page}.html` : `pages/${page}.html`;
          location.href = dest;
        }
      });
    });
  }

  async initAuthUI(root) {
    // Wire up login/register buttons, and flip UI when auth state changes
    const apply = async () => {
      try {
        // Wait for auth manager to be available with retry logic
        const maxRetries = 10;
        let retryCount = 0;
        
        const waitForAuthManager = () => {
          return new Promise((resolve, reject) => {
            const checkAuthManager = () => {
              if (window.app && window.app.authManager) {
                resolve(window.app.authManager);
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`⏳ Waiting for auth manager... (${retryCount}/${maxRetries})`);
                  setTimeout(checkAuthManager, 100);
                } else {
                  reject(new Error('Auth manager not available after retries'));
                }
              }
            };
            checkAuthManager();
          });
        };
        
        // If you expose an AuthManager (Supabase-backed), reuse it
        if (window.app?.authManager) {
          window.app.authManager.updateAuthUI?.(root);
        } else if (typeof window.AuthManager !== 'undefined') {
          const am = window.app?.authManager || new window.AuthManager(window.app);
          window.app.authManager = am;
          am.initialize?.();
          
          // Wait for auth manager to be ready
          const authManager = await waitForAuthManager();
          authManager.updateAuthUI?.(root);
          
          // Ensure dropdown is properly initialized after a short delay
          setTimeout(() => {
            if (authManager.setupUserDropdown) {
              authManager.setupUserDropdown();
              console.log('🔧 User dropdown re-initialized for reliability');
            }
          }, 200);
          
          console.log('✅ Auth UI initialized via NavbarLoader');
        }
      } catch (err) {
        console.warn('[NavbarLoader] Auth UI init warning:', err);
      }
    };

    await apply();
    document.addEventListener('auth:changed', apply); // Supabase auth flip
  }

  async loadNavbar(containerId = 'navbar-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[NavbarLoader] No #${containerId} on this page; skipping navbar.`);
      return null;
    }

    const html = await this.fetchNavbarHTML();
    container.innerHTML = html;

    // After injection, wire behaviors
    this.setupMobileMenu();
    this.setupNavigation();
    this.highlightActive();
    await this.initAuthUI(container);

    return container;
  }

  /**
   * Initialize auth UI after navbar is loaded
   */
  static async initAuthUI() {
    const maxRetries = 50; // 5 seconds max wait
    let retries = 0;
    
    const waitForAuthManager = () => {
      return new Promise((resolve) => {
        const checkAuthManager = () => {
          const am = window.app?.authManager;
          if (am && typeof am.initialize === 'function') {
            window.debugLog?.info('navbar', 'AuthManager found, initializing auth UI...');
            am.initialize?.().then(() => {
              window.debugLog?.info('navbar', 'AuthManager initialization completed');
              resolve(true);
            }).catch(error => {
              window.debugLog?.error('navbar', 'AuthManager initialization failed:', error);
              resolve(false);
            });
            return;
          }
          
          retries++;
          if (retries >= maxRetries) {
            window.debugLog?.warn('navbar', 'AuthManager not available after maximum retries');
            resolve(false);
            return;
          }
          
          setTimeout(checkAuthManager, 100);
        };
        checkAuthManager();
      });
    };
    
    await waitForAuthManager();
  }

  static async load(containerId = 'navbar-container') {
    const loader = new NavbarLoader();
    return loader.loadNavbar(containerId);
  }
}

// Expose globally (your pages load this via <script src="../js/navbar-loader.js">)
window.NavbarLoader = NavbarLoader;