import '../styles/styles.css';

import App from './pages/app.js';
import { isLoggedIn } from './data/api.js';
import { registerServiceWorker } from './utils/sw-register.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
  });

  await app.init();

  // Register Service Worker
  try {
    const registration = await registerServiceWorker();
    if (registration) {
      console.log('Service Worker ready');
    }
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }

  if (window.location.hash === '' || window.location.hash === '#/') {
    if (isLoggedIn()) {
      window.location.hash = '#/home';
    } else {
      window.location.hash = '#/login';
    }
  }
});
