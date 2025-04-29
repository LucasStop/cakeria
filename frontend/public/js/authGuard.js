// authGuard.js - Proteção de páginas que requerem autenticação

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  
  // Páginas que requerem autenticação
  const protectedPages = [
    '/home.html',
    '/pedidos/novo.html',
    '/perfil.html',
    '/favoritos.html',
    '/compartilharReceitas.html'
  ];
  
  // Verifica se a página atual está na lista de páginas protegidas
  const requiresAuth = protectedPages.some(page => 
    currentPath.endsWith(page) || currentPath === page
  );
  
  // Se a página requer autenticação e o usuário não está autenticado
  if (requiresAuth && !isAuthenticated()) {
    // Redirecionar para a página de login
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
  }
});

// Verifica se o usuário está autenticado
function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// Obtém as informações do usuário atual
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
}

// Função para fazer logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

/**
 * Inicializa a verificação de autenticação nas páginas
 */
function initAuthGuard() {
  const isLoginPage = window.location.pathname.includes('login.html');
  const isIndexPage = window.location.pathname === '/' || 
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
    '/receitas.html',
    '/compartilharReceitas.html'  
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
