function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('justLoggedIn');
  
  // Limpa os caches da aplicação
  clearAppCaches();

  window.location.href = '/index.html?logout=true';
}

/**
 * Limpa todos os caches utilizados pela aplicação
 */
function clearAppCaches() {
  // Lista de todos os caches que a aplicação utiliza
  const cachesToClear = [
    'featuredRecipesCache',
    'featuredRecipesCacheTime',
    'userOrdersCache',
    'userOrdersCacheTime',
    'publishedRecipesCache',
    'publishedRecipesCacheTime'
  ];
  
  cachesToClear.forEach(cacheKey => {
    localStorage.removeItem(cacheKey);
  });
  
  console.log('Caches da aplicação limpos com sucesso');
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', logout);
  });
});
