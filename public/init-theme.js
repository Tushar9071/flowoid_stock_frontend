/**
 * init-theme.js
 * =============
 * Injected in <head> BEFORE any CSS loads to prevent flash of unstyled content.
 * Reads 'dashboard-theme' from localStorage and applies the class to <body>.
 *
 * Valid values: 'theme-ocean' | 'theme-forest' | 'theme-royal' | 'theme-ember'
 * Anything else (including null/undefined) leaves <body> class-free → default theme.
 */
(function () {
  const VALID_THEMES = ['theme-emerald', 'theme-indigo', 'theme-orange', 'theme-teal', 'theme-custom'];
  try {
    const saved = localStorage.getItem('dashboard-theme');
    const customColor = localStorage.getItem('dashboard-custom-color');

    if (saved && VALID_THEMES.includes(saved)) {
      const apply = () => {
        document.body.classList.add(saved);
        if (saved === 'theme-custom' && customColor) {
          document.body.style.setProperty('--color-custom-accent', customColor);
        }
      };

      if (document.body) {
        apply();
      } else {
        document.addEventListener('DOMContentLoaded', apply);
      }
    }
  } catch (e) {
    // localStorage may be unavailable in private browsing
  }
})();
