// authGuard.js - Proteção de páginas que requerem autenticação

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  
  // Páginas que requerem autenticação
  const protectedPages = [
    '/home.html',
    '/pedidos/novo.html',
    '/perfil.html',
    '/favoritos.html',
    '/compartilharReceitas.html',
    '/receita.html',
    '/receitas.html'
  ];
  
  const requiresAuth = protectedPages.some(page => 
    currentPath.endsWith(page) || currentPath === page
  );
  

  if (requiresAuth && !isAuthenticated()) {
   
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
  }
});

// Verifica se o usuário está autenticado
function isAuthenticated() {
  const token = localStorage.getItem('token');
  
  if (!token) {
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

/**
 * Função para proteger páginas específicas
 * Esta função pode ser chamada em qualquer página para verificar autenticação
 */
function protectPage() {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname;
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
    return false;
  }
  return true;
}

/**
 * Inicializa a verificação de autenticação nas páginas
 */
function initAuthGuard() {
  const isLoginPage = window.location.pathname.includes('login.html');
  const isIndexPage = window.location.pathname === '/' || 
                    window.location.pathname === '/index.html' || 
                    window.location.pathname === '';
  
  // Redirecionar para home se já estiver autenticado e estiver na página de login
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
    '/compartilharReceitas.html',
    '/perfil.html'
  ];
  
  // Nota: Removemos '/receitas.html' desta lista, pois parece que essa página
  // deveria ser acessível mesmo sem login (apenas compartilhar receitas requer login)
  
  if (protectedPages.some(page => window.location.pathname.includes(page)) && !isAuthenticated()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
}

// Inicializa a verificação de autenticação quando a página carrega
document.addEventListener('DOMContentLoaded', initAuthGuard);

// Exportar funções para uso global
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.protectPage = protectPage;
window.handleLogout = handleLogout;
