import CONFIG from '../config.js';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
};

function getAuthHeader() {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Daftar
export async function registerUser(userData) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    return result;
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }
}

// Mashook 
export async function loginUser(credentials) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    // token user
    if (result.loginResult && result.loginResult.token) {
      localStorage.setItem(CONFIG.TOKEN_KEY, result.loginResult.token);
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(result.loginResult));
    }

    return result;
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }
}

// Get all stories 
export async function getStories() {
  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch stories');
    }

    return result;
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }
}

// Create story broo
export async function addStory(storyData) {
  try {
    const formData = new FormData();
    formData.append('description', storyData.description);
    formData.append('photo', storyData.photo);

    if (storyData.lat && storyData.lon) {
      formData.append('lat', storyData.lat);
      formData.append('lon', storyData.lon);
    }

    const response = await fetch(ENDPOINTS.ADD_STORY, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to add story');
    }

    return result;
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }
}

// cek login
export function isLoggedIn() {
  return localStorage.getItem(CONFIG.TOKEN_KEY) !== null;
}

// session
export function getCurrentUser() {
  const userData = localStorage.getItem(CONFIG.USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

// Logout user
export function logout() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
}