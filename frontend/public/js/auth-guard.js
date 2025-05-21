document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;

  const protectedPages = [
    '/home.html',
    '/pedidos/novo.html',
    '/perfil.html',
    '/favoritos.html',
    '/compartilhar-receita.html',
    '/receita.html',
    '/receitas.html',
  ];

  const requiresAuth = protectedPages.some(
    page => currentPath.endsWith(page) || currentPath === page
  );

  if (requiresAuth && !isAuthenticated()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
  }
});

function isAuthenticated() {
  const token = localStorage.getItem('token');

  if (!token) {
    return false;
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('logout')) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    return payload.exp > currentTime;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return false;
  }
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

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function protectPage() {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname;
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
    return false;
  }
  return true;
}

function initAuthGuard() {
  const isLoginPage = window.location.pathname.includes('login.html');
  const isIndexPage =
    window.location.pathname === '/' ||
    window.location.pathname === '/index.html' ||
    window.location.pathname === '';

  if ((isIndexPage || isLoginPage) && isAuthenticated()) {
    window.location.href = '/home.html';
    return;
  }

  const protectedPages = [
    '/home.html',
    '/pedidos.html',
    '/perfil.html',
    '/favoritos.html',
    '/footer.html',
    '/receita.html',
    '/compartilhar-receita.html',
    '/perfil.html',
  ];

  if (protectedPages.some(page => window.location.pathname.includes(page)) && !isAuthenticated()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
}

document.addEventListener('DOMContentLoaded', initAuthGuard);

window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.protectPage = protectPage;
window.handleLogout = handleLogout;
