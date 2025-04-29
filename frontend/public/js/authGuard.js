/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} 
 */
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token; // Converte para booleano
}

/**
 * Obtém as informações do usuário atual
 * @returns {Object|null}
 */
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
}

/**
 * Protege uma página que requer autenticação
 * Redireciona para a página de login caso o usuário não esteja autenticado
 */
function protectPage() {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname;
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
  }
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
