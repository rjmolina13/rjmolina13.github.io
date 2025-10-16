// js/theme-manager.js
(function (w) {
  const LS_KEY = 'qw_theme'; // 'auto' | 'light' | 'dark'
  const DEFAULT = 'auto';

  const getSystemPref = () =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const applyTheme = (mode) => {
    const root = document.documentElement;
    root.dataset.theme = mode; // if you use [data-theme="dark"] in CSS
    // OR toggle classes if that's your system:
    root.classList.remove('theme-light','theme-dark');
    if (mode === 'dark') root.classList.add('theme-dark');
    if (mode === 'light') root.classList.add('theme-light');
  };

  const effective = (stored) => (stored === 'auto' || !stored) ? getSystemPref() : stored;

  const get = () => localStorage.getItem(LS_KEY) || DEFAULT;
  const set = (mode) => { localStorage.setItem(LS_KEY, mode); applyTheme(effective(mode)); };

  // initial paint: default to AUTO
  const init = () => applyTheme(effective(get()));

  // react to system changes when in auto
  const mm = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (mm) mm.addEventListener?.('change', () => {
    if ((localStorage.getItem(LS_KEY) || DEFAULT) === 'auto') init();
  });

  w.ThemeManager = { init, get, set, DEFAULT };
  document.addEventListener('DOMContentLoaded', init);
})(window);