import { getStories, isLoggedIn } from '../../data/api.js';

export default class StoryDetailPage {
  constructor() {
    this.storyId = null;
    this.story = null;
    this.map = null;
  }

  async render() {
    if (!isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    const hash = window.location.hash;
    const storyId = hash.split('/')[2];
    this.storyId = storyId;

    if (!storyId) {
      window.location.hash = '#/home';
      return;
    }

    // Get story data
    await this.loadStory();

    if (!this.story) {
      return `
        <section class="story-not-found" role="alert">
          <h1>Story Not Found</h1>
          <p>The story you're looking for doesn't exist.</p>
          <a href="#/home" class="btn btn-primary">Home</a>
        </section>
      `;
    }

    return `
      <article class="story-detail-container">
        <header class="story-hero">
          <figure>
            <img src="${this.story.photoUrl}" alt="${this.story.description}" class="story-hero-image" />
          </figure>
        </header>
        
        <section class="story-content-wrapper">
          <div class="story-main-content">
            <header class="story-author-info">
              <figure class="author-avatar-large">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(this.story.name || 'Anonymous')}&background=4f46e5&color=fff" alt="" />
              </figure>
              <h2 class="author-name-large">${this.story.name || 'Anonymous'}</h2>
            </header>

            <div class="story-text-content">
              <p>${this.story.description}</p>
            </div>

            <aside class="story-details-bottom">
              <h3>DETAILS</h3>
              
              <div class="details-horizontal-layout">
                <div class="details-info">
                  <div class="detail-item">
                    <div class="detail-icon">
                      <img src="/images/calendar-icon.png" alt="" aria-hidden="true" />
                    </div>
                    <div class="detail-content">
                      <h4>Published Date</h4>
                      <p><time datetime="${this.story.createdAt}">${new Date(this.story.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</time></p>
                    </div>
                  </div>

                  ${this.story.lat && this.story.lon ? `
                  <div class="detail-item">
                    <div class="detail-icon">
                      <img src="/images/location-icon.png" alt="location icon" aria-hidden="true" />
                    </div>
                    <div class="detail-content">
                      <h4>Location</h4>
                      <p>Lat: ${this.story.lat.toFixed(4)}, Lon: ${this.story.lon.toFixed(4)}</p>
                    </div>
                  </div>
                  ` : ''}
                </div>

                ${this.story.lat && this.story.lon ? `
                <div class="details-map">
                  <div id="story-detail-map" class="story-detail-map" role="application" aria-label="Story location map"></div>
                </div>
                ` : ''}
              </div>
            </aside>
          </div>
        </section>
      </article>
    `;
  }

  async afterRender() {
    if (this.story && this.story.lat && this.story.lon) {
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }

  async loadStory() {
    try {
      const response = await getStories();
      const stories = response.listStory || [];
      this.story = stories.find(story => story.id === this.storyId);
    } catch (error) {
      console.error('Error loading story:', error);
      this.story = null;
    }
  }

  initMap() {
    if (!this.story.lat || !this.story.lon) return;

    try {
      this.map = L.map('story-detail-map').setView([this.story.lat, this.story.lon], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      L.marker([this.story.lat, this.story.lon])
        .bindPopup(`
          <article class="map-popup-detail">
            <h3>${this.story.name || 'Anonymous'}</h3>
            <p>${this.story.description.substring(0, 50)}${this.story.description.length > 50 ? '...' : ''}</p>
          </article>
        `)
        .addTo(this.map)
        .openPopup();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }
}