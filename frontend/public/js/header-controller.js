// header-controller.js - Controla qual versão do header deve ser exibida

document.addEventListener('DOMContentLoaded', function() {
  // Obtenha a referência ao componente do header
  const headerComponent = document.querySelector('header-component');
  
  // Se o componente header existe e não tem um atributo variant explícito
  if (headerComponent && !headerComponent.hasAttribute('variant')) {
    // Verifica se o usuário está logado
    const isLoggedIn = localStorage.getItem('token') !== null;
    
    if (isLoggedIn) {
      // Obtenha as informações do usuário
      const user = getCurrentUser();
      
      // Define o atributo variant com base no tipo de usuário
      if (isAdmin(user)) {
        // Se estamos em uma página admin e o usuário é admin
        if (window.location.pathname.includes('admin')) {
          headerComponent.setAttribute('variant', 'admin');
        } else {
          // Se estamos em uma página normal, mas o usuário é admin
          headerComponent.setAttribute('variant', 'client');
        }
      } else {
        // Usuário normal sempre vê o header client
        headerComponent.setAttribute('variant', 'client');
      }
    } else {
      // Usuário não logado sempre vê o header client
      headerComponent.setAttribute('variant', 'client');
    }
  }
});

// Obtenha informações do usuário atual
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
}

// Verificar se o usuário é administrador
function isAdmin(user) {
  return user && (user.type === 'admin' || user.isAdmin === true);
}
