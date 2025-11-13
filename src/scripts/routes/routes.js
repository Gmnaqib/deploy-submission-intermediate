import HomePage from '../pages/home/home-page.js';
import LoginPage from '../pages/auth/login-page.js';
import RegisterPage from '../pages/auth/register-page.js';
import AddStoryPage from '../pages/add-story/add-story-page.js';
import StoryDetailPage from '../pages/story-detail/story-detail-page.js';
import FavoritesPage from '../pages/favorites/favorites-page.js';

const routes = {
  '/': new HomePage(),
  '/home': new HomePage(),
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add-story': new AddStoryPage(),
  '/story/:id': new StoryDetailPage(),
  '/favorites': new FavoritesPage(),
};

export default routes;
