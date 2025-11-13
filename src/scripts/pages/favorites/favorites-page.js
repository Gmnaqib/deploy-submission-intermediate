import FavoriteIdb from '../../utils/favorite-idb.js';

class FavoritesPage {
  async render() {
    return `
      <div class="favorites-page">
        <div class="container">
          <div class="favorites-header">
            <h1>My Favorites</h1>
            <p>Stories you've saved for later</p>
          </div>

          <!-- Search & Sort Controls -->
          <div class="favorites-controls">
            <div class="search-box">
              <input 
                type="text" 
                id="search-input" 
                placeholder="Search favorites..." 
                class="search-input"
              />
            </div>
            
            <div class="sort-box">
              <label for="sort-select">Sort by:</label>
              <select id="sort-select" class="sort-select">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          <!-- Favorites Grid -->
          <div id="favorites-container" class="stories-grid">
            <p class="loading">Loading favorites...</p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await this.displayFavorites();
    this.attachEventListeners();
  }

  async displayFavorites(sortBy = 'newest', searchQuery = '') {
    const container = document.getElementById('favorites-container');
    const countElement = document.getElementById('favorites-count');

    try {
      let favorites;

      // Apply search if query exists
      if (searchQuery) {
        favorites = await FavoriteIdb.searchFavorites(searchQuery);
      } else {
        favorites = await FavoriteIdb.sortFavorites(sortBy);
      }

      // Update count
      if (countElement) {
        countElement.textContent = favorites.length;
      }

      // Display empty state or favorites
      if (!favorites || favorites.length === 0) {
        container.innerHTML = this.renderEmptyState(searchQuery);
        return;
      }

      // Render favorites
      container.innerHTML = favorites.map(story => this.renderStoryCard(story)).join('');

      // Re-attach event listeners to new buttons
      this.attachActionButtonListeners();
    } catch (error) {
      console.error('[Favorites] Error displaying favorites:', error);
      container.innerHTML = `
        <div class="error-message">
          <p>Error loading favorites</p>
        </div>
      `;
    }
  }

  renderStoryCard(story) {
    const photoUrl = story.photoUrl || '/images/placeholder.jpg';
    const description = story.description || 'No description available';
    const truncatedDesc = description.length > 150
      ? description.substring(0, 150) + '...'
      : description;

    return `
      <article class="story-card">
        <img src="${photoUrl}" alt="${story.name}" class="story-image" />
        <div class="story-content">
          <h3>${story.name}</h3>
          <p class="story-description">${truncatedDesc}</p>
          <div class="story-actions">
            <button 
              class="btn btn-secondary btn-sm view-story-btn" 
              data-id="${story.id}"
            >
              View Story
            </button>
            <button 
              class="btn btn-danger btn-sm remove-favorite-btn" 
              data-id="${story.id}"
              data-name="${story.name}"
            >
               Remove
            </button>
          </div>
        </div>
      </article>
    `;
  }

  renderEmptyState(searchQuery) {
    if (searchQuery) {
      return `
        <div class="empty-state">
          <div class="empty-icon"></div>
          <h2>No results found</h2>
          <p>Try different keywords</p>
        </div>
      `;
    }

    return `
      <div class="empty-state">
        <div class="empty-icon"></div>
        <h2>No favorites yet</h2>
        <p>Start adding stories to your favorites!</p>
        <a href="#/home" class="btn btn-primary">Browse Stories</a>
      </div>
    `;
  }

  attachEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          const query = e.target.value;
          const sortSelect = document.getElementById('sort-select');
          const sortBy = sortSelect ? sortSelect.value : 'newest';
          await this.displayFavorites(sortBy, query);
        }, 300); // Debounce 300ms
      });
    }

    // Sort functionality
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', async (e) => {
        const sortBy = e.target.value;
        const searchInput = document.getElementById('search-input');
        const query = searchInput ? searchInput.value : '';
        await this.displayFavorites(sortBy, query);
      });
    }

    // Attach action button listeners
    this.attachActionButtonListeners();
  }

  attachActionButtonListeners() {
    // Remove favorite buttons
    const removeButtons = document.querySelectorAll('.remove-favorite-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const storyId = e.target.dataset.id;
        const storyName = e.target.dataset.name;
        await this.removeFavorite(storyId, storyName);
      });
    });

    // View story buttons
    const viewButtons = document.querySelectorAll('.view-story-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const storyId = e.target.dataset.id;
        window.location.hash = `#/story/${storyId}`;
      });
    });
  }

  async removeFavorite(storyId, storyName) {
    try {
      const success = await FavoriteIdb.deleteFavorite(storyId);

      if (success) {
        this.showToast(`"${storyName}" removed from favorites`);

        // Refresh display
        const sortSelect = document.getElementById('sort-select');
        const searchInput = document.getElementById('search-input');
        const sortBy = sortSelect ? sortSelect.value : 'newest';
        const query = searchInput ? searchInput.value : '';
        await this.displayFavorites(sortBy, query);
      } else {
        this.showToast('Failed to remove favorite');
      }
    } catch (error) {
      console.error('[Favorites] Error removing favorite:', error);
      this.showToast('Error removing favorite');
    }
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
}

export default FavoritesPage;
