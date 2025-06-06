function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
}

function protectPage() {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname;
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
  }
}

function validateField(inputElement, validationFunction, errorElementId, errorMessage) {
  const value = inputElement.value.trim();
  const errorElement = document.getElementById(errorElementId);

  if (value === '') {
    errorElement.textContent = '';
    inputElement.classList.remove('invalid-input');
    return;
  }

  if (!validationFunction(value)) {
    inputElement.classList.add('invalid-input');
    errorElement.textContent = errorMessage;
  } else {
    inputElement.classList.remove('invalid-input');
    errorElement.textContent = '';
  }
}

function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password.length >= 5;
}

function showError(inputElement, errorElementId, message) {
  inputElement.classList.add('invalid-input');
  const errorElement = document.getElementById(errorElementId);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;

  if (!validateEmail(email)) {
    isValid = false;
    showError(emailInput, 'email-error', 'Utilize um formato válido (usuario@email.com)');
  }

  if (!validatePassword(password)) {
    isValid = false;
    showError(passwordInput, 'password-error', 'A senha deve ter pelo menos 5 caracteres');
  }

  if (!isValid) {
    return;
  }

  const userData = {
    email: email,
    password: password,
  };

  try {
    const response = await fetch(`http://localhost:3001/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(emailInput, 'email-error', data.message || 'Credenciais inválidas');
      return;
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('justLoggedIn', 'true');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.href = '/index.html';
    }
  } catch (error) {
    console.error('Erro durante login:', error);
    showError(emailInput, 'email-error', 'Erro ao conectar com o servidor');
  }
}

function togglePasswordVisibility(e) {
  const button = e.currentTarget;
  const passwordInput = button.previousElementSibling;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    passwordInput.classList.add('password-input');

    button.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    </svg>`;
  } else {
    passwordInput.type = 'password';
    passwordInput.classList.remove('password-input');

    button.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24">
      <path d="M12 4.5c-5 0-9.3 3-11 7.5 1.7 4.5 6 7.5 11 7.5s9.3-3 11-7.5c-1.7-4.5-6-7.5-11-7.5zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
    </svg>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('login.html');
  const isIndexPage =
    window.location.pathname === '/' ||
    window.location.pathname === '/index.html' ||
    window.location.pathname === '';

  if ((isIndexPage || isLoginPage) && isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);

    document.getElementById('email')?.addEventListener('input', function () {
      validateField(
        this,
        validateEmail,
        'email-error',
        'Utilize um formato válido (usuario@email.com)'
      );
    });

    document.getElementById('password')?.addEventListener('input', function () {
      validateField(
        this,
        validatePassword,
        'password-error',
        'A senha deve ter pelo menos 5 caracteres'
      );
    });

    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
      passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
  }
});
