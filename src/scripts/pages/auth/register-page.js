import { registerUser } from '../../data/api.js';

const RegisterPage = {
  async render() {
    return `
      <section class="auth-container">
        <article class="auth-card">
          <header>
            <h1>Register</h1>
            <p>Create your account to get started</p>
          </header>
          <form id="register-form" class="auth-form" aria-label="Registration form">
            <fieldset class="input-group">
              <label for="name">Name:</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                placeholder="Enter your name"
                required
                minlength="3"
                aria-describedby="name-error"
                autocomplete="name"
              >
              <span id="name-error" class="error-message" role="alert"></span>
            </fieldset>
            
            <fieldset class="input-group">
              <label for="email">Email:</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Enter your email"
                required
                aria-describedby="email-error"
                autocomplete="email"
              >
              <span id="email-error" class="error-message" role="alert"></span>
            </fieldset>
            
            <fieldset class="input-group">
              <label for="password">Password:</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Enter your password"
                required
                minlength="8"
                aria-describedby="password-error"
                autocomplete="new-password"
              >
              <span id="password-error" class="error-message" role="alert"></span>
            </fieldset>
            
            <button type="submit" class="auth-btn" id="register-btn">Register</button>
            <div id="register-message" class="message" role="status" aria-live="polite"></div>
          </form>
          
          <footer class="auth-link">
            <p>
              Already have an account? 
              <a href="#/login">Login here</a>
            </p>
          </footer>
        </article>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById('register-form');
    const registerBtn = document.getElementById('register-btn');
    const messageDiv = document.getElementById('register-message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
      };

      // Clear previous messages
      messageDiv.textContent = '';
      messageDiv.className = 'message';

      // Validation
      if (!this.validateForm(userData)) {
        return;
      }

      // Show loading state
      registerBtn.disabled = true;
      registerBtn.textContent = 'Registering...';

      try {
        const response = await registerUser(userData);

        // Show success message
        messageDiv.textContent = 'Registration successful! Please login with your credentials.';
        messageDiv.classList.add('success');

        form.reset();
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);

      } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.classList.add('error');
      } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
      }
    });
  },

  validateForm(data) {
    let isValid = true;

    // Name validation
    const nameError = document.getElementById('name-error');
    if (!data.name || data.name.length < 3) {
      nameError.textContent = 'Name must be at least 3 characters';
      isValid = false;
    } else {
      nameError.textContent = '';
    }

    // Email validation
    const emailError = document.getElementById('email-error');
    if (!data.email || !this.isValidEmail(data.email)) {
      emailError.textContent = 'Please enter a valid email address';
      isValid = false;
    } else {
      emailError.textContent = '';
    }

    // Password validation
    const passwordError = document.getElementById('password-error');
    if (!data.password || data.password.length < 8) {
      passwordError.textContent = 'Password must be at least 8 characters';
      isValid = false;
    } else {
      passwordError.textContent = '';
    }

    return isValid;
  },

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

export default RegisterPage;