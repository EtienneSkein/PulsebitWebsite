import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const page = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // Multi-page app: no SPA history fallback, every .html is a real entry.
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        // Root entry
        index: page('./index.html'),

        // Real pages
        agency: page('./pages/agency.html'),
        lab: page('./pages/lab.html'),
        privacy: page('./pages/privacy.html'),
        terms: page('./pages/terms.html'),
        workWithUs: page('./pages/work-with-us.html'),

        // Root-level redirect stubs, kept so existing links keep resolving
        agencyRedirect: page('./agency.html'),
        labRedirect: page('./lab.html'),
        privacyRedirect: page('./privacy.html'),
        termsRedirect: page('./terms.html'),
        workWithUsRedirect: page('./work-with-us.html'),
      },
    },
  },
});
