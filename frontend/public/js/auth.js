/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} True se o usuário estiver autenticado
 */
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token; // Converte para booleano
}

/**
 * Obtém as informações do usuário atual
 * @returns {Object|null} Dados do usuário ou null se não estiver autenticado
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
 * Realiza logout do usuário
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

/**
 * Protege uma página, redirecionando para login se não estiver autenticado
 */
function protectPage() {
  if (!isAuthenticated()) {
    // Armazena a URL atual para redirecionar de volta após login
    const currentPath = window.location.pathname;
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
  }
}
