document.addEventListener('DOMContentLoaded', () => {
  // Verifica se o usuário está autenticado
  protectPage();

  // Obtém os dados do usuário
  const user = getCurrentUser();
  
  // Atualiza o nome do usuário na página
  updateUserDisplay(user);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  loadDashboardData();
});

function updateUserDisplay(user) {
  if (!user) return;
  
  const usernameElement = document.getElementById('username');
  if (usernameElement) {
    usernameElement.textContent = user.name || user.email;
  }
  
  const avatarInitial = document.querySelector('.avatar-initial');
  if (avatarInitial && user.name) {
    const nameParts = user.name.split(' ');
    let initials = nameParts[0][0]; 
    
    if (nameParts.length > 1) {
      initials += nameParts[nameParts.length - 1][0];
    }
    
    avatarInitial.textContent = initials.toUpperCase();
  } else if (avatarInitial && user.email) {
    avatarInitial.textContent = user.email[0].toUpperCase();
  }
}

async function loadDashboardData() {
  try {
    // Aqui você pode adicionar chamadas à API para carregar
    // dados específicos do usuário, como pedidos recentes
    
    // Exemplo:
    // const token = localStorage.getItem('token');
    // const response = await fetch('http://localhost:3001/api/user/dashboard', {
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // });
    // const data = await response.json();
    // renderDashboardData(data);
    
  } catch (error) {
    console.error('Erro ao carregar dados da dashboard:', error);
  }
}
