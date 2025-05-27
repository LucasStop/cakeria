document.addEventListener('DOMContentLoaded', function () {
  const headerComponent = document.querySelector('header-component');

  if (headerComponent && !headerComponent.hasAttribute('variant')) {
    const isLoggedIn = localStorage.getItem('token') !== null;

    if (isLoggedIn) {
      const user = getCurrentUser();

      if (isAdmin(user)) {
        if (window.location.pathname.includes('admin')) {
          headerComponent.setAttribute('variant', 'admin');
        } else {
          headerComponent.setAttribute('variant', 'client');
        }
      } else {
        headerComponent.setAttribute('variant', 'client');
      }
    } else {
      headerComponent.setAttribute('variant', 'client');
    }
  }
});

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
}

function isAdmin(user) {
  return user && (user.type === 'admin' || user.isAdmin === true);
}
