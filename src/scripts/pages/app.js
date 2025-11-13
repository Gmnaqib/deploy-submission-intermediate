import routes from '../routes/routes.js';
import { getActiveRoute } from '../routes/url-parser.js';
import { isLoggedIn, getCurrentUser, logout } from '../data/api.js';
import NotificationToggle from '../utils/notification-toggle.js';

class App {
  #content = null;
  #header = null;

  constructor({ content }) {
    this.#content = content;
    this.#header = document.getElementById('app-header');
    this.currentPage = null;
    this.notificationToggle = new NotificationToggle();
  }

  async renderPage() {
    const url = getActiveRoute();
    let page = routes[url];

    if (!page) {
      if (isLoggedIn()) {
        window.location.hash = '#/home';
        return;
      } else {
        window.location.hash = '#/login';
        return;
      }
    }

    if (typeof page === 'function') {
      page = page;
    } else if (typeof page === 'object' && page.render) {
      page = page;
    }

    try {
      if (document.startViewTransition) {
        await document.startViewTransition(async () => {
          await this.#updatePageContent(page);
        }).finished;
      } else {
        await this.#updatePageContent(page);
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      await this.#updatePageContent(page);
    }
  }

  async #updatePageContent(page) {
    try {
      let pageInstance = page;
      if (typeof page === 'function') {
        pageInstance = new page();
      }

      const content = await pageInstance.render();
      this.#content.innerHTML = content;

      // Show/hide header based on authentication
      this.#updateHeader();

      if (pageInstance.afterRender && typeof pageInstance.afterRender === 'function') {
        await pageInstance.afterRender();
      }

      this.currentPage = pageInstance;
    } catch (error) {
      console.error('Error updating page content:', error);
    }
  }

  async #updateHeader() {
    if (isLoggedIn()) {
      const user = getCurrentUser();
      const userGreeting = document.getElementById('user-greeting');
      if (userGreeting) {
        userGreeting.textContent = `Hello, ${user?.name || 'User'}!`;
      }
      this.#header.style.display = 'block';

      // Render notification toggle
      const notificationContainer = document.getElementById('notification-container');
      if (notificationContainer) {
        const toggleHTML = await this.notificationToggle.render();
        notificationContainer.innerHTML = toggleHTML;
        await this.notificationToggle.afterRender();
      }

      this.#initLogout();
    } else {
      this.#header.style.display = 'none';
    }
  }

  #initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      // Remove previous event listeners by cloning
      const newLogoutBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

      newLogoutBtn.addEventListener('click', () => {
        logout();
        window.location.hash = '#/login';
      });
    }
  }

  async init() {
    window.addEventListener('hashchange', () => {
      this.renderPage();
    });

    await this.renderPage();
  }
}

export default App;
