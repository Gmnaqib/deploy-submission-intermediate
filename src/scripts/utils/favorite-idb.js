import { openDB } from 'idb';

const DATABASE_NAME = 'storyu-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'favorites';

// Initialize database
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
        if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
            const objectStore = database.createObjectStore(OBJECT_STORE_NAME, {
                keyPath: 'id'
            });
            // Create indexes for searching and sorting
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
    },
});

const FavoriteIdb = {
    // Add story to favorites
    async addFavorite(story) {
        try {
            const db = await dbPromise;

            const favoriteData = {
                ...story,
                createdAt: new Date().toISOString(),
            };

            await db.add(OBJECT_STORE_NAME, favoriteData);
            console.log('[IndexedDB] Story added to favorites:', story.id);
            return true;
        } catch (error) {
            console.error('[IndexedDB] Error adding favorite:', error);
            return false;
        }
    },

    //  Get single favorite by id
    async getFavorite(id) {
        try {
            const db = await dbPromise;
            const favorite = await db.get(OBJECT_STORE_NAME, id);
            return favorite;
        } catch (error) {
            console.error('[IndexedDB] Error getting favorite:', error);
            return null;
        }
    },

    //  Get all favorites
    async getAllFavorites() {
        try {
            const db = await dbPromise;
            const favorites = await db.getAll(OBJECT_STORE_NAME);
            return favorites;
        } catch (error) {
            console.error('[IndexedDB] Error getting all favorites:', error);
            return [];
        }
    },

    //  Remove from favorites
    async deleteFavorite(id) {
        try {
            const db = await dbPromise;
            await db.delete(OBJECT_STORE_NAME, id);
            console.log('[IndexedDB] Story removed from favorites:', id);
            return true;
        } catch (error) {
            console.error('[IndexedDB] Error deleting favorite:', error);
            return false;
        }
    },

    // Filter favorites by name
    async searchFavorites(query) {
        try {
            const allFavorites = await this.getAllFavorites();

            if (!query || query.trim() === '') {
                return allFavorites;
            }

            const searchTerm = query.toLowerCase();
            return allFavorites.filter(story =>
                story.name.toLowerCase().includes(searchTerm) ||
                story.description?.toLowerCase().includes(searchTerm)
            );
        } catch (error) {
            console.error('[IndexedDB] Error searching favorites:', error);
            return [];
        }
    },

    // Sort favorites
    async sortFavorites(sortBy = 'newest') {
        try {
            const allFavorites = await this.getAllFavorites();

            switch (sortBy) {
                case 'newest':
                    return allFavorites.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                case 'oldest':
                    return allFavorites.sort((a, b) =>
                        new Date(a.createdAt) - new Date(b.createdAt)
                    );
                case 'name-asc':
                    return allFavorites.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                case 'name-desc':
                    return allFavorites.sort((a, b) =>
                        b.name.localeCompare(a.name)
                    );
                default:
                    return allFavorites;
            }
        } catch (error) {
            console.error('[IndexedDB] Error sorting favorites:', error);
            return [];
        }
    },

    // Check if story is favorited
    async isFavorite(id) {
        try {
            const favorite = await this.getFavorite(id);
            return favorite !== undefined;
        } catch (error) {
            console.error('[IndexedDB] Error checking favorite:', error);
            return false;
        }
    },

    // Get favorites count
    async getCount() {
        try {
            const db = await dbPromise;
            const count = await db.count(OBJECT_STORE_NAME);
            return count;
        } catch (error) {
            console.error('[IndexedDB] Error getting count:', error);
            return 0;
        }
    },
};

export default FavoriteIdb;
