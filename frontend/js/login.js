// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Basic validation
        if (!email || !password) {
            errorMessage.textContent = 'Please fill in all fields';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Redirect to dashboard (Cookie is set automatically by server)
                window.location.href = '/dashboard';
            } else {
                errorMessage.textContent = data.message || 'Invalid email or password';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Unable to connect to server. Please make sure the server is running.';
        }
    });

    // Password Toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle Icon
            if (type === 'text') {
                // Switch to Eye Slash
                togglePassword.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            } else {
                // Switch back to Eye
                togglePassword.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
    }

    // Check Auth Status on Load (Back Button Fix)
    async function checkAuthStatus() {
        try {
            const res = await fetch(`${API_BASE_URL}/status`);
            const data = await res.json();
            if (data.authenticated) {
                window.location.replace('/dashboard'); // Use replace to avoid history stack buildup
            }
        } catch (err) {
            console.error('Auth check failed', err);
        }
    }

    checkAuthStatus();

    // Handle Back Button (bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            checkAuthStatus();
        }
    });
});
