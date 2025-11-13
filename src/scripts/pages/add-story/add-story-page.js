import { addStory, isLoggedIn } from '../../data/api.js';
import { CameraUtil } from '../../utils/camera.js';

export default class AddStoryPage {
    constructor() {
        this.selectedLat = null;
        this.selectedLon = null;
        this.map = null;
        this.selectedMarker = null;
        this.camera = new CameraUtil();
        this.capturedPhoto = null;
    }

    async render() {
        if (!isLoggedIn()) {
            window.location.hash = '#/login';
            return;
        }

        return `
      <section class="add-story-container">
        <article class="add-story-section">
          <header class="story-header">
            <h1>Create New Story</h1>
            <p>Share your experiences by adding a new story with a photo and description.</p>
          </header>
          
          <form id="add-story-form" class="story-form" aria-label="Add story form">
            <fieldset class="input-group">
              <legend>Photo:</legend>
              <div class="photo-input-section">
                <input 
                  type="file" 
                  id="photo" 
                  name="photo" 
                  accept="image/*"
                  required
                  aria-describedby="photo-error">
                <button type="button" id="camera-toggle" class="btn btn-outline">Use Camera</button>
              </div>
              
              <aside id="camera-section" class="camera-section" style="display: none;" aria-label="Camera capture">
                <video id="camera-video" autoplay playsinline aria-label="Camera preview"></video>
                <canvas id="camera-canvas" style="display: none;" aria-hidden="true"></canvas>
                <div class="camera-controls">
                  <button type="button" id="camera-take-button" class="btn btn-primary">Take Photo</button>
                  <button type="button" id="camera-close" class="btn btn-secondary">Close Camera</button>
                </div>
                <div id="camera-list-output" class="camera-output"></div>
              </aside>
              
              <span id="photo-error" class="error-message" role="alert"></span>
            </fieldset>

            <fieldset class="input-group">
              <label for="description">Description:</label>
              <textarea 
                id="description" 
                name="description" 
                required
                minlength="10"
                rows="4"
                placeholder="Tell us about your story..."
                aria-describedby="description-error"></textarea>
              <span id="description-error" class="error-message" role="alert"></span>
              <small class="char-count" aria-live="polite">0 characters</small>
            </fieldset>

            <fieldset class="location-section">
              <legend>Select Location</legend>
              <p class="instruction">Click on the map to select a location for your story, or use your current location</p>
              
              <div class="map-container">
                <div id="add-story-map" class="map" role="application" aria-label="Interactive map for selecting story location"></div>
              </div>
              
              <output class="coordinates-display">
                <span id="coordinates-text" aria-live="polite">No location selected</span>
                <button class="btn btn-primary" type="button" id="clear-location" style="display: none;">Clear Location</button>
              </output>

              <div class="location-controls">
                <button type="button" id="get-current-location" class="btn btn-outline">Use My Location</button>
              </div>
            </fieldset>

            <footer class="form-actions">
              <button type="submit" id="submit-btn" class="btn btn-primary">Add Story</button>
              <div id="form-message" class="message" role="status" aria-live="polite"></div>
            </footer>
          </form>
        </article>
      </section>
    `;
    }

    async afterRender() {
        await this.initMap();
        this.initLocationControls();
        this.initCameraControls();
        this.initForm();
    }

    async initMap() {
        // Initialize Leaflet map
        this.map = L.map('add-story-map').setView([-6.2088, 106.8456], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.map.on('click', (e) => {
            this.selectLocation(e.latlng.lat, e.latlng.lng);
        });
    }

    initLocationControls() {
        const getCurrentLocationBtn = document.getElementById('get-current-location');

        getCurrentLocationBtn.addEventListener('click', () => {
            this.getCurrentPosition();
        });
    }

    getCurrentPosition() {
        const getCurrentLocationBtn = document.getElementById('get-current-location');
        const coordText = document.getElementById('coordinates-text');

        if (!getCurrentLocationBtn || !coordText) {
            console.error('[AddStory] Location elements not found');
            return;
        }

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            coordText.textContent = 'Geolocation is not supported by this browser';
            coordText.style.color = 'red';
            return;
        }

        // Show loading state
        getCurrentLocationBtn.disabled = true;
        getCurrentLocationBtn.textContent = 'Getting Location...';
        coordText.textContent = 'Getting your current location...';
        coordText.style.color = '#666';

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Set location and add marker
                this.selectLocation(lat, lon);

                // Center map on current location
                this.map.setView([lat, lon], 15);

                // Reset button state
                getCurrentLocationBtn.disabled = false;
                getCurrentLocationBtn.textContent = 'Use My Location';
            },
            (error) => {
                let errorMessage = '';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while getting location';
                        break;
                }

                coordText.textContent = errorMessage;
                coordText.style.color = 'red';

                // Reset button state
                getCurrentLocationBtn.disabled = false;
                getCurrentLocationBtn.textContent = 'Use My Location';
            },
            options
        );
    }

    selectLocation(lat, lon) {
        this.selectedLat = lat;
        this.selectedLon = lon;

        // Remove previous marker
        if (this.selectedMarker) {
            this.map.removeLayer(this.selectedMarker);
        }

        // Add new marker
        this.selectedMarker = L.marker([lat, lon]).addTo(this.map);

        // Update coordinates display
        const coordText = document.getElementById('coordinates-text');
        const clearBtn = document.getElementById('clear-location');

        if (!coordText || !clearBtn) {
            console.error('[AddStory] Coordinate display elements not found');
            return;
        }

        coordText.textContent = `Selected: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        coordText.style.color = '#333';
        clearBtn.style.display = 'inline-block';

        clearBtn.onclick = () => {
            this.clearLocation();
        };
    }

    clearLocation() {
        this.selectedLat = null;
        this.selectedLon = null;

        if (this.selectedMarker) {
            this.map.removeLayer(this.selectedMarker);
            this.selectedMarker = null;
        }

        const coordText = document.getElementById('coordinates-text');
        const clearBtn = document.getElementById('clear-location');

        if (!coordText || !clearBtn) {
            console.error('[AddStory] Coordinate display elements not found');
            return;
        }

        coordText.textContent = 'No location selected';
        coordText.style.color = '#666';
        clearBtn.style.display = 'none';
    }

    initCameraControls() {
        const cameraToggle = document.getElementById('camera-toggle');
        const cameraSection = document.getElementById('camera-section');
        const cameraClose = document.getElementById('camera-close');
        const photoInput = document.getElementById('photo');

        cameraToggle.addEventListener('click', async () => {
            try {
                cameraSection.style.display = 'block';
                cameraToggle.textContent = 'Camera Opening...';
                cameraToggle.disabled = true;

                const videoElement = document.getElementById('camera-video');
                const canvasElement = document.getElementById('camera-canvas');
                const takeButtonElement = document.getElementById('camera-take-button');
                const outputElement = document.getElementById('camera-list-output');

                // Override the onPictureTaken method
                this.camera.onPictureTaken = (imageDataUrl) => {
                    const file = this.camera.dataURLtoFile(imageDataUrl, 'camera-photo.png');

                    const dt = new DataTransfer();
                    dt.items.add(file);
                    photoInput.files = dt.files;

                    this.capturedPhoto = file;
                    this.closeCameraSection();
                };

                await this.camera.initCamera(videoElement, canvasElement, takeButtonElement, outputElement);

                cameraToggle.textContent = 'Camera Active';
                cameraToggle.disabled = false;
            } catch (error) {
                console.error('Camera error:', error);
                alert('Failed to access camera: ' + error.message);
                cameraToggle.textContent = 'Use Camera';
                cameraToggle.disabled = false;
                cameraSection.style.display = 'none';
            }
        });

        cameraClose.addEventListener('click', () => {
            this.closeCameraSection();
        });
    }

    closeCameraSection() {
        const cameraSection = document.getElementById('camera-section');
        const cameraToggle = document.getElementById('camera-toggle');

        this.camera.stopCamera();
        cameraSection.style.display = 'none';
        cameraToggle.textContent = 'Use Camera';
        cameraToggle.disabled = false;
    }

    initForm() {
        const form = document.getElementById('add-story-form');
        const submitBtn = document.getElementById('submit-btn');
        const messageDiv = document.getElementById('form-message');
        const descriptionInput = document.getElementById('description');
        const charCount = document.querySelector('.char-count');

        // Character counter for description
        descriptionInput.addEventListener('input', () => {
            const length = descriptionInput.value.length;
            charCount.textContent = `${length} characters`;
            charCount.style.color = '#666';
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const photo = formData.get('photo');
            const description = formData.get('description');

            // Clear previous messages
            messageDiv.textContent = '';
            messageDiv.className = 'message';

            // Validation
            if (!this.validateForm(photo, description)) {
                return;
            }

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding Story...';

            try {
                const storyData = {
                    photo: photo,
                    description: description.trim(),
                };

                // Add location if selected
                if (this.selectedLat && this.selectedLon) {
                    storyData.lat = this.selectedLat;
                    storyData.lon = this.selectedLon;
                }

                const response = await addStory(storyData);

                // Show success message
                messageDiv.textContent = 'Story added successfully! Redirecting...';
                messageDiv.classList.add('success');

                // Clear form
                form.reset();
                this.clearLocation();
                this.closeCameraSection();
                this.capturedPhoto = null;
                charCount.textContent = '0 characters';

                // Redirect to home
                setTimeout(() => {
                    window.location.hash = '#/home';
                }, 2000);

            } catch (error) {
                messageDiv.textContent = error.message;
                messageDiv.classList.add('error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Story';
            }
        });
    }

    validateForm(photo, description) {
        let isValid = true;

        // Photo validation
        const photoError = document.getElementById('photo-error');

        const hasPhoto = (photo && photo.size > 0) || this.capturedPhoto;

        if (!hasPhoto) {
            photoError.textContent = 'Please select a photo or take one with the camera';
            isValid = false;
        } else if (photo && photo.size > 0) {
            // Validate file input photo
            if (!photo.type.startsWith('image/')) {
                photoError.textContent = 'Please select a valid image file';
                isValid = false;
            } else if (photo.size > 5 * 1024 * 1024) { // 5MB limit
                photoError.textContent = 'Photo size must be less than 5MB';
                isValid = false;
            } else {
                photoError.textContent = '';
            }
        } else if (this.capturedPhoto) {
            photoError.textContent = '';
        }

        // Description validation
        const descriptionError = document.getElementById('description-error');
        if (!description || description.trim().length < 10) {
            descriptionError.textContent = 'Description must be at least 10 characters';
            isValid = false;
        } else {
            descriptionError.textContent = '';
        }

        return isValid;
    }
}