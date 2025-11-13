import { getStories, isLoggedIn } from '../../data/api.js';
import FavoriteIdb from '../../utils/favorite-idb.js';

export default class HomePage {
  async render() {
    if (!isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    return `
      <section class="home-container">
        <header class="home-header">
          <h1>Stories Around the World</h1>
          <p>Discover inspiring stories from people all over the globe.</p>
        </header>
        
        <section class="stories-list" aria-label="Story collection">
          <h2>Story List</h2>
          <div id="loading" class="loading" role="status" aria-live="polite">Loading stories...</div>
          <div id="error-message" class="error-message" role="alert" aria-live="assertive" style="display: none;"></div>
          <div id="stories-container" class="stories-grid"></div>
        </section>
      </section>
    `;
  }

  async afterRender() {
    await this.loadStories();
  }

  async initMap() {
    // Tenganh indonesia
    const map = L.map('map').setView([-6.2088, 106.8456], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    this.map = map;
    this.markers = [];
  }

  async loadStories() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-message');
    const containerEl = document.getElementById('stories-container');

    try {
      loadingEl.style.display = 'block';
      errorEl.style.display = 'none';

      const response = await getStories();
      const stories = response.listStory || [];

      loadingEl.style.display = 'none';

      if (stories.length === 0) {
        containerEl.innerHTML = '<p class="no-stories" role="status">No stories found. Be the first to add a story!</p>';
        return;
      }

      this.displayStories(stories);

      this.addMarkersToMap(stories);

    } catch (error) {
      loadingEl.style.display = 'none';
    }
  }

  async displayStories(stories) {
    const container = document.getElementById('stories-container');

    // Check which stories are already favorited
    const favoritedIds = new Set();
    for (const story of stories) {
      const isFav = await FavoriteIdb.isFavorite(story.id);
      if (isFav) {
        favoritedIds.add(story.id);
      }
    }

    container.innerHTML = stories.map(story => {
      const isFavorited = favoritedIds.has(story.id);
      return `
        <article class="story-card" data-id="${story.id}">
          <figure class="story-figure">
            <img 
              src="${story.photoUrl}" 
              alt="${story.description}" 
              class="story-image"
              loading="lazy">
            <button 
              class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
              data-story-id="${story.id}"
              title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}"
            >
              ${isFavorited ? '❤️' : '🤍'}
            </button>
          </figure>
          <div class="story-content">
            <h3 class="story-title">${story.name || 'Anonymous'}</h3>
            <p class="story-description">${story.description.length > 100 ? story.description.substring(0, 100) + '...' : story.description}</p>
            <footer class="story-footer">
              <time class="story-date" datetime="${story.createdAt}">${new Date(story.createdAt).toLocaleDateString()}</time>
              <button class="read-full-story-btn" data-story-id="${story.id}" type="button">Read Full Story</button>
            </footer>
          </div>
        </article>
      `;
    }).join('');

    // Add event listeners
    this.initReadFullStoryButtons();
    this.initFavoriteButtons(stories);
  }

  initReadFullStoryButtons() {
    const buttons = document.querySelectorAll('.read-full-story-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = button.dataset.storyId;
        window.location.hash = `#/story/${storyId}`;
      });
    });
  }

  initFavoriteButtons(stories) {
    const buttons = document.querySelectorAll('.favorite-btn');

    buttons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = button.dataset.storyId;
        const story = stories.find(s => s.id === storyId);

        if (!story) return;

        const isFavorited = button.classList.contains('favorited');

        if (isFavorited) {
          // Remove from favorites
          const success = await FavoriteIdb.deleteFavorite(storyId);
          if (success) {
            button.classList.remove('favorited');
            button.textContent = '🤍';
            button.title = 'Add to favorites';
            this.showToast('Removed from favorites');
          }
        } else {
          // Add to favorites
          const success = await FavoriteIdb.addFavorite(story);
          if (success) {
            button.classList.add('favorited');
            button.textContent = '❤️';
            button.title = 'Remove from favorites';
            this.showToast('Added to favorites');
          }
        }
      });
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  addMarkersToMap(stories) {
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    stories.forEach(story => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon])
          .bindPopup(`
            <article class="map-popup">
              <figure>
                <img src="${story.photoUrl}" alt="${story.description}" style="width: 200px; height: 150px; object-fit: cover;">
              </figure>
              <h3>${story.name || 'Anonymous'}</h3>
              <p>${story.description}</p>
              <footer>
                <time datetime="${story.createdAt}">${new Date(story.createdAt).toLocaleDateString()}</time>
              </footer>
            </article>
          `)
          .addTo(this.map);

        this.markers.push(marker);
      }
    });
  }
}
