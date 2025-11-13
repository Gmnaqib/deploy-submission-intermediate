import { loginUser } from '../../data/api.js';

const LoginPage = {
  async render() {
    return `
      <section class="auth-container">
        <article class="auth-card">
          <header>
            <h1>Welcome Back</h1>
            <p>Log in to your account to continue</p>
          </header>
          <form id="login-form" class="auth-form" aria-label="Login form">
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
                autocomplete="current-password"
              >
              <span id="password-error" class="error-message" role="alert"></span>
            </fieldset>

            <button type="submit" class="auth-btn" id="login-btn">Login</button>
            <div id="login-message" class="message" role="status" aria-live="polite"></div>
          </form>
          
          <footer class="auth-link">
            <p>
              Don't have an account? 
              <a href="#/register">Register here</a>
            </p>
          </footer>
        </article>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const messageDiv = document.getElementById('login-message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const credentials = {
        email: formData.get('email'),
        password: formData.get('password'),
      };

      // Clear previous messages
      messageDiv.textContent = '';
      messageDiv.className = 'message';

      // Validation
      if (!this.validateForm(credentials)) {
        return;
      }

      // Show loading state
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';

      try {
        const response = await loginUser(credentials);

        // Show success message
        messageDiv.textContent = 'Login successful! Redirecting...';
        messageDiv.classList.add('success');

        // Redirect to home
        setTimeout(() => {
          window.location.hash = '#/home';
        }, 1000);

      } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.classList.add('error');
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    });
  },

  validateForm(data) {
    let isValid = true;

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

export default LoginPage;